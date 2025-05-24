import { createClient } from '@supabase/supabase-js';
import { MercadoPagoConfig } from 'mercadopago';

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

const mp = new MercadoPagoConfig({
    accessToken: process.env.MP_ACCESS_TOKEN,
});

const procesarOrden = async ({ items, estado_pago, email_usuario, datos_envio }) => {
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
            console.log(`✅ Stock actualizado: variante ID ${variante.id}`);
        }

        total += unit_price * quantity;
    }

    const costoEnvio = datos_envio?.shippingCost || 0;
    const envioGratis = total >= 1800 || datos_envio?.tipoEntrega === 'retiro';
    const totalFinal = total + costoEnvio;

    const orden = {
        id_usuario: null,
        email_usuario,
        items_comprados: items,
        total: totalFinal,
        estado_pago,
        nombre: datos_envio.nombre ?? null,
        telefono: datos_envio.telefono ?? null,
        direccion: datos_envio.direccion ?? null,
        departamento: datos_envio.departamento ?? null,
        tipo_entrega: datos_envio.tipoEntrega ?? null,
        costo_envio: costoEnvio,
        envio_gratis: envioGratis,
    };

    const { error: insertError } = await supabase.from('ordenes').insert([orden]);
    if (insertError) {
        console.error('❌ Error al guardar orden:', insertError);
    }
};

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).send('Método no permitido');
    }

    const { type, data } = req.body;
    if (type !== 'payment') {
        return res.status(200).send('Evento ignorado');
    }

    try {
        const paymentId = data.id;
        const payment = await mp.payment.get({ id: paymentId });

        if (payment.status !== 'approved') {
            return res.status(200).send('Pago no aprobado');
        }

        const metadata = payment.metadata || {};
        const items = payment.additional_info?.items || [];
        const email = payment.payer?.email ?? null;

        await procesarOrden({
            items,
            estado_pago: 'aprobado',
            email_usuario: email,
            datos_envio: metadata,
        });

        return res.status(200).send('Orden procesada');
    } catch (err) {
        console.error('❌ Error en webhook:', err);
        return res.status(500).send('Error procesando webhook');
    }
}
