export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        const mercadopago = await import('mercadopago');
        mercadopago.default.configure({
            access_token: 'TEST-6554051931792691-051417-c5fd72e5011d10e73eef50933021d032-732478849',
        });

        const payment = await mercadopago.default.payment.create(req.body);
        return res.status(200).json(payment.body);
    } catch (err) {
        console.error('[process_payment] Error:', err);
        return res.status(500).json({ error: err.message });
    }
}
