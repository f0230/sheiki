import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

const procesarOrden = async ({ items, estado_pago, email_usuario, email_cliente = null, id_usuario = null, datos_envio }) => {
    let total = 0;

    for (const item of items) {
        const { id, color, talle, quantity, precio = item.unit_price } = item;

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

        total += precio * quantity;
    }

    const costoEnvio = datos_envio?.shippingCost || 0;
    const envioGratis = total >= 1800 || datos_envio?.tipoEntrega === 'retiro';
    const totalFinal = total + costoEnvio;

    const orden = {
        id_usuario,
        email_usuario,
        email_cliente,
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
        fecha: new Date().toISOString(),
    };

    console.log('📝 Guardando orden en Supabase:', orden);

    const { error: insertError } = await supabase.from('ordenes').insert([orden]);
    if (insertError) {
        console.error('❌ Error al guardar orden:', insertError);
    } else {
        console.log('✅ Orden guardada correctamente.');
    }
};

export default async function handler(req, res) {
    console.log('🔥 Webhook disparado');
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

        const items = payment.metadata?.items || [];
        const email_usuario = payment.payer?.email ?? null;
        const datos_envio = payment.metadata?.shippingData || {};
        const email_cliente = datos_envio?.email ?? null;

        console.log('📦 Items desde metadata:', items);
        console.log('📧 Email usuario:', email_usuario);
        console.log('📫 Datos de envío:', datos_envio);

        await procesarOrden({
            items,
            estado_pago: 'aprobado',
            email_usuario,
            email_cliente,
            datos_envio,
        });

        console.log('✅ Orden procesada y stock actualizado desde webhook.');

        return res.status(200).send('Orden procesada desde webhook');
    } catch (err) {
        console.error('❌ Error en webhook:', err);
        return res.status(500).send('Error procesando webhook');
    }
}