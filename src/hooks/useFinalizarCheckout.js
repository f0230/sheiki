// hooks/useFinalizarCheckout.js
import { useCallback } from 'react';

const useFinalizarCheckout = ({
    isCheckoutFinalized,
    setIsCheckoutFinalized,
    setPaymentProcessing,
    setPreferenceId,
    setConfirmed,
    clearCart,
    navigate,
    calculateTotal,
    shippingCost,
    currentExternalRef,
    shippingData,
    items // ✅ agregado directamente
}) => {
    const finalizeCheckout = useCallback(
        async (estado_pago = 'approved', tipo_pago = 'mercadopago') => {
            if (isCheckoutFinalized) return;

            const order_id = currentExternalRef || crypto.randomUUID();
            const datos_envio = { ...shippingData, shippingCost };
            const items_comprados = items;

            try {
                if (tipo_pago === 'manual_transfer') {
                    console.log('📤 Enviando datos directo a /api/process-transfer:', {
                        order_id,
                        datos_envio,
                        items_comprados,
                        shippingCost
                    });

                    const res = await fetch('/api/process-transfer', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            order_id,
                            datos_envio,
                            items_comprados,
                            shippingCost
                        })
                    });

                    if (!res.ok) {
                        const text = await res.text();
                        console.error('❌ Error al procesar transferencia:', text);
                        throw new Error('No se pudo registrar la orden por transferencia.');
                    }
                }

                // Limpiar y redirigir
                setIsCheckoutFinalized(true);
                setPaymentProcessing(false);
                setPreferenceId(null);
                setConfirmed(false);
                clearCart();

                if (estado_pago === 'approved') {
                    navigate('/success');
                } else if (estado_pago === 'pending_transferencia' || estado_pago === 'pending') {
                    navigate('/pending');
                } else {
                    navigate('/failure');
                }
            } catch (err) {
                console.error('❌ Error al finalizar checkout:', err);
                setPaymentProcessing(false);
            }
        },
        [
            isCheckoutFinalized,
            setIsCheckoutFinalized,
            setPaymentProcessing,
            setPreferenceId,
            setConfirmed,
            clearCart,
            navigate,
            currentExternalRef,
            shippingData,
            items,
            shippingCost
        ]
    );

    return finalizeCheckout;
};

export default useFinalizarCheckout;
