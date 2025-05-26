import { MercadoPagoConfig, Preference } from 'mercadopago';

const client = new MercadoPagoConfig({
    accessToken: process.env.MP_ACCESS_TOKEN,
});

const preferenceClient = new Preference(client);

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    console.log('[create-preference] Iniciando creación de preferencia...');

    try {
        const { items, shippingData, shippingCost } = req.body;

        if (!items || !Array.isArray(items) || items.length === 0) {
            console.warn('[create-preference] Items inválidos o vacíos.');
            return res.status(400).json({ error: 'Items inválidos o vacíos' });
        }

        const hasInvalidItem = items.some(item =>
            !item.id || !item.nombre || !item.precio || !item.quantity
        );

        if (hasInvalidItem) {
            console.warn('[create-preference] Uno o más items tienen campos faltantes.');
            return res.status(400).json({ error: 'Uno o más items tienen campos faltantes' });
        }

        const externalReference = `sheiki-order-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        console.log(`[create-preference] Generada external_reference: ${externalReference}`);

        const preferenceBody = {
            items: [
                ...items.map((item) => ({
                    id: String(item.id), // Asegurar que ID sea string si es necesario
                    title: `${item.nombre} - ${item.color} / T${item.talle}`,
                    unit_price: Number(item.precio),
                    quantity: Number(item.quantity),
                    currency_id: 'UYU',
                })),
                ...(shippingCost > 0 ? [{
                    id: 'shipping_cost', // ID para el item de envío
                    title: `Costo de envío (${shippingData?.tipoEntrega || 'N/A'})`,
                    unit_price: Number(shippingCost),
                    quantity: 1,
                    currency_id: 'UYU',
                }] : []),
            ],
            back_urls: {
                success: 'https://sheiki.uy/success',
                failure: 'https://sheiki.uy/failure',
                pending: 'https://sheiki.uy/pending',
            },
            auto_return: 'approved',
            external_reference: externalReference,
            notification_url: `https://sheiki.uy/api/webhook`, // Tu endpoint de webhook
            metadata: {
                // Guarda aquí solo lo que realmente necesites en el webhook y no esté en el objeto `payment`
                // `external_reference` ya está en el nivel superior de la preferencia.
                // Mercado Pago puede incluir los `items` de la preferencia en el objeto `payment` (en `additional_info.items`).
                // Es bueno tenerlos en metadata como respaldo.
                app_shipping_details: { ...shippingData, calculated_shipping_cost: Number(shippingCost) },
                app_user_cart_items: items.map(item => ({
                    product_ref_id: item.id, // Usa un nombre de campo que no colisione
                    name: item.nombre,
                    color: item.color,
                    size: item.talle,
                    qty: item.quantity,
                    unit_val: item.precio
                })),
            },
        };

        console.log("[create-preference] Cuerpo de la preferencia a enviar a MP:", JSON.stringify(preferenceBody, null, 2));

        const mpResponse = await preferenceClient.create({ body: preferenceBody });

        console.log("[create-preference] Respuesta de Mercado Pago:", JSON.stringify(mpResponse, null, 2));

        // La respuesta de `mpResponse` ya contiene `id` (preference_id) y `external_reference`.
        // Devolver el objeto `preference` que contiene toda la información.
        return res.status(201).json({ preference: mpResponse });

    } catch (error) {
        console.error('[create-preference] Error al crear preferencia:', error.message, error.cause ? error.cause : '', error.stack);
        const errorDetails = error.cause || error.message || "Error desconocido del SDK de MP.";
        return res.status(500).json({
            error: 'Error interno al crear la preferencia de pago.',
            details: errorDetails,
        });
    }
}