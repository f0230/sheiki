import { MercadoPagoConfig } from 'mercadopago';

const mercadopago = new MercadoPagoConfig({
    accessToken: process.env.MP_ACCESS_TOKEN,
});

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        const { items } = req.body;

        console.log("📥 Items recibidos:", items);

        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ error: 'Items inválidos o vacíos' });
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

        const result = await mercadopago.preferences.create({ body: preference });

        return res.status(200).json({ preference: result });
    } catch (error) {
        console.error('[create-preference] Error:', error.message, error.stack);
        return res.status(500).json({ error: 'Error al crear preferencia', details: error.message });
    }
}
