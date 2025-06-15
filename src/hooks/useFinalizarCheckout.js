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
    items
}) => {
    const finalizeCheckout = useCallback(
        async (estado_pago = 'approved', tipo_pago = 'mercadopago') => {
            const normalizedStatus = (estado_pago || '').toLowerCase();
            const order_id = currentExternalRef || crypto.randomUUID();
            const datos_envio = { ...shippingData, shippingCost };
            const items_comprados = items;

            // 🧠 Guardar datos útiles
            localStorage.setItem('sheikiPaymentStatus', normalizedStatus);
            localStorage.setItem('order_id', order_id);
            localStorage.setItem('monto_total', String(calculateTotal() + shippingCost));
            if (shippingData?.email) {
                localStorage.setItem('user_email', shippingData.email);
            }

            try {
                if (!isCheckoutFinalized) {
                    if (tipo_pago === 'manual_transfer') {
                        console.log('📤 Enviando datos directo a /api/process-transfer:', {
                            order_id,
                            datos_envio,
                            items_comprados,
                            shippingCost
                        });

                        const res = await fetch('/api/process-transfer', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ order_id, datos_envio, items_comprados, shippingCost })
                        });

                        if (!res.ok) {
                            const text = await res.text();
                            console.error('❌ Error al procesar transferencia:', text);
                            throw new Error('No se pudo registrar la orden por transferencia.');
                        }
                    }

                    // 🧼 Limpieza de estados
                    setIsCheckoutFinalized(true);
                    setPaymentProcessing(false);
                    setPreferenceId(null);
                    setConfirmed(false);
                    clearCart();

                    localStorage.removeItem('payment_id');
                    localStorage.removeItem('datos_envio');
                    localStorage.removeItem('items_comprados');
                    localStorage.removeItem('external_reference');
                }

                // 🚦 Redirección garantizada
                if (normalizedStatus === 'approved') {
                    navigate('/success');
                } else if (['pending', 'in_process', 'pending_transferencia'].includes(normalizedStatus)) {
                    navigate('/pending');
                } else {
                    navigate('/failure');
                }

            } catch (err) {
                console.error('❌ Error al finalizar checkout:', err);
                setPaymentProcessing(false);
                navigate('/failure');
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
            shippingCost,
            calculateTotal
        ]
    );

    return finalizeCheckout;
};

export default useFinalizarCheckout;
