import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

const procesarOrdenYNotificar = async ({
    items_metadata,
    estado_pago,
    email_pagador,
    datos_envio,
    external_reference,
    payment_id,
    monto_total_pagado,
    fecha_aprobacion_pago // Fecha en que MP aprobó el pago
}) => {
    console.log(`[webhook-procesar] Iniciando procesamiento para orden: ${external_reference}, pago ID: ${payment_id}`);
    let totalCalculadoItems = 0;

    // 1. Actualizar stock y calcular total (basado en items_metadata)
    for (const item of items_metadata) {
        const { product_ref_id, color, size, qty, unit_val } = item;

        const { data: variante, error: fetchError } = await supabaseAdmin
            .from('variantes')
            .select('id, stock')
            .eq('producto_id', product_ref_id)
            .eq('color', color)
            .eq('talle', size)
            .single();

        if (fetchError || !variante) {
            console.error(`[webhook-procesar] ⚠️ Variante no encontrada para ${external_reference}:`, { product_ref_id, color, size, fetchError });
            continue;
        }

        const nuevoStock = Math.max(Number(variante.stock) - Number(qty), 0);
        const { error: updateError } = await supabaseAdmin
            .from('variantes')
            .update({ stock: nuevoStock })
            .eq('id', variante.id);

        if (updateError) {
            console.error(`[webhook-procesar] ❌ Error actualizando stock para var. ${variante.id} (orden ${external_reference}):`, updateError);
        } else {
            console.log(`[webhook-procesar] ✅ Stock actualizado para var. ${variante.id} (orden ${external_reference})`);
        }
        totalCalculadoItems += Number(unit_val) * Number(qty);
    }

    const costoEnvio = Number(datos_envio?.calculated_shipping_cost) || 0;
    const envioGratis = totalCalculadoItems >= 1800 || datos_envio?.tipoEntrega?.toLowerCase() === 'retiro';

    const orden = {
        external_reference: external_reference,
        payment_id: payment_id,
        email_cliente: email_pagador,
        items_comprados: items_metadata,
        total: Number(monto_total_pagado),
        estado_pago: estado_pago,
        nombre_cliente: datos_envio?.nombre ?? null,
        telefono_cliente: datos_envio?.telefono ?? null,
        direccion_envio: datos_envio?.direccion ?? null,
        departamento_envio: datos_envio?.departamento ?? null,
        tipo_entrega: datos_envio?.tipoEntrega ?? null,
        costo_envio: costoEnvio,
        envio_gratis: envioGratis,
        fecha_creacion: new Date().toISOString(), // Hora del webhook
        fecha_pago_aprobado: fecha_aprobacion_pago ? new Date(fecha_aprobacion_pago).toISOString() : new Date().toISOString(),
    };

    console.log(`[webhook-procesar] 📝 Guardando orden en Supabase (${external_reference}):`, orden);
    const { data: insertedOrder, error: insertError } = await supabaseAdmin
        .from('ordenes')
        .insert([orden])
        .select('id') // Solo el ID si es lo único que necesitas
        .single();

    if (insertError) {
        console.error(`[webhook-procesar] ❌ Error al guardar orden ${external_reference} en Supabase:`, insertError);
        // Considera no enviar notificación Realtime si la orden no se pudo guardar
        return;
    } else {
        console.log(`[webhook-procesar] ✅ Orden ${external_reference} guardada. ID interno: ${insertedOrder?.id}`);
    }

    // 2. Enviar notificación por Supabase Realtime
    if (estado_pago === 'aprobado' && external_reference) {
        const channelName = `order_status_${external_reference}`;
        const messagePayload = {
            type: 'broadcast',
            event: 'payment_update',
            payload: {
                external_reference: external_reference,
                status: 'approved',
                message: 'Pago aprobado y procesado por webhook.',
                order_id_interno: insertedOrder?.id // Opcional: enviar ID interno
            },
        };
        try {
            console.log(`[webhook-procesar] 📡 Intentando enviar mensaje Realtime a canal ${channelName} con payload:`, messagePayload);
            const { error: realtimeError } = await supabaseAdmin.channel(channelName).send(messagePayload);

            if (realtimeError) {
                console.error(`[webhook-procesar] ❌ Error enviando notificación Supabase Realtime para ${channelName}:`, realtimeError);
            } else {
                console.log(`[webhook-procesar] ✅ Notificación Realtime enviada para ${channelName}`);
            }
        } catch (err) {
            console.error(`[webhook-procesar] ❌ Excepción al enviar notificación Supabase Realtime para ${channelName}:`, err);
        }
    }
};

export default async function handler(req, res) {
    console.log('[webhook] 🔥 Webhook de Mercado Pago recibido.');
    if (req.method !== 'POST') {
        console.warn('[webhook] 🚫 Método no permitido:', req.method);
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const body = req.body;
        console.log('[webhook] 🔔 Cuerpo del webhook:', JSON.stringify(body, null, 2));

        const { type, data, action } = body;

        if (type !== 'payment' || !data?.id) {
            console.warn('[webhook] ⚠️ Evento ignorado (tipo no es "payment" o falta data.id):', type);
            return res.status(200).json({ message: 'Evento ignorado o no relevante.' });
        }

        // Puedes ser más específico con la acción si es necesario, ej:
        // if (action !== 'payment.updated' && action !== 'payment.created') {
        //     console.warn(`[webhook] ⚠️ Acción de evento ignorada: ${action}`);
        //     return res.status(200).json({ message: `Acción ${action} ignorada.` });
        // }

        const paymentId = data.id;
        console.log(`[webhook] 📥 Obteniendo detalles del pago ID: ${paymentId} desde Mercado Pago.`);
        const paymentResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
            headers: {
                'Authorization': `Bearer ${process.env.MP_ACCESS_TOKEN}`,
                'Content-Type': 'application/json',
            },
        });

        if (!paymentResponse.ok) {
            const errorText = await paymentResponse.text();
            console.error(`[webhook] ❌ Error obteniendo detalles del pago ${paymentId} de MP: ${paymentResponse.status}`, errorText);
            return res.status(paymentResponse.status).json({ error: `Error de API Mercado Pago al obtener pago: ${errorText}` });
        }

        const payment = await paymentResponse.json();
        console.log(`[webhook] 📄 Detalles completos del pago ${paymentId}:`, JSON.stringify(payment, null, 2));

        const externalRef = payment.external_reference;
        const paymentStatus = payment.status;
        const dateApproved = payment.date_approved;

        if (paymentStatus === 'approved' && externalRef) {
            console.log(`[webhook] ✅ Pago ${paymentId} (orden ${externalRef}) APROBADO. Iniciando procesamiento.`);

            const items_from_metadata = payment.metadata?.app_user_cart_items || [];
            const email_pagador = payment.payer?.email;
            const datos_envio_from_metadata = payment.metadata?.app_shipping_details || {};

            if (items_from_metadata.length === 0) {
                console.warn(`[webhook] ⚠️ No se encontraron items en metadata (app_user_cart_items) para la orden ${externalRef}. Pago ID: ${paymentId}`);
                // Aquí podrías intentar obtenerlos de `payment.additional_info.items` como fallback
                // const fallbackItems = payment.additional_info?.items?.map(item => ({...}));
            }

            await procesarOrdenYNotificar({
                items_metadata,
                estado_pago: 'aprobado',
                email_pagador,
                datos_envio: datos_envio_from_metadata,
                external_reference: externalRef,
                payment_id: paymentId,
                monto_total_pagado: payment.transaction_amount,
                fecha_aprobacion_pago: dateApproved,
            });

            console.log(`[webhook] 🚀 Orden ${externalRef} procesada completamente desde webhook.`);
        } else {
            console.warn(`[webhook] ⚠️ Pago ${paymentId} NO aprobado o SIN external_reference. Estado: ${paymentStatus}, ExternalRef: ${externalRef}. No se procesa la orden.`);
            // Considera enviar una notificación Realtime para otros estados si es útil para el frontend
            // if (externalRef) { /* Enviar mensaje Realtime con estado paymentStatus */ }
        }

        return res.status(200).json({ message: 'Webhook recibido y procesado según estado.' });

    } catch (err) {
        console.error('[webhook] ❌ Error crítico en el handler del webhook:', err.message, err.stack);
        return res.status(500).json({ error: 'Error interno del servidor al procesar el webhook.' });
    }
}