// /hooks/useFinalizarCheckout.js

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
    shippingData
}) => {
    const finalizeCheckout = useCallback(
        async (estado_pago = 'approved', tipo_pago = 'mercadopago') => {
            if (isCheckoutFinalized) return;

            const order_id = currentExternalRef || crypto.randomUUID();
            const items_comprados = JSON.parse(localStorage.getItem('items_comprados'));
            const datos_envio = JSON.parse(localStorage.getItem('datos_envio'));

            try {
                if (tipo_pago === 'manual_transfer') {
                    console.log('🧾 Enviando datos a /api/process-transfer:', {
                        order_id,
                        items_comprados,
                        datos_envio,
                        shippingCost
                    });

                    const res = await fetch('/api/process-transfer', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            order_id,
                            items_comprados,
                            datos_envio,
                            shippingCost
                        })
                    });

                    if (!res.ok) {
                        const text = await res.text();
                        console.error('❌ Error al procesar transferencia:', text);
                        throw new Error('No se pudo registrar la orden por transferencia.');
                    }
                }

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
            shippingCost
        ]
    );

    return finalizeCheckout;
};

export default useFinalizarCheckout;
