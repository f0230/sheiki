// /lib/stock-manager.js

import { createClient } from '@supabase/supabase-js';

// Inicializa Supabase aquí para que la función sea autónoma
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Deduce el stock para una lista de items comprados.
 * @param {Array} items - El array de items de la orden.
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const deductStock = async (items) => {
    if (!items || !Array.isArray(items)) {
        console.error('Error de stock: "items" no es un array válido.');
        return { success: false, error: 'Items inválidos.' };
    }

    for (const item of items) {
        // Asegúrate de que los campos necesarios existen
        const { id, color, talle, quantity } = item;
        if (!id || !color || !talle || !quantity) {
            console.error('⚠️ Item con datos incompletos para actualizar stock:', item);
            continue; // Salta este item si no tiene los datos necesarios
        }

        try {
            const { data: variante, error: fetchError } = await supabase
                .from('variantes')
                .select('id, stock')
                .eq('producto_id', id)
                .eq('color', color)
                .eq('talle', talle)
                .single();

            if (fetchError || !variante) {
                console.error('⚠️ Variante no encontrada para descontar stock:', { id, color, talle }, fetchError);
                continue; // Si no se encuentra la variante, continúa con el siguiente item
            }

            const nuevoStock = Math.max(variante.stock - quantity, 0);

            const { error: updateError } = await supabase
                .from('variantes')
                .update({ stock: nuevoStock })
                .eq('id', variante.id);

            if (updateError) {
                console.error('❌ Error actualizando stock:', updateError);
                // Podrías decidir si quieres detener todo el proceso o solo registrar el error
            } else {
                console.log(`✅ Stock actualizado: variante ID ${variante.id} a ${nuevoStock} unidades.`);
            }

        } catch (e) {
            console.error('❌ Excepción catastrófica actualizando stock:', e);
        }
    }

    return { success: true };
};