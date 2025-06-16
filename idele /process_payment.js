import { MercadoPagoConfig, Payment } from 'mercadopago';
import { v4 as uuidv4 } from 'uuid';
import { createClient } from '@supabase/supabase-js';

const client = new MercadoPagoConfig({
    accessToken: process.env.MP_ACCESS_TOKEN,
});
const paymentClient = new Payment(client);

// 🧩 Cliente Supabase para actualizar estado de orden si ya existe
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        console.warn('[process_payment] ❌ Método no permitido:', req.method);
        return res.status(405).json({ message: 'Método no permitido' });
    }

    try {
        const {
            token,
            transaction_amount,
            payment_method_id,
            issuer_id,
            payer,
            description,
            installments = 1,
            metadata,
        } = req.body;

        // 🧪 Validaciones básicas
        if (!transaction_amount || !payment_method_id || !payer?.email) {
            return res.status(400).json({
                error: 'Faltan campos obligatorios: transaction_amount, payment_method_id o payer.email',
            });
        }

        // 📦 Validación de metadata e ítems
        if (!metadata || typeof metadata !== 'object') {
            return res.status(400).json({ error: 'Metadata inválida o ausente' });
        }

        const items = metadata.items;
        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ error: 'Items de la orden faltan o son inválidos' });
        }

        // 🧾 Referencia externa única
        const externalReference = metadata.externalReference || `orden-${Date.now()}`;

        // 🏗️ Construcción del cuerpo del pago
        const paymentBody = {
            transaction_amount,
            token: token || undefined,
            description: description || 'Pago desde Sheiki',
            installments,
            payment_method_id,
            issuer_id: issuer_id || undefined,
            payer,
            metadata: {
                ...metadata,
                externalReference,
            },
            external_reference: externalReference,
        };

        const idempotencyKey = uuidv4();

        // 🚀 Crear el pago con Mercado Pago
        const payment = await paymentClient.create({
            body: paymentBody,
            requestOptions: { idempotencyKey },
        });

        console.log(`[process_payment] ✅ Pago creado:`, {
            id: payment.id,
            status: payment.status,
            method: payment.payment_method_id,
            amount: payment.transaction_amount,
        });

        // 🔄 Actualizar estado si la orden ya existe
        const { data: existingOrder, error: queryError } = await supabase
            .from('ordenes')
            .select('id')
            .eq('external_reference', externalReference)
            .maybeSingle();

        if (queryError) {
            console.warn('[process_payment] ⚠️ Error al buscar orden existente:', queryError.message);
        }

        if (existingOrder) {
            console.log(`[process_payment] 🔁 Actualizando estado de orden existente (${externalReference}): ${payment.status}`);
            const { error: updateError } = await supabase
                .from('ordenes')
                .update({ estado_pago: payment.status })
                .eq('id', existingOrder.id);

            if (updateError) {
                console.error('[process_payment] ❌ Error al actualizar orden:', updateError.message);
            } else {
                console.log('[process_payment] ✅ Estado de orden actualizado correctamente');
            }
        }

        // 📤 Respuesta al frontend
        return res.status(200).json({
            status: payment.status,
            status_detail: payment.status_detail,
            id: payment.id,
            external_reference: externalReference,
            external_resource_url: payment.transaction_details?.external_resource_url || null,
        });

    } catch (err) {
        console.error('[process_payment] ❌ Error inesperado al crear el pago:', {
            message: err.message,
            stack: err.stack,
        });

        return res.status(500).json({
            error: 'Error al procesar el pago',
            details: err.message,
        });
    }
}
