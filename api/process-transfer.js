const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Método no permitido' });
    }

    try {
        const { order_id, datos_envio, items_comprados, shippingCost } = req.body;

        console.log('📦 Payload recibido:', req.body);

        // Validación básica
        if (!order_id || !datos_envio || !items_comprados || !Array.isArray(items_comprados)) {
            return res.status(400).json({ message: 'Faltan datos obligatorios' });
        }

        const {
            nombre,
            email,
            telefono,
            departamento,
            tipoEntrega,
            direccion
        } = datos_envio;

        if (!email) {
            return res.status(400).json({ message: 'El email del cliente es obligatorio' });
        }

        // Calcular monto total
        const montoProductos = items_comprados.reduce((total, item) => {
            return total + item.precio * item.quantity;
        }, 0);
        const montoFinal = montoProductos + shippingCost;

        // Insertar orden en Supabase
        const { error } = await supabase.from('ordenes').insert({
            order_id,
            datos_envio,
            items_comprados,
            shippingCost,
            monto: montoFinal,
            estado: 'pending_transferencia',
            medio_pago: 'manual_transfer',
            nombre,
            telefono,
            direccion,
            departamento,
            tipo_entrega: tipoEntrega,
            email_usuario: email, // ✅ Aquí se usa el email del cliente
        });

        if (error) {
            console.error('❌ Error al insertar orden:', error);
            return res.status(500).json({
                message: 'Error al guardar la orden',
                details: error.message,
            });
        }

        return res.status(200).json({ message: 'Orden registrada con éxito' });

    } catch (err) {
        console.error('❌ Error inesperado en process-transfer:', err);
        return res.status(500).json({ message: 'Error interno del servidor' });
    }
}
