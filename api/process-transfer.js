import { createClient } from '@supabase/supabase-js';
import { deductStock } from '../src/lib/stock-manager.js';

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Método no permitido' });
    }

    try {
        console.log('📦 Payload recibido:', req.body);

        const { order_id, items_comprados, datos_envio, shippingCost } = req.body;

        if (!order_id || !items_comprados || !datos_envio) {
            console.error('❌ Faltan datos obligatorios:', { order_id, items_comprados, datos_envio });
            return res.status(400).json({ message: 'Faltan datos obligatorios para registrar la orden.' });
        }

        const {
            nombre,
            email,
            telefono,
            direccion,
            departamento,
            tipoEntrega
        } = datos_envio;

        const envioGratis = Number(shippingCost || 0) === 0;
        const total = items_comprados.reduce((acc, item) => acc + item.precio * item.quantity, 0) + Number(shippingCost || 0);

        // Verificar si ya existe la orden
        const { data: existingOrder, error: fetchError } = await supabase
            .from('ordenes')
            .select('id')
            .eq('external_reference', order_id)
            .maybeSingle();

        if (fetchError) {
            console.error('❌ Error al verificar orden existente:', fetchError);
            return res.status(500).json({ message: 'Error al verificar existencia de orden', details: fetchError.message });
        }

        if (!existingOrder) {
            const { error: insertError } = await supabase.from('ordenes').insert([
                {
                    external_reference: order_id,
                    items_comprados, // Asegurate que sea JSONB en la tabla
                    estado_pago: 'pending_transferencia',
                    tipo_pago: 'manual_transfer',
                    total,
                    email_cliente: email,
                    nombre,
                    telefono,
                    direccion,
                    departamento,
                    tipo_entrega: tipoEntrega,
                    costo_envio: Number(shippingCost || 0),
                    envio_gratis: envioGratis,
                    fecha: new Date().toISOString(),
                    created_at: new Date().toISOString(),
                },
            ]);

            if (insertError) {
                console.error('❌ Error al insertar orden:', insertError);
                return res.status(500).json({ message: 'Error al guardar la orden', details: insertError.message });
            }

            console.log(`🧾 Orden por transferencia creada correctamente (${order_id})`);
        } else {
            console.log(`ℹ️ Orden ya existente con referencia (${order_id}), se omite inserción.`);
        }

        const stockResult = await deductStock(items_comprados);
        if (!stockResult.success) {
            return res.status(500).json({ message: 'Error al deducir stock', details: stockResult.error });
        }

        return res.status(200).json({ message: `Orden ${order_id} registrada correctamente.` });
    } catch (error) {
        console.error('❌ Error inesperado al procesar transferencia:', error);
        return res.status(500).json({ message: 'Error interno del servidor', details: error.message });
    }
}
