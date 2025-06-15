import { MercadoPagoConfig, Payment } from 'mercadopago';
import { v4 as uuidv4 } from 'uuid';

const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });
const paymentClient = new Payment(client);

export default async function handler(req, res) {
    if (req.method !== 'POST') {
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
            installments,
            metadata,
        } = req.body;

        if (!transaction_amount || !payment_method_id || !payer?.email) {
            return res.status(400).json({
                error: 'Faltan campos obligatorios como transaction_amount, payment_method_id o payer.email',
            });
        }

        // Si metadata no trae externalReference, lo generamos igual
        const externalReference = metadata?.externalReference || `orden-${Date.now()}`;

        const paymentBody = {
            transaction_amount,
            token,
            description: description || 'Pago desde Sheiki',
            installments: installments || 1,
            payment_method_id,
            issuer_id,
            payer,
            metadata: {
                ...metadata,
                externalReference,
            },
            external_reference: externalReference, // 👈 clave para vincular en el webhook
        };

        const idempotencyKey = uuidv4();

        const payment = await paymentClient.create({
            body: paymentBody,
            requestOptions: { idempotencyKey },
        });

        console.log('[process_payment] ✅ Pago creado:', payment.id);

        return res.status(200).json({
            status: payment.status,
            id: payment.id,
            external_reference: externalReference,
            external_resource_url: payment.transaction_details?.external_resource_url || null,
        });

    } catch (err) {
        console.error('[process_payment] ❌ Error:', err);
        return res.status(500).json({ error: 'Error al procesar el pago', details: err.message });
    }
}
