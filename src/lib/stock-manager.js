// /lib/stock-manager.js

import { createClient } from '@supabase/supabase-js';

// Inicializa Supabase con claves privadas de entorno
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Deduce el stock para una lista de items comprados.
 * @param {Array} items - Lista de ítems con { id, color, talle, quantity }
 * @returns {Promise<{ success: boolean, error?: string }>}
 */
export const deductStock = async (items) => {
    if (!Array.isArray(items) || items.length === 0) {
        console.error('❌ deductStock: items inválidos o vacíos');
        return { success: false, error: 'Items inválidos o vacíos' };
    }

    for (const item of items) {
        const { id, color, talle, quantity } = item;

        if (!id || !color || !talle || !quantity) {
            console.warn('⚠️ Item incompleto, se omite:', item);
            continue;
        }

        try {
            // Buscar la variante exacta
            const { data: variante, error: fetchError } = await supabase
                .from('variantes')
                .select('id, stock')
                .eq('producto_id', id)
                .eq('color', color)
                .eq('talle', talle)
                .single();

            if (fetchError || !variante) {
                console.warn('⚠️ Variante no encontrada para descontar stock:', { id, color, talle });
                continue;
            }

            const nuevoStock = Math.max(0, variante.stock - quantity);

            const { error: updateError } = await supabase
                .from('variantes')
                .update({ stock: nuevoStock })
                .eq('id', variante.id);

            if (updateError) {
                console.error(`❌ Error actualizando stock de variante ${variante.id}:`, updateError);
                return { success: false, error: updateError.message };
            }

            console.log(`✅ Stock actualizado: ID ${variante.id}, nuevo stock: ${nuevoStock}`);
        } catch (err) {
            console.error('❌ Excepción grave al deducir stock:', err);
            return { success: false, error: err.message };
        }
    }

    return { success: true };
};
