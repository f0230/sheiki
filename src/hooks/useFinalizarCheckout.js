import { useCallback } from 'react';
import {
    SHEIKI_PAYMENT_STATUS_KEY,
    ORDER_ID_KEY,
    MONTO_TOTAL_KEY,
    USER_EMAIL_KEY,
    PAYMENT_ID_KEY,
    DATOS_ENVIO_KEY,
    ITEMS_COMPRADOS_KEY,
    EXTERNAL_REFERENCE_KEY,
    PAYMENT_STATUS_APPROVED,
    PAYMENT_STATUS_PENDING,
    PAYMENT_STATUS_IN_PROCESS,
    PAYMENT_STATUS_PENDING_TRANSFERENCIA,
    PAYMENT_TYPE_MERCADOPAGO,
    PAYMENT_TYPE_MANUAL_TRANSFER
} from '../lib/constants';

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
        async (estado_pago = PAYMENT_STATUS_APPROVED, tipo_pago = PAYMENT_TYPE_MERCADOPAGO) => {
            const normalizedStatus = (estado_pago || '').toLowerCase(); // Keep toLowerCase for safety, though constants should be correct
            const order_id = currentExternalRef || crypto.randomUUID();
            const datos_envio = { ...shippingData, shippingCost };
            const items_comprados = items;

            // 🧠 Guardar datos útiles
            localStorage.setItem(SHEIKI_PAYMENT_STATUS_KEY, normalizedStatus);
            localStorage.setItem(ORDER_ID_KEY, order_id);
            localStorage.setItem(MONTO_TOTAL_KEY, String(calculateTotal() + shippingCost));
            if (shippingData?.email) {
                localStorage.setItem(USER_EMAIL_KEY, shippingData.email);
            }

            try {
                if (!isCheckoutFinalized) {
                    if (tipo_pago === PAYMENT_TYPE_MANUAL_TRANSFER) {
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

                    localStorage.removeItem(PAYMENT_ID_KEY);
                    localStorage.removeItem(DATOS_ENVIO_KEY);
                    localStorage.removeItem(ITEMS_COMPRADOS_KEY);
                    localStorage.removeItem(EXTERNAL_REFERENCE_KEY);
                }

                // 🚦 Redirección garantizada
                if (normalizedStatus === PAYMENT_STATUS_APPROVED) {
                    navigate('/success');
                } else if ([PAYMENT_STATUS_PENDING, PAYMENT_STATUS_IN_PROCESS, PAYMENT_STATUS_PENDING_TRANSFERENCIA].includes(normalizedStatus)) {
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