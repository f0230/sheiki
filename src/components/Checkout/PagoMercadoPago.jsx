import React from 'react';
import { Payment } from '@mercadopago/sdk-react';

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
    const handlePaymentSubmit = async ({ formData }) => {
        try {
            // ⏳ Paso previo: guardar localStorage y validar stock
            if (typeof onSubmit === 'function') {
                const ok = await onSubmit();
                if (!ok) return;
            }

            const shippingData = JSON.parse(localStorage.getItem('datos_envio')) || {};
            const items = JSON.parse(localStorage.getItem('items_comprados')) || [];
            const externalReference = `orden-${Date.now()}`;
            const email = shippingData.email || 'no-reply@sheiki.uy';
            const ci = shippingData?.ci?.trim();

            const paymentMethodId = formData?.payment_method_id;
            const isTicket = paymentMethodId === 'abitab' || paymentMethodId === 'redpagos';

            // 🔒 Validaciones defensivas
            if (!Array.isArray(items) || items.length === 0) {
                throw new Error('Carrito vacío o inválido.');
            }
            if (isTicket && (!ci || ci.length < 6)) {
                const msg = 'La cédula es obligatoria para pagos en efectivo.';
                setToastMessage?.(msg);
                setToastVisible?.(true);
                setTimeout(() => setToastVisible?.(false), 5000);
                return;
            }

            // 🧠 Guardar para tracking (Status Screen Brick, webhook)
            localStorage.setItem('external_reference', externalReference);

            const enrichedFormData = {
                ...formData,
                description: 'Pago Sheiki',
                payer: {
                    email,
                    identification: {
                        type: 'CI',
                        number: ci || '00000000' // fallback solo si no es ticket
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

            console.log('[🧾 PagoMercadoPago] Payload enriquecido:', enrichedFormData);
            
            localStorage.setItem('backup_cart', localStorage.getItem('items_comprados'));
            localStorage.setItem('backup_envio', localStorage.getItem('datos_envio'));
            
            const res = await fetch('/api/process_payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(enrichedFormData)
            });

            const data = await res.json();

            // 💾 Guardar siempre el payment_id si existe
            if (data?.id) {
                localStorage.setItem('payment_id', data.id);
            }

            if (!res.ok) {
                console.error('❌ Error al procesar pago:', data.error || data.message);
                setError(data.error || 'Error al procesar el pago. Intenta nuevamente.');
                setPreferenceId(null);
                setCurrentExternalRef(null);
                setPaymentProcessing(false);
                window.location.href = '/failure';
                return;
            }
            

            // 🧾 Redirige a instrucciones si es efectivo
            if (data.status === 'pending' && data.external_resource_url) {
                localStorage.setItem('payment_id', data.id); // ✅ asegúrate que se guarde
                localStorage.setItem('ticket_url', data.external_resource_url);
                localStorage.setItem('ticket_status_ref', data.external_reference); // por si querés usarlo en PendingPage
                window.location.href = '/pending';
                return;
            }
            if (data.status === 'approved') {
                await finalizeCheckout('approved', 'brick');
                return;
            }

        } catch (error) {
            console.error('❌ Excepción en handlePaymentSubmit:', error);
            setError(error.message || 'Error al procesar el pago. Intenta nuevamente.');
            setPreferenceId(null);
            setCurrentExternalRef(null);
            setPaymentProcessing(false);
            window.location.href = '/failure'; 
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
