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

        console.log('🧾 Datos crudos recibidos:');
        console.log('items:', items);
        console.log('shippingCost:', shippingCost);

        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ error: 'Items inválidos o vacíos' });
        }

        const filteredItems = items
            .filter((item) =>
                item &&
                item.id &&
                item.nombre &&
                !isNaN(Number(item.precio)) &&
                !isNaN(Number(item.quantity)) &&
                Number(item.precio) > 0 &&
                Number(item.quantity) > 0
            )
            .map((item) => ({
                id: item.id,
                title: item.nombre,
                unit_price: Number(item.precio),
                quantity: Number(item.quantity),
            }));

        if (filteredItems.length === 0) {
            return res.status(400).json({ error: 'Todos los productos tienen precio o cantidad inválida' });
        }

        // Agregamos el ítem del envío si corresponde
        if (!isNaN(Number(shippingCost)) && Number(shippingCost) > 0) {
            filteredItems.push({
                title: `Costo de envío (${shippingData?.tipoEntrega || 'entrega'})`,
                unit_price: Number(shippingCost),
                quantity: 1,
            });
        }

        const totalMonto = filteredItems.reduce(
            (acc, item) => acc + item.unit_price * item.quantity,
            0
        );

        if (totalMonto <= 0) {
            console.error('[create-preference] ❌ Monto total inválido:', totalMonto);
            return res.status(400).json({ error: 'El monto total de la orden es 0. No se puede procesar el pago.' });
        }

        const externalReference = `orden-${Date.now()}`;

        const preference = {
            items: filteredItems,
            external_reference: externalReference,
            metadata: {
                ...shippingData,
                shipping_cost: Number(shippingCost || 0),
                items, // los originales, para trazabilidad
                externalReference,
            },
        };

        const response = await preferenceClient.create({ body: preference });

        return res.status(200).json({ preference: response });
    } catch (error) {
        console.error('[create-preference] Error crítico:', error.message, error.stack);
        return res.status(500).json({
            error: 'Error al crear preferencia',
            details: error.message,
        });
    }
}
