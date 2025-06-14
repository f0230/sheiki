import { supabase } from '../lib/supabaseClient';

export const obtenerOrdenes = async () => {
    const { data, error } = await supabase
        .from('ordenes')
        .select('*')
        .order('fecha', { ascending: false });

    if (error) {
        console.error('❌ Error al obtener órdenes:', error.message);
        return [];
    }

    console.log('🟢 Ordenes recibidas:', data);
    return data ?? [];
};

export const procesarTransferencia = async (externalRef) => {
    try {
        const res = await fetch('/api/process-transfer', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${import.meta.env.VITE_ADMIN_SECRET_KEY}`,
            },
            body: JSON.stringify({ order_id: externalRef }),
        });

        const result = await res.json();
        if (!res.ok) throw new Error(result.message);

        return true;
    } catch (err) {
        console.error('❌ Error procesando transferencia:', err.message);
        return false;
    }
};
