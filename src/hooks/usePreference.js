import { useState, useEffect } from 'react';

export const usePreference = (items, shippingData, shippingCost) => {
    const [preferenceId, setPreferenceId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchPreference = async () => {
            try {
                if (!Array.isArray(items) || items.length === 0) {
                    console.warn("🛒 Carrito vacío o inválido.");
                    setLoading(false);
                    return;
                }

                const res = await fetch('/api/create-preference', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ items, shippingData, shippingCost }),
                });

                if (!res.ok) {
                    const errorText = await res.text();
                    throw new Error(`Error ${res.status}: ${errorText}`);
                }

                const data = await res.json();

                if (!data.preference?.id) {
                    throw new Error("Falta preference.id en la respuesta.");
                }

                setPreferenceId(data.preference.id);
            } catch (err) {
                console.error('🚨 Error al crear preferencia:', err);
                setError('No se pudo iniciar el pago. Intenta más tarde.');
            } finally {
                setLoading(false);
            }
        };

        fetchPreference();
    }, [items, shippingData, shippingCost]);

    return { preferenceId, loading, error };
};