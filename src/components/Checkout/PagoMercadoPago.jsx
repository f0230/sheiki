import React from 'react';
import { Payment } from '@mercadopago/sdk-react';

const PagoMercadoPago = ({
    preferenceId,
    amount,
    setError,
    setPreferenceId,
    setCurrentExternalRef,
    setPaymentProcessing
}) => {
    const handlePaymentSubmit = async ({ formData }) => {
        try {
            const shippingData = JSON.parse(localStorage.getItem('datos_envio')) || {};
            const items = JSON.parse(localStorage.getItem('items_comprados')) || [];
            const externalReference = `orden-${Date.now()}`;
            const email = shippingData?.email || 'no-reply@sheiki.uy';
            const ci = shippingData?.ci || '00000000';

            // Validación mínima
            if (!Array.isArray(items) || items.length === 0) {
                throw new Error('Carrito vacío o inválido.');
            }

            const enrichedFormData = {
                ...formData,
                description: 'Pago Sheiki',
                payer: {
                    email,
                    identification: {
                        type: 'CI',
                        number: ci
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

            console.log('[PagoMercadoPago] Enviando enrichedFormData al backend:', enrichedFormData);

            const res = await fetch('/api/process_payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(enrichedFormData)
            });

            const data = await res.json();

            if (!res.ok) {
                console.error('❌ Error al procesar el pago:', data.error || data.message);
                setError(data.error || 'Error al procesar el pago. Intenta nuevamente.');
                setPreferenceId(null);
                setCurrentExternalRef(null);
                setPaymentProcessing(false);
                return;
            }

            // Guardar paymentId para StatusScreen Brick
            if (data?.id) {
                localStorage.setItem('payment_id', data.id);
            }

            // Redirigir si es ticket (Abitab/Redpagos)
            if (data.status === 'pending' && data.external_resource_url) {
                console.log('📄 Redirigiendo a instrucciones de pago:', data.external_resource_url);
                window.location.href = data.external_resource_url;
            }

        } catch (error) {
            console.error('❌ Excepción en handlePaymentSubmit:', error);
            setError('Error al procesar el pago. Por favor, intentá nuevamente.');
            setPreferenceId(null);
            setCurrentExternalRef(null);
            setPaymentProcessing(false);
        }
    };

    return (
        <div className="bg-white text-black p-6 rounded-lg mt-8">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Completa tu pago</h2>
            </div>
            <Payment
                key={preferenceId}
                initialization={{
                    amount,
                    preferenceId
                }}
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
                    console.error('[Pago] ❌ Error en Payment Brick:', mpError);
                    setError('Error al iniciar el pago con Mercado Pago. Por favor, intenta de nuevo o edita tus datos.');
                    setPreferenceId(null);
                    setCurrentExternalRef(null);
                    setPaymentProcessing(false);
                }}
                onReady={() => console.log("[Pago] ✅ Brick de Pago de Mercado Pago listo.")}
                onClose={() => {
                    console.warn('[Brick] 🛑 El usuario cerró el modal sin pagar');
                    setPaymentProcessing(false);
                }}
            />
        </div>
    );
};

export default PagoMercadoPago;
