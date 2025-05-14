const mercadopago = require('mercadopago');

// Tomar el token desde las variables de entorno de Vercel
mercadopago.configure({
    access_token: process.env.MP_ACCESS_TOKEN,
});

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        const { items } = req.body;

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
        res.status(200).json({ preference: response.body });
    } catch (error) {
        console.error('[create-preference] Error:', error);
        res.status(500).json({ error: error.message });
    }
};
