import { useEffect } from 'react';

const useGenerarPreferencia = ({
    confirmed,
    items,
    shippingData,
    shippingCost,
    setPreferenceId,
    setCurrentExternalRef,
    setError,
    setLoading,
    setConfirmed,
    preferenceId
}) => {
    useEffect(() => {
        const generarPreferencia = async () => {
            if (!confirmed || items.length === 0 || preferenceId) return;

            setLoading(true);
            setError(null);
            setCurrentExternalRef(null);

            try {
                const res = await fetch('/api/create-preference', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ items, shippingData, shippingCost })
                });

                const data = await res.json();
                if (res.ok && data.preference && data.preference.id) {
                    setPreferenceId(data.preference.id);
                    if (data.preference.external_reference) {
                        setCurrentExternalRef(data.preference.external_reference);
                    } else {
                        setError("Error: external_reference ausente.");
                    }
                } else {
                    throw new Error(data.error || data.details || data.message || 'Error inesperado');
                }
            } catch (err) {
                console.error('[Preferencia] Error:', err);
                setError(err.message || 'No se pudo generar la preferencia de pago.');
                setConfirmed(false);
            } finally {
                setLoading(false);
            }
        };

        if (confirmed && !preferenceId) {
            generarPreferencia();
        }
    }, [confirmed, items, shippingData, shippingCost, setPreferenceId, setCurrentExternalRef, setError, setLoading, setConfirmed, preferenceId]);
};

export default useGenerarPreferencia;
