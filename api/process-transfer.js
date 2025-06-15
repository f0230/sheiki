// /pages/api/process-transfer.js

import { createClient } from '@supabase/supabase-js';
import { deductStock } from '../../lib/stock-manager'; // Importamos la lógica de stock

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Método no permitido' });
    }

    const adminSecret = req.headers.authorization;
    if (adminSecret !== `Bearer ${process.env.ADMIN_SECRET_KEY}`) {
        return res.status(401).json({ message: 'No autorizado' });
    }

    try {
        const { order_id, items_comprados, datos_envio, shippingCost } = req.body;

        if (!order_id || !items_comprados || !datos_envio) {
            return res.status(400).json({ message: 'Faltan datos requeridos (order_id, items_comprados, datos_envio)' });
        }

        // Buscar si la orden ya existe
        const { data: existingOrder, error: fetchError } = await supabase
            .from('ordenes')
            .select('*')
            .eq('external_reference', order_id)
            .single();

        if (fetchError && fetchError.code !== 'PGRST116') {
            return res.status(500).json({ message: 'Error al buscar la orden', details: fetchError.message });
        }

        if (!existingOrder) {
            // Crear nueva orden
            const total = items_comprados.reduce((acc, item) => acc + item.precio * item.quantity, 0) + (shippingCost || 0);

            const { error: insertError } = await supabase.from('ordenes').insert([
                {
                    external_reference: order_id,
                    items_comprados,
                    estado_pago: 'pending_transferencia',
                    total,
                    costo_envio: shippingCost || 0,
                    envio_gratis: (shippingCost || 0) === 0,
                    nombre: datos_envio.nombre,
                    telefono: datos_envio.telefono,
                    direccion: datos_envio.direccion,
                    departamento: datos_envio.departamento,
                    tipo_entrega: datos_envio.tipoEntrega,
                    email_usuario: datos_envio.email,
                    fecha: new Date().toISOString(),
                },
            ]);

            if (insertError) {
                return res.status(500).json({ message: 'Error al crear la orden', details: insertError.message });
            }

            console.log(`🧾 Orden ${order_id} creada con éxito.`);
        }

        // Deducción de stock
        const stockResult = await deductStock(items_comprados);

        if (!stockResult.success) {
            return res.status(500).json({ message: 'Error al deducir el stock.', details: stockResult.error });
        }

        const { error: updateError } = await supabase
            .from('ordenes')
            .update({ estado_pago: 'approved' })
            .eq('external_reference', order_id);

        if (updateError) {
            throw new Error(`Error al actualizar el estado de la orden: ${updateError.message}`);
        }

        console.log(`✅ Orden ${order_id} procesada correctamente.`);
        return res.status(200).json({ message: `Orden ${order_id} procesada exitosamente.` });
    } catch (error) {
        console.error('❌ Error en el servidor al procesar transferencia:', error);
        return res.status(500).json({ message: 'Error en el servidor', details: error.message });
    }
}
