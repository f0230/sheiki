const mercadopago = require('mercadopago');

// Token desde variable de entorno
mercadopago.configure({
    access_token: process.env.MP_ACCESS_TOKEN,
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
