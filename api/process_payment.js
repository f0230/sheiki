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

        const idempotencyKey = uuidv4();

        const paymentBody = {
            transaction_amount,
            token,
            description,
            installments,
            payment_method_id,
            issuer_id,
            payer,
            metadata, // Incluye items, email, datos de envío
        };

        const payment = await paymentClient.create({
            body: paymentBody,
            requestOptions: { idempotencyKey },
        });

        // Respuesta: redirigir si tiene external_resource_url
        return res.status(200).json({
            status: payment.status,
            id: payment.id,
            external_reference: payment.external_reference,
            external_resource_url: payment.transaction_details.external_resource_url,
        });
    } catch (err) {
        console.error('[process_payment] ❌ Error:', err);
        return res.status(500).json({ error: 'Error al procesar el pago', details: err.message });
    }
}
