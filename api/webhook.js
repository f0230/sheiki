import { createClient } from '@supabase/supabase-js';
import { MercadoPagoConfig } from 'mercadopago';

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

const mp = new MercadoPagoConfig({
    accessToken: process.env.MP_ACCESS_TOKEN,
});

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).send('Método no permitido');
    }

    const { type, data } = req.body;

    if (type !== 'payment') {
        return res.status(200).send('Evento ignorado');
    }

    try {
        // 1. Obtener info del pago
        const paymentId = data.id;
        const payment = await mp.payment.get({ id: paymentId });

        if (payment.status !== 'approved') {
            return res.status(200).send('Pago no aprobado, ignorado');
        }

        const metadata = payment.metadata || {};
        const items = payment.additional_info?.items || [];

        // 2. Procesar stock y orden
        let total = 0;

        for (const item of items) {
            const { id, color, talle, quantity, unit_price } = item;

            const { data: variante, error: fetchError } = await supabase
                .from('variantes')
                .select('*')
                .eq('producto_id', id)
                .eq('color', color)
                .eq('talle', talle)
                .single();

            if (fetchError || !variante) {
                console.error('⚠️ Variante no encontrada:', { id, color, talle });
                continue;
            }

            const nuevoStock = Math.max(variante.stock - quantity, 0);

            const { error: updateError } = await supabase
                .from('variantes')
                .update({ stock: nuevoStock })
                .eq('id', variante.id);

            if (updateError) {
                console.error('❌ Error actualizando stock:', updateError);
            } else {
                console.log(`✅ Stock actualizado para variante ID ${variante.id}`);
            }

            total += unit_price * quantity;
        }

        const costoEnvio = metadata.shippingCost || 0;
        const envioGratis = total >= 1800 || metadata.tipoEntrega === 'retiro';
        const totalFinal = total + costoEnvio;

        const orden = {
            id_usuario: null,
            email_usuario: payment.payer?.email ?? null,
            items_comprados: items,
            total: totalFinal,
            estado_pago: 'aprobado',
            nombre: metadata.nombre ?? null,
            telefono: metadata.telefono ?? null,
            direccion: metadata.direccion ?? null,
            departamento: metadata.departamento ?? null,
            tipo_entrega: metadata.tipoEntrega ?? null,
            costo_envio: costoEnvio,
            envio_gratis: envioGratis,
        };

        const { error: insertError } = await supabase.from('ordenes').insert([orden]);

        if (insertError) {
            console.error('❌ Error al guardar orden desde webhook:', insertError);
        }

        return res.status(200).send('Orden procesada exitosamente');
    } catch (err) {
        console.error('❌ Error general en webhook:', err);
        return res.status(500).send('Error procesando webhook');
    }
}
