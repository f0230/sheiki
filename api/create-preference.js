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
            !item.id || !item.nombre || item.precio == null || item.quantity == null
        );

        if (hasInvalidItem) {
            return res.status(400).json({ error: 'Uno o más items tienen campos faltantes' });
        }

        const externalReference = `orden-${Date.now()}`;

        const itemList = [
            ...items.map((item) => ({
                id: item.id,
                title: item.nombre,
                unit_price: Number(item.precio || 0),
                quantity: Number(item.quantity || 0),
            })),
            ...(shippingCost > 0 ? [{
                title: `Costo de envío (${shippingData?.tipoEntrega || 'entrega'})`,
                unit_price: Number(shippingCost || 0),
                quantity: 1,
            }] : []),
        ];

        const totalMonto = itemList.reduce((acc, item) => acc + item.unit_price * item.quantity, 0);

        if (totalMonto <= 0) {
            console.error('[create-preference] ❌ Monto total inválido:', totalMonto);
            return res.status(400).json({ error: 'El monto total es 0. No se puede procesar el pago.' });
        }

        console.log('🧾 Total preferencia:', totalMonto);
        console.log('📦 Items:', itemList);

        const preference = {
            items: itemList,
            external_reference: externalReference,
            metadata: {
                ...shippingData,
                shipping_cost: Number(shippingCost),
                items,
                externalReference,
            },
        };

        const response = await preferenceClient.create({ body: preference });

        return res.status(200).json({ preference: response });
    } catch (error) {
        console.error('[create-preference] Error:', error.message, error.stack);
        return res.status(500).json({
            error: 'Error al crear preferencia',
            details: error.message,
        });
    }
}
