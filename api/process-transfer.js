import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Método no permitido' });
    }

    try {
        const { order_id, datos_envio, items_comprados, shippingCost } = req.body;

        console.log('📦 Payload recibido:', req.body);

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

        const total = items_comprados.reduce((acc, item) => acc + item.precio * item.quantity, 0);
        const costoEnvio = typeof shippingCost === 'string' ? parseFloat(shippingCost) : Number(shippingCost);
        const envioGratis = total >= 1800 || tipoEntrega === 'retiro';
        const totalFinal = total + (isNaN(costoEnvio) ? 0 : costoEnvio);

        const fechaMontevideo = new Date().toLocaleString('en-CA', {
            timeZone: 'America/Montevideo',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
        }).replace(',', '');
        const [datePart, timePart] = fechaMontevideo.split(' ');
        const fechaFinal = `${datePart}T${timePart}-03:00`;

        const orden = {
            external_reference: order_id,
            email_usuario: email,
            email_cliente: email,
            items_comprados,
            total: totalFinal,
            estado_pago: 'pending_transferencia',
            nombre,
            telefono,
            direccion,
            departamento,
            tipo_entrega: tipoEntrega,
            costo_envio: costoEnvio,
            envio_gratis: envioGratis,
            fecha: fechaFinal,
            metodo_pago: 'manual_transfer',
        };

        const { error } = await supabase.from('ordenes').insert([orden]);

        if (error) {
            console.error('❌ Error al insertar orden:', error);
            return res.status(500).json({ message: 'Error al guardar la orden', details: error.message });
        }

        console.log('✅ Orden registrada con éxito:', orden);
        return res.status(200).json({ message: 'Orden registrada con éxito' });

    } catch (err) {
        console.error('❌ Error inesperado en process-transfer:', err);
        return res.status(500).json({ message: 'Error interno del servidor' });
    }
}
