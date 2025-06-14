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
        const { order_id } = req.body;

        if (!order_id) {
            return res.status(400).json({ message: 'Falta el ID de la orden (order_id)' });
        }

        // Buscar la orden
        const { data: order, error: fetchError } = await supabase
            .from('ordenes')
            .select('*')
            .eq('external_reference', order_id)
            .single();

        if (fetchError || !order) {
            return res.status(404).json({ message: `Orden con referencia "${order_id}" no encontrada.` });
        }

        if (order.estado_pago !== 'pending_transferencia') {
            return res.status(409).json({ message: `La orden ya tiene el estado "${order.estado_pago}". No se puede procesar.` });
        }

        // Parsear items_comprados
        let parsedItems;
        try {
            parsedItems = typeof order.items_comprados === 'string'
                ? JSON.parse(order.items_comprados)
                : order.items_comprados;
        } catch (parseErr) {
            return res.status(500).json({ message: 'Error al interpretar los items comprados.', details: parseErr.message });
        }

        console.log(`🛒 Procesando orden ${order_id} - Deducción de stock...`);
        const stockResult = await deductStock(parsedItems);

        if (!stockResult.success) {
            return res.status(500).json({ message: 'Error crítico al deducir el stock.', details: stockResult.error });
        }

        const { error: updateError } = await supabase
            .from('ordenes')
            .update({ estado_pago: 'approved' })
            .eq('id', order.id);

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
