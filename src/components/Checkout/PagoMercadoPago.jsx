import React from 'react';
import { Payment } from '@mercadopago/sdk-react';
import {
    DATOS_ENVIO_KEY,
    ITEMS_COMPRADOS_KEY,
    EXTERNAL_REFERENCE_KEY,
    PAYMENT_ID_KEY,
    TICKET_URL_KEY,
    TICKET_STATUS_REF_KEY,
    BACKUP_CART_KEY,
    BACKUP_ENVIO_KEY,
    ABITAB_PM,
    REDPAGOS_PM,
    IDENTIFICATION_TYPE_CI,
    PAYMENT_STATUS_PENDING,
    PAYMENT_STATUS_APPROVED,
    PAYMENT_TYPE_BRICK,
    ORDER_PREFIX,
    DEFAULT_PAYER_EMAIL,
    DEFAULT_CI,
    PAYMENT_DESCRIPTION,
    PAYMENT_REJECTED_MESSAGE, // Added
    FAILURE_PAGE_PATH,      // Added
    PENDING_PAGE_PATH       // Added
} from '../../lib/constants';

const PagoMercadoPago = ({
    preferenceId,
    amount,
    onSubmit,
    setError,
    setPreferenceId,
    setCurrentExternalRef,
    setPaymentProcessing,
    finalizeCheckout,
    setToastMessage,  // ✅
    setToastVisible   // ✅
}) => {

    // Helper Functions
    const getPaymentDataFromStorage = () => {
        const shippingData = JSON.parse(localStorage.getItem(DATOS_ENVIO_KEY)) || {};
        const items = JSON.parse(localStorage.getItem(ITEMS_COMPRADOS_KEY)) || [];
        return { shippingData, items };
    };

    const validatePaymentInputs = (items, paymentMethodId, ci) => {
        if (!Array.isArray(items) || items.length === 0) {
            return 'Carrito vacío o inválido.';
        }
        const isTicket = paymentMethodId === ABITAB_PM || paymentMethodId === REDPAGOS_PM;
        if (isTicket && (!ci || ci.length < 6)) {
            return 'La cédula es obligatoria para pagos en efectivo.';
        }
        return null;
    };

    const prepareApiPayload = (formData, shippingData, items, email, ci, externalReference) => {
        return {
            ...formData,
            description: PAYMENT_DESCRIPTION,
            payer: {
                email,
                identification: {
                    type: IDENTIFICATION_TYPE_CI,
                    number: ci || DEFAULT_CI // fallback solo si no es ticket
                }
            },
            metadata: {
                ...shippingData,
                items,
                email,
                shipping_cost: Number(shippingData?.shippingCost || 0),
                externalReference
            }
        };
    };

    const handlePaymentSubmit = async ({ formData }) => {
        try {
            // ⏳ Paso previo: guardar localStorage y validar stock
            if (typeof onSubmit === 'function') {
                const ok = await onSubmit();
                if (!ok) return;
            }

            const { shippingData, items } = getPaymentDataFromStorage();
            const email = shippingData.email || DEFAULT_PAYER_EMAIL;
            const ci = shippingData?.ci?.trim();
            const paymentMethodId = formData?.payment_method_id;

            const validationError = validatePaymentInputs(items, paymentMethodId, ci);
            if (validationError) {
                if (validationError === 'Carrito vacío o inválido.') { // Specific handling for critical error
                    setError(validationError); // Use setError for critical issues
                    setPaymentProcessing(false);
                    // Potentially redirect or show a more persistent error
                    return;
                }
                setToastMessage?.(validationError);
                setToastVisible?.(true);
                setPaymentProcessing(false);
                setTimeout(() => setToastVisible?.(false), 5000);
                return;
            }

            const externalReference = `${ORDER_PREFIX}${Date.now()}`;
            localStorage.setItem(EXTERNAL_REFERENCE_KEY, externalReference);

            const enrichedFormData = prepareApiPayload(formData, shippingData, items, email, ci, externalReference);

            console.log('[🧾 PagoMercadoPago] Payload enriquecido:', enrichedFormData);

            // Backup current cart and shipping info before processing
            localStorage.setItem(BACKUP_CART_KEY, JSON.stringify(items)); // Ensure stringified
            localStorage.setItem(BACKUP_ENVIO_KEY, JSON.stringify(shippingData)); // Ensure stringified

            const res = await fetch('/api/process_payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(enrichedFormData)
            });

            const data = await res.json();

            // 💾 Guardar siempre el payment_id si existe
            if (data?.id) {
                localStorage.setItem(PAYMENT_ID_KEY, data.id);
            }

            if (!res.ok) {
                console.error('❌ Error al procesar pago:', data.error || data.message);
                setError(data.error || 'Error al procesar el pago. Intenta nuevamente.');
                setPreferenceId(null);
                setCurrentExternalRef(null);
                setPaymentProcessing(false);
                window.location.href = FAILURE_PAGE_PATH;
                return;
            }


            // 🧾 Redirige a instrucciones si es efectivo
            if (data.status === PAYMENT_STATUS_PENDING && data.external_resource_url) {
                localStorage.setItem(PAYMENT_ID_KEY, data.id); // ✅ asegúrate que se guarde
                localStorage.setItem(TICKET_URL_KEY, data.external_resource_url);
                localStorage.setItem(TICKET_STATUS_REF_KEY, data.external_reference); // por si querés usarlo en PendingPage
                window.location.href = PENDING_PAGE_PATH;
                return;
            }
            if (data.status === PAYMENT_STATUS_APPROVED) {
                await finalizeCheckout(PAYMENT_STATUS_APPROVED, PAYMENT_TYPE_BRICK);
                return;
            }

            // ⚠️ Fallback for other statuses when res.ok is true (e.g., rejected, cancelled)
            // This handles cases where the API call was successful but the payment was not approved or pending.
            console.warn('⚠️ Pago no aprobado ni pendiente, estado:', data.status, 'Detalle:', data.status_detail || 'No disponible');
            const rejectionMessage = data.status_detail || PAYMENT_REJECTED_MESSAGE;
            setError(rejectionMessage); // Provide more specific error if available
            setPreferenceId(null);
            setCurrentExternalRef(null);
            setToastMessage?.(rejectionMessage);
            setToastVisible?.(true);
            setTimeout(() => setToastVisible?.(false), 5000); // Consistent with other toast usage
            setPaymentProcessing(false); // Crucial: Set paymentProcessing to false
            window.location.href = FAILURE_PAGE_PATH;
            return; // Ensure no further code in the try block is executed

        } catch (error) {
            console.error('❌ Excepción en handlePaymentSubmit:', error);
            setError(error.message || 'Error al procesar el pago. Intenta nuevamente.');
            setPreferenceId(null);
            setCurrentExternalRef(null);
            setPaymentProcessing(false);
            window.location.href = FAILURE_PAGE_PATH;
        }
    };

    return (
        <div className="bg-white text-black p-6 rounded-lg mt-8 shadow-md">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                    💳 Completa tu pago
                </h2>
            </div>

            <Payment
                key={preferenceId}
                initialization={{ amount, preferenceId }}
                customization={{
                    paymentMethods: {
                        mercadoPago: 'all',
                        creditCard: 'all',
                        debitCard: 'all',
                        ticket: 'all',
                        maxInstallments: 6
                    },
                    redirectMode: 'modal',
                    defaultPaymentOption: {
                        walletForm: true
                    },
                    visual: {
                        hideFormTitle: true
                    }
                }}
                onSubmit={handlePaymentSubmit}
                onError={(mpError) => {
                    console.error('[💥 Brick] Error de Mercado Pago:', mpError);
                    setError('Error con Mercado Pago. Editá los datos o probá más tarde.');
                    setPreferenceId(null);
                    setCurrentExternalRef(null);
                    setPaymentProcessing(false);
                }}
                onReady={() => {
                    console.log('[✅ Brick] Componente listo');
                }}
                onClose={() => {
                    console.warn('[🛑 Brick] Usuario cerró el modal');
                    setPaymentProcessing(false);
                }}
            />
        </div>
    );
};

export default PagoMercadoPago;