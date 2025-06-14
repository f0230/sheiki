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

        const externalReference = `orden-${Date.now()}`;

        const preference = {
            items: [
                ...items.map((item) => ({
                    id: item.id,
                    title: item.nombre,
                    unit_price: item.precio,
                    quantity: item.quantity,
                })),
                ...(shippingCost > 0 ? [{
                    title: `Costo de envío (${shippingData?.tipoEntrega || 'entrega'})`,
                    unit_price: shippingCost,
                    quantity: 1,
                }] : []),
            ],

            external_reference: crypto.randomUUID(), // o usar el id generado desde tu sistema
            payer: {
                name: shippingData?.nombre || "",
                email: shippingData?.email || "",
                identification: {
                    type: "CI",
                    number: shippingData?.documento || "",
                },
            },

            metadata: {
                ...shippingData,
                shipping_cost: Number(shippingCost),
                items,
                externalReference,
            },

            // ✅ Excluir medios de pago
            payment_methods: {
                excluded_payment_methods: [
                    { id: "master" } // Ejemplo: excluir Mastercard
                ],
                excluded_payment_types: [
                    { id: "ticket" } // Ejemplo: excluir efectivo/boleta
                ],
                installments: 12 // Máximo número de cuotas
            },

            // ✅ Aceptar solo usuarios registrados
            purpose: "wallet_purchase",

            // ✅ Redirección al sitio según estado
            back_urls: {
                success: "https://sheiki.uy/success",
                failure: "https://sheiki.uy/failure",
                pending: "https://sheiki.uy.com/pending",
            },
            auto_return: "approved",

            // ✅ Activar modo binario (opcional)
            binary_mode: true,

            // ✅ Descripción visible en resumen de tarjeta
            statement_descriptor: "SHEIKI",

            // ✅ Vigencia de la preferencia (opcional)
            expires: true,
            expiration_date_from: new Date().toISOString(), // ahora
            expiration_date_to: new Date(Date.now() + 3600000).toISOString(), // +1 hora
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