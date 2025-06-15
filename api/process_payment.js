import { MercadoPagoConfig, Payment } from 'mercadopago';
import { v4 as uuidv4 } from 'uuid';

const client = new MercadoPagoConfig({
    accessToken: process.env.MP_ACCESS_TOKEN,
});
const paymentClient = new Payment(client);

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

        // 🛑 Validación básica de campos requeridos
        if (!transaction_amount || !payment_method_id || !payer?.email) {
            return res.status(400).json({
                error: 'Faltan campos obligatorios: transaction_amount, payment_method_id o payer.email',
            });
        }

        // 🛑 Validación defensiva para metadata
        if (!metadata || typeof metadata !== 'object') {
            return res.status(400).json({ error: 'Metadata inválida o ausente' });
        }

        const items = metadata.items;
        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ error: 'Items de la orden faltan o son inválidos' });
        }

        const externalReference = metadata.externalReference || `orden-${Date.now()}`;

        // 🧱 Construcción del cuerpo de pago
        const paymentBody = {
            transaction_amount,
            token: token || null,
            description: description || 'Pago desde Sheiki',
            installments,
            payment_method_id,
            issuer_id,
            payer,
            metadata: {
                ...metadata,
                externalReference,
            },
            external_reference: externalReference,
        };

        const idempotencyKey = uuidv4();

        const payment = await paymentClient.create({
            body: paymentBody,
            requestOptions: { idempotencyKey },
        });

        console.log(`[process_payment] ✅ Pago creado con ID: ${payment.id} - Estado: ${payment.status}`);

        return res.status(200).json({
            status: payment.status,
            id: payment.id,
            external_reference: externalReference,
            external_resource_url: payment.transaction_details?.external_resource_url || null,
            status_detail: payment.status_detail,
        });
    } catch (err) {
        console.error('[process_payment] ❌ Error al crear pago:', {
            message: err.message,
            stack: err.stack,
        });

        return res.status(500).json({
            error: 'Error al procesar el pago',
            details: err.message,
        });
    }
}
