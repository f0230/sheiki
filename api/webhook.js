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

        if (!payment || !['approved', 'pending', 'in_process'].includes(payment.status)) {
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

        await procesarOrden({
            items,
            estado_pago: payment.status,
            email_usuario,
            email_cliente,
            datos_envio,
        });

        console.log('✅ Orden procesada y stock actualizado desde webhook.');

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
