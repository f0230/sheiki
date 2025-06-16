import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

const procesarOrden = async ({ items, estado_pago, email_usuario, email_cliente = null, id_usuario = null, datos_envio }) => {
    let total = 0;

    for (const item of items) {
        const { id, color, talle, quantity, precio = item.unit_price } = item;

        const { data: variante, error: fetchError } = await supabase
            .from('variantes')
            .select('*')
            .eq('producto_id', id)
            .eq('color', color)
            .eq('talle', talle)
            .single();

        if (fetchError || !variante) {
            console.error('⚠️ Variante no encontrada:', { id, color, talle });
            continue;
        }

        const nuevoStock = Math.max(variante.stock - quantity, 0);

        const { error: updateError } = await supabase
            .from('variantes')
            .update({ stock: nuevoStock })
            .eq('id', variante.id);

        if (updateError) {
            console.error('❌ Error actualizando stock:', updateError);
        } else {
            console.log(`✅ Stock actualizado: variante ID ${variante.id}`);
        }

        total += precio * quantity;
    }

    // ✅ Calcular envío correctamente desde snake_case
    const shippingRaw = datos_envio?.shippingCost ?? datos_envio?.shipping_cost;
    const parsedShipping = typeof shippingRaw === 'string' ? parseFloat(shippingRaw) : Number(shippingRaw);
    const costoEnvio = isNaN(parsedShipping) ? 0 : parsedShipping;

    const envioGratis = total >= 1800 || datos_envio?.tipoEntrega === 'retiro';
    const totalFinal = total + costoEnvio;

    // ✅ Fecha local Uruguay en formato ISO válido para Supabase
    const fechaMontevideo = new Date().toLocaleString('en-CA', {
        timeZone: 'America/Montevideo',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
    }).replace(',', '');

    const [datePart, timePart] = fechaMontevideo.split(' ');
    const fechaFinal = `${datePart}T${timePart}-03:00`;

    const orden = {
        id_usuario,
        email_usuario,
        email_cliente,
        items_comprados: items,
        total: totalFinal,
        estado_pago,
        nombre: datos_envio.nombre ?? null,
        telefono: datos_envio.telefono ?? null,
        direccion: datos_envio.direccion ?? null,
        departamento: datos_envio.departamento ?? null,
        tipo_entrega: datos_envio.tipoEntrega ?? null,
        costo_envio: costoEnvio,
        envio_gratis: envioGratis,
        fecha: fechaFinal,
        external_reference: datos_envio.externalReference ?? null,
        metodo_pago: datos_envio.metodo_pago ?? null

    };

    console.log('📝 Guardando orden en Supabase:', orden);

    const { error: insertError } = await supabase.from('ordenes').insert([orden]);
    if (insertError) {
        console.error('❌ Error al guardar orden:', insertError);
    } else {
        console.log('✅ Orden guardada correctamente.');
    }
};

export default async function handler(req, res) {
    console.log('🔥 Webhook disparado');

    if (req.method !== 'POST') {
        console.warn('🚫 Método no permitido:', req.method);
        return res.status(405).send('Método no permitido');
    }

    try {
        console.log('🔔 Webhook recibido:', JSON.stringify(req.body, null, 2));

        const { type, data } = req.body;

        if (type !== 'payment' || !data?.id) {
            console.warn('⚠️ Evento ignorado o sin ID válido');
            return res.status(200).send('Evento ignorado');
        }

        console.log('📥 Buscando información de pago ID:', data.id);

        const response = await fetch(`https://api.mercadopago.com/v1/payments/${data.id}`, {
            headers: {
                Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`,
                'Content-Type': 'application/json',
            },
        });

        const payment = await response.json();

        console.log('📄 Detalles del pago:', payment);

        if (!payment || !['approved', 'pending', 'in_process', 'rejected'].includes(payment.status)) {
            console.warn(`⚠️ Estado no manejado: ${payment?.status}`);
            return res.status(200).send('Pago no procesado');
        }
          

        const externalReference =
            payment.metadata?.externalReference ||
            payment.metadata?.external_reference ||
            payment.external_reference || null;

        if (!externalReference) {
            console.error('❌ externalReference no definido en metadata');
            return res.status(400).send('externalReference faltante');
        }

        const items = payment.metadata?.items || [];
        const email_usuario = payment.payer?.email ?? payment.metadata?.email ?? null;
        const email_cliente = payment.metadata?.email ?? null;

        const datos_envio = {
            nombre: payment.metadata?.nombre || '',
            telefono: payment.metadata?.telefono || '',
            direccion: payment.metadata?.direccion || '',
            departamento: payment.metadata?.departamento || '',
            tipoEntrega: payment.metadata?.tipoEntrega || payment.metadata?.tipo_entrega || '',
            shippingCost: payment.metadata?.shippingCost ?? payment.metadata?.shipping_cost ?? 0,
            externalReference,
            metodo_pago: payment.payment_method_id || null
        };

        console.log('📦 Items desde metadata:', items);
        console.log('📧 Email usuario:', email_usuario);
        console.log('📫 Datos de envío:', datos_envio);

        if (payment.status === 'approved') {
            await procesarOrden({
                items,
                estado_pago: payment.status, // Should be 'approved'
                email_usuario,
                email_cliente,
                datos_envio,
                // Ensure all necessary parameters for procesarOrden are passed (already included in datos_envio or directly)
            });
            console.log('✅ Orden APROBADA procesada y stock actualizado desde webhook.'); // Log message updated for clarity
        } else if (['pending', 'in_process'].includes(payment.status)) {
            console.log(`⏳ Pago con estado '${payment.status}'. No se actualiza stock ni se guarda orden principal por ahora via webhook.`);
            
            const { data: existingOrder, error: queryError } = await supabase
                .from('ordenes')
                .select('id, estado_pago, external_reference')
                .eq('external_reference', externalReference)
                .maybeSingle();

            if (queryError) {
                console.warn(`[webhook] ⚠️ Error al buscar orden existente (${externalReference}) para actualizar estado:`, queryError.message);
            }

            if (existingOrder && existingOrder.estado_pago !== payment.status) {
                console.log(`[webhook] 🔁 Actualizando estado de orden existente (${externalReference}) de '${existingOrder.estado_pago}' a '${payment.status}' (sin afectar stock).`);
                const { error: updateError } = await supabase
                    .from('ordenes')
                    .update({ estado_pago: payment.status, metodo_pago: payment.payment_method_id || existingOrder.metodo_pago }) // Also update payment method if available
                    .eq('external_reference', externalReference); 

                if (updateError) {
                    console.error(`[webhook] ❌ Error al actualizar estado de orden PENDIENTE/IN_PROCESS (${externalReference}):`, updateError.message);
                } else {
                    console.log(`[webhook] ✅ Estado de orden PENDIENTE/IN_PROCESS (${externalReference}) actualizado correctamente a '${payment.status}'.`);
                }
            } else if (existingOrder && existingOrder.estado_pago === payment.status) {
                console.log(`[webhook] ℹ️ Estado de orden (${externalReference}) ya es '${payment.status}'. No se requiere actualización.`);
            } else if (!existingOrder) {
                 console.log(`[webhook] ℹ️ No se encontró orden existente (${externalReference}) con estado PENDIENTE/IN_PROCESS. No se crea nueva orden aquí para evitar duplicados si process_payment ya la creó.`);
                // If the order doesn't exist, we are not creating it here for pending/in_process,
                // as per the primary goal of not processing the order (which includes stock) yet.
                // The /api/process_payment or /api/process-transfer might have already created an initial record.
            } else {
                console.log(`[webhook] ℹ️ No se requiere acción para la orden (${externalReference}) con estado '${payment.status}'.`);
            }
        } else {
            console.log(`ℹ️ Pago con estado '${payment.status}' (e.g., rejected, cancelled). No se guarda orden ni se actualiza stock.`);
            // Consider updating order status to 'rejected' or 'cancelled' if it exists
            const { data: existingOrderToReject, error: queryErrorReject } = await supabase
                .from('ordenes')
                .select('id, estado_pago')
                .eq('external_reference', externalReference)
                .maybeSingle();

            if (queryErrorReject) {
                console.warn(`[webhook] ⚠️ Error al buscar orden existente (${externalReference}) para actualizar a estado RECHAZADO/CANCELADO:`, queryErrorReject.message);
            }

            if (existingOrderToReject && existingOrderToReject.estado_pago !== payment.status && existingOrderToReject.estado_pago !== 'approved') { // Don't overwrite approved
                console.log(`[webhook] 🔁 Actualizando estado de orden existente (${externalReference}) de '${existingOrderToReject.estado_pago}' a '${payment.status}' (RECHAZADO/CANCELADO).`);
                const { error: updateErrorReject } = await supabase
                    .from('ordenes')
                    .update({ estado_pago: payment.status, metodo_pago: payment.payment_method_id || existingOrderToReject.metodo_pago })
                    .eq('external_reference', externalReference);

                if (updateErrorReject) {
                    console.error(`[webhook] ❌ Error al actualizar estado de orden RECHAZADO/CANCELADO (${externalReference}):`, updateErrorReject.message);
                } else {
                    console.log(`[webhook] ✅ Estado de orden RECHAZADO/CANCELADO (${externalReference}) actualizado correctamente a '${payment.status}'.`);
                }
            } else if (existingOrderToReject && existingOrderToReject.estado_pago === payment.status) {
                 console.log(`[webhook] ℹ️ Estado de orden (${externalReference}) ya es '${payment.status}'. No se requiere actualización.`);
            } else if (existingOrderToReject && existingOrderToReject.estado_pago === 'approved') {
                console.log(`[webhook] ⚠️ Orden (${externalReference}) ya está APROBADA. No se cambiará a '${payment.status}'. Contactar soporte si es inesperado.`);
            }
        }
          
        // The general "Orden procesada y stock actualizado desde webhook." log was removed as it's now conditional.
        // Specific logs are inside each condition.

        const channelName = `order_status_${externalReference}`;

        await supabase.channel(channelName)
            .send({
                type: 'broadcast',
                event: 'payment_update',
                payload: {
                    external_reference: externalReference,
                    status: payment.status,
                    status_detail: payment.status_detail || null

                },
            })
            .then(() => console.log(`📣 Evento realtime enviado al canal ${channelName}`))
            .catch(err => console.error('❌ Error enviando evento Realtime:', err));

        return res.status(200).send('Orden procesada y evento Realtime enviado');
    } catch (err) {
        console.error('❌ Error en webhook:', err);
        return res.status(500).send('Error procesando webhook');
    }
}
