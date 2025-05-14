// api/create-preference.js
import mercadopago from 'mercadopago';

// Inicializa Mercado Pago con tu access token
mercadopago.configurations.setAccessToken('TEST-3163063679169777-051318-9609ee83ed38775754d91789d583ea1f-732478849'); // Reemplaza con tu access token

export default async function handler(req, res) {
    if (req.method === 'POST') {
        const { items } = req.body;

        // Crea la preferencia usando los productos del carrito
        const preference = {
            items: items.map(item => ({
                title: item.nombre,
                unit_price: item.precio,
                quantity: item.quantity,
            })),
            back_urls: {
                success: 'https://sheiki.vercel.app/success',  // Redirige a la página de éxito
                failure: 'https://sheiki.vercel.app/failure',  // Redirige a la página de fallo
                pending: 'https://sheiki.vercel.app/pending',  // Redirige a la página de pago pendiente
            },
            auto_return: 'approved',
        };

        try {
            // Crea la preferencia
            const response = await mercadopago.preferences.create(preference);

            // Devuelve la preferencia al frontend
            res.status(200).json({ preference: response.body });
        } catch (error) {
            // Manejo de errores
            res.status(500).json({ error: error.message });
        }
    } else {
        // Si no es una solicitud POST
        res.status(405).json({ message: 'Method Not Allowed' });
    }
}
