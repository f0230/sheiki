const mercadopago = require('mercadopago');

mercadopago.configure({
    access_token: 'TEST-6554051931792691-051417-c5fd72e5011d10e73eef50933021d032-732478849',
});

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        const result = await mercadopago.payment.create(req.body);
        res.status(200).json(result.body);
    } catch (error) {
        console.error('[process_payment] Error:', error);
        res.status(500).json({ error: error.message });
    }
};
