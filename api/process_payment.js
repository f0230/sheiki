// /api/process_payment.js
import mercadopago from 'mercadopago';

mercadopago.configure({
    access_token: 'TEST-6554051931792691-051417-c5fd72e5011d10e73eef50933021d032-732478849',
});

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).end();

    try {
        const payment = await mercadopago.payment.create(req.body);
        res.status(200).json(payment.body);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}
