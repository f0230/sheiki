import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
    const { ref } = req.query;
    if (!ref) return res.status(400).json({ error: 'Falta referencia' });

    const { data, error } = await supabase
        .from('ordenes')
        .select('estado_pago')
        .eq('external_reference', ref)
        .order('fecha', { ascending: false })
        .limit(1)
        .single();

    if (error) {
        return res.status(500).json({ error: 'Error al buscar orden', detalle: error.message });
    }

    return res.status(200).json({ estado_pago: data?.estado_pago || 'pendiente' });
}
