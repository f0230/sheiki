import { createClient } from '@supabase/supabase-js';
import { MercadoPagoConfig, Payment } from 'mercadopago'; // ✅ igual que en checkout

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

const mp = new MercadoPagoConfig({
    accessToken: process.env.MP_ACCESS_TOKEN,
});

// ...procesarOrden queda igual...

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).send('Método no permitido');
    }

    try {
        console.log('🔔 Webhook recibido:', req.body);

        const { type, data } = req.body;

        if (type !== 'payment' || !data?.id) {
            return res.status(200).send('Evento ignorado');
        }

        const payment = await Payment.get({ id: data.id }, { config: mp }); // ✅ nuevo

        if (!payment || payment.status !== 'approved') {
            console.warn('⚠️ Pago no aprobado o no encontrado');
            return res.status(200).send('Pago no aprobado');
        }

        const items = payment.additional_info?.items || [];
        const email_usuario = payment.payer?.email ?? null;
        const datos_envio = payment.metadata || {};

        await procesarOrden({
            items,
            estado_pago: 'aprobado',
            email_usuario,
            datos_envio,
        });

        return res.status(200).send('Orden procesada desde webhook');
    } catch (err) {
        console.error('❌ Error en webhook:', err);
        return res.status(500).send('Error procesando webhook');
    }
}
