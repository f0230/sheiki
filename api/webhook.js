export default async function handler(req, res) {
    if (req.method !== 'POST') {
        console.warn('🚫 Método no permitido:', req.method);
        return res.status(405).send('Método no permitido');
    }

    try {
        console.log('🔔 Webhook recibido:', JSON.stringify(req.body, null, 2));

        const { type, data } = req.body;

        if (type !== 'payment' || !data?.id) {
            console.warn('⚠️ Evento ignorado o sin ID válido');
            return res.status(200).send('Evento ignorado');
        }

        console.log('📥 Buscando información de pago ID:', data.id);

        const response = await fetch(`https://api.mercadopago.com/v1/payments/${data.id}`, {
            headers: {
                Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`,
                'Content-Type': 'application/json',
            },
        });

        const payment = await response.json();

        console.log('📄 Detalles del pago:', payment);

        if (!payment || payment.status !== 'approved') {
            console.warn('⚠️ Pago no aprobado o no encontrado');
            return res.status(200).send('Pago no aprobado');
        }

        const items = payment.additional_info?.items || [];
        const email_usuario = payment.payer?.email ?? null;
        const datos_envio = payment.metadata?.shippingData || {};

        console.log('📦 Items:', items);
        console.log('📧 Email usuario:', email_usuario);
        console.log('📫 Datos de envío:', datos_envio);

        await procesarOrden({
            items,
            estado_pago: 'aprobado',
            email_usuario,
            datos_envio,
        });

        console.log('✅ Orden procesada y stock actualizado desde webhook.');

        return res.status(200).send('Orden procesada desde webhook');
    } catch (err) {
        console.error('❌ Error en webhook:', err);
        return res.status(500).send('Error procesando webhook');
    }
}
