import { createClient } from '@supabase/supabase-js';

// Utiliza variables de entorno para las credenciales de Supabase
const supabaseAdmin = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY // Clave de servicio para operaciones de backend
);

const procesarOrden = async ({
    items_metadata, // Items como los guardaste en metadata
    estado_pago,
    email_pagador,
    datos_envio,
    external_reference, // Referencia externa de la orden
    payment_id, // ID del pago de Mercado Pago
    monto_total_pagado // Monto total verificado del pago
}) => {
    let totalCalculadoItems = 0;

    // 1. Actualizar stock (basado en items_metadata)
    for (const item of items_metadata) {
        const { product_id, color, size, qty, unit_val } = item; // Usar los nombres de campos de metadata

        const { data: variante, error: fetchError } = await supabaseAdmin
            .from('variantes')
            .select('id, stock, producto_id') // Seleccionar solo lo necesario
            .eq('producto_id', product_id) // Usar product_id
            .eq('color', color)
            .eq('talle', size) // Usar size
            .single();

        if (fetchError || !variante) {
            console.error(`⚠️ Variante no encontrada para webhook (orden ${external_reference}):`, { product_id, color, size, fetchError });
            // Considera cómo manejar este error (¿continuar, registrar, notificar?)
            continue;
        }

        const nuevoStock = Math.max(variante.stock - qty, 0);
        const { error: updateError } = await supabaseAdmin
            .from('variantes')
            .update({ stock: nuevoStock })
            .eq('id', variante.id);

        if (updateError) {
            console.error(`❌ Error actualizando stock para variante ID ${variante.id} (orden ${external_reference}):`, updateError);
        } else {
            console.log(`✅ Stock actualizado para variante ID ${variante.id} (orden ${external_reference})`);
        }
        totalCalculadoItems += unit_val * qty;
    }

    const costoEnvio = Number(datos_envio?.shipping_cost_val) || 0;
    const envioGratis = totalCalculadoItems >= 1800 || datos_envio?.tipoEntrega?.toLowerCase() === 'retiro';
    // El total final debería idealmente ser el `monto_total_pagado` verificado desde Mercado Pago.
    // Usar `monto_total_pagado` es más seguro que recalcular.

    const orden = {
        external_reference: external_reference, // Guardar la referencia de MP
        payment_id: payment_id, // Guardar el ID de pago de MP
        // id_usuario: id_usuario, // Si tienes el ID del usuario logueado
        email_cliente: email_pagador, // Email del pagador
        items_comprados: items_metadata, // Los items como los pasaste en metadata
        total: monto_total_pagado, // Usar el monto real pagado
        estado_pago: estado_pago,
        nombre_cliente: datos_envio?.nombre ?? null,
        telefono_cliente: datos_envio?.telefono ?? null,
        direccion_envio: datos_envio?.direccion ?? null,
        departamento_envio: datos_envio?.departamento ?? null,
        tipo_entrega: datos_envio?.tipoEntrega ?? null,
        costo_envio: costoEnvio,
        envio_gratis: envioGratis,
        fecha_creacion: new Date().toISOString(), // Fecha de creación de la orden en tu sistema
        fecha_pago: new Date().toISOString(), // O la fecha del `payment.date_approved` si prefieres
    };

    console.log(`📝 Guardando orden en Supabase (orden ${external_reference}):`, orden);
    const { data: insertedOrder, error: insertError } = await supabaseAdmin
        .from('ordenes') // Asegúrate que tu tabla se llame 'ordenes'
        .insert([orden])
        .select()
        .single(); // Para obtener la orden insertada si es necesario

    if (insertError) {
        console.error(`❌ Error al guardar orden ${external_reference} en Supabase:`, insertError);
    } else {
        console.log(`✅ Orden ${external_reference} guardada correctamente. ID interno: ${insertedOrder?.id}`);
    }

    // 2. Enviar notificación por Supabase Realtime si el pago fue aprobado
    if (estado_pago === 'aprobado' && external_reference) {
        const channelName = `order_status_${external_reference}`;
        try {
            const { error: realtimeError } = await supabaseAdmin.channel(channelName)
                .send({
                    type: 'broadcast',
                    event: 'payment_update', // Evento genérico
                    payload: {
                        external_reference: external_reference,
                        status: 'approved',
                        message: 'Pago aprobado y procesado por webhook.'
                    },
                });

            if (realtimeError) {
                console.error(`❌ Error enviando notificación Supabase Realtime para ${channelName}:`, realtimeError);
            } else {
                console.log(`✅ Notificación Realtime enviada para ${channelName}`);
            }
        } catch (err) {
            console.error(`❌ Excepción enviando notificación Supabase Realtime para ${channelName}:`, err);
        }
    }
};

export default async function handler(req, res) {
    console.log('🔥 Webhook de Mercado Pago disparado');
    if (req.method !== 'POST') {
        console.warn('🚫 Método no permitido:', req.method);
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const body = req.body;
        console.log('🔔 Webhook recibido:', JSON.stringify(body, null, 2));

        const { type, data, action } = body; // `action` también puede ser útil

        // Validar el tipo de evento. MP envía varios, nos interesa 'payment.updated' o 'payment.created'
        // o el que estés esperando específicamente. 'payment' es un tipo general.
        if (type !== 'payment' || !data?.id) { // El `data.id` es el ID del pago.
            console.warn('⚠️ Evento de webhook ignorado (tipo no es "payment" o falta data.id):', type);
            return res.status(200).send('Evento ignorado o no relevante.');
        }

        // Para webhooks de pago, el `action` puede ser `payment.updated`, `payment.created`, etc.
        // Puedes filtrar por `action` si es necesario, ej: if (action !== 'payment.updated') return ...

        console.log(`📥 Obteniendo detalles del pago ID: ${data.id} desde Mercado Pago.`);
        const paymentResponse = await fetch(`https://api.mercadopago.com/v1/payments/${data.id}`, {
            headers: {
                'Authorization': `Bearer ${process.env.MP_ACCESS_TOKEN}`,
                'Content-Type': 'application/json',
            },
        });

        if (!paymentResponse.ok) {
            const errorText = await paymentResponse.text();
            console.error(`❌ Error obteniendo detalles del pago ${data.id} de MP: ${paymentResponse.status}`, errorText);
            return res.status(paymentResponse.status).json({ error: `Error de API Mercado Pago: ${errorText}` });
        }

        const payment = await paymentResponse.json();
        console.log(`📄 Detalles del pago ${data.id}:`, payment);

        // Solo procesar si el pago está aprobado y tiene una referencia externa
        if (payment.status === 'approved' && payment.external_reference) {
            console.log(`✅ Pago ${payment.id} (orden ${payment.external_reference}) aprobado. Procesando...`);

            const items_from_metadata = payment.metadata?.user_cart_items || []; // Usar el nombre que definiste
            const email_pagador = payment.payer?.email;
            const datos_envio_from_metadata = payment.metadata?.shipping_details || {};

            if (items_from_metadata.length === 0) {
                console.warn(`⚠️ No se encontraron items en metadata para la orden ${payment.external_reference}. Pago ID: ${payment.id}`);
                // Considera qué hacer aquí. Podrías intentar obtenerlos de `additional_info.items` si es un último recurso.
            }

            await procesarOrden({
                items_metadata: items_from_metadata,
                estado_pago: 'aprobado',
                email_pagador: email_pagador,
                datos_envio: datos_envio_from_metadata,
                external_reference: payment.external_reference,
                payment_id: payment.id,
                monto_total_pagado: payment.transaction_amount, // Monto total de la transacción
            });

            console.log(`🚀 Orden ${payment.external_reference} procesada completamente desde webhook.`);
        } else {
            console.warn(`⚠️ Pago ${payment.id} no aprobado o sin external_reference. Estado: ${payment.status}`);
        }

        return res.status(200).send('Webhook recibido y procesado.');

    } catch (err) {
        console.error('❌ Error crítico en el handler del webhook:', err.message, err.stack);
        return res.status(500).json({ error: 'Error interno procesando el webhook.' });
    }
}