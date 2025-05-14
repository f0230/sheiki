const mercadopago = require('mercadopago');

mercadopago.configure({
    access_token: 'TEST-6554051931792691-051417-c5fd72e5011d10e73eef50933021d032-732478849',
});

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        const { items } = req.body;

        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ message: 'Items inválidos o vacíos' });
        }

        const preference = {
            items: items.map(item => ({
                title: item.nombre,
                unit_price: item.precio,
                quantity: item.quantity,
            })),
            back_urls: {
                success: 'https://sheiki.vercel.app/success',
                failure: 'https://sheiki.vercel.app/failure',
                pending: 'https://sheiki.vercel.app/pending',
            },
            auto_return: 'approved',
        };

        const response = await mercadopago.preferences.create(preference);
        return res.status(200).json({ preference: response.body });
    } catch (err) {
        console.error('[create-preference] Error:', err);
        return res.status(500).json({ error: err.message });
    }
};
