import { MercadoPagoConfig, Preference } from 'mercadopago';

const client = new MercadoPagoConfig({
    accessToken: process.env.MP_ACCESS_TOKEN,
});

const preferenceClient = new Preference(client);

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        const { items, shippingData, shippingCost } = req.body;

        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ error: 'Items inválidos o vacíos' });
        }

        const hasInvalidItem = items.some(item =>
            !item.id || !item.nombre || !item.precio || !item.quantity
        );

        if (hasInvalidItem) {
            return res.status(400).json({ error: 'Uno o más items tienen campos faltantes' });
        }

        // Generar una external_reference única y predecible si es posible, o aleatoria.
        // Usar Date.now() y un random string es una buena práctica para unicidad.
        const externalReference = `sheiki-order-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

        const preferenceBody = {
            items: [
                ...items.map((item) => ({
                    id: item.id, // ID del producto en tu sistema
                    title: `${item.nombre} - ${item.color} / T${item.talle}`, // Descripción más detallada
                    unit_price: Number(item.precio),
                    quantity: Number(item.quantity),
                    currency_id: 'UYU', // Moneda (ej. Pesos Uruguayos)
                })),
                ...(shippingCost > 0 ? [{
                    id: 'shipping',
                    title: `Costo de envío (${shippingData?.tipoEntrega || 'entrega'})`,
                    unit_price: Number(shippingCost),
                    quantity: 1,
                    currency_id: 'UYU',
                }] : []),
            ],
            back_urls: {
                success: 'https://sheiki.uy/success', // Asegúrate que estas URLs sean las correctas de producción
                failure: 'https://sheiki.uy/failure',
                pending: 'https://sheiki.uy/pending',
            },
            auto_return: 'approved',
            external_reference: externalReference, // Referencia externa para tu sistema
            notification_url: `https://sheiki.uy/api/webhook`, // URL donde MP enviará notificaciones (tu endpoint de webhook)
            metadata: {
                // Pasa solo los datos necesarios para el webhook y que no estén ya en `payment`
                // `items` ya se envían en el cuerpo de la preferencia y MP los puede devolver.
                // Es útil tenerlos aquí como respaldo o si la estructura de MP cambia.
                shipping_details: { ...shippingData, shipping_cost_val: Number(shippingCost) },
                user_cart_items: items.map(item => ({ // Renombrar para evitar colisión con items de MP
                    product_id: item.id, // Cambiar "id" a algo más específico si es necesario
                    name: item.nombre,
                    color: item.color,
                    size: item.talle, // "talle"
                    qty: item.quantity,
                    unit_val: item.precio
                })),
                // No es necesario pasar externalReference en metadata si ya es un campo de primer nivel.
                // MP lo asocia automáticamente.
            },
            // Podrías añadir información del pagador si la tienes
            // payer: {
            //    email: shippingData.email,
            //    name: shippingData.nombre,
            //    // phone: { area_code: '598', number: shippingData.telefono } // si tienes código de área separado
            // },
        };

        console.log("Creando preferencia con body:", JSON.stringify(preferenceBody, null, 2));

        const response = await preferenceClient.create({ body: preferenceBody });

        // Devuelve la respuesta completa de MP, que incluye el ID de la preferencia
        // y también la external_reference que estableciste.
        console.log("Preferencia creada:", response);
        return res.status(200).json({ preference: response });

    } catch (error) {
        console.error('[create-preference] Error:', error.message, error.stack, error.cause);
        const errorDetails = error.cause || error.message; // MP SDK a veces usa `cause`
        return res.status(500).json({
            error: 'Error al crear la preferencia de pago.',
            details: errorDetails,
        });
    }
}