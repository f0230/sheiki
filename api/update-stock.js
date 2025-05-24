// /api/update-stock.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método no permitido' });
    }

    const {
        items,
        estado_pago = 'aprobado',
        id_usuario = null,
        email_usuario = null,
        datos_envio = {},
    } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: 'Items inválidos' });
    }

    try {
        let total = 0;

        for (const item of items) {
            const { id, color, talle, quantity, precio } = item;

            const { data: variante, error: fetchError } = await supabase
                .from('variantes')
                .select('*')
                .eq('producto_id', id)
                .eq('color', color)
                .eq('talle', talle)
                .single();

            if (fetchError || !variante) {
                console.error('Error buscando variante:', fetchError);
                continue;
            }

            const nuevoStock = Math.max(variante.stock - quantity, 0);

            const { error: updateError } = await supabase
                .from('variantes')
                .update({ stock: nuevoStock })
                .eq('id', variante.id);

            if (updateError) {
                console.error('Error actualizando stock:', updateError);
            }

            total += precio * quantity;
        }

        // Costo de envío
        const costoEnvio = datos_envio?.shippingCost || 0;
        const envioGratis = total >= 1800 || datos_envio?.tipoEntrega === 'retiro';
        const totalFinal = total + costoEnvio;

        const orden = {
            id_usuario,
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

        const { error: insertError } = await supabase
            .from('ordenes')
            .insert([orden]);

        if (insertError) {
            console.error('❌ Error al guardar orden:', insertError);
        }

        return res.status(200).json({ success: true });
    } catch (err) {
        console.error('❌ Error general en update-stock:', err);
        return res.status(500).json({ error: 'Error interno del servidor' });
    }
}
