import React from 'react';
import { Payment, initMercadoPago } from '@mercadopago/sdk-react';


initMercadoPago(import.meta.env.VITE_MP_PUBLIC_KEY, { locale: 'es-UY' });


const PagoMercadoPago = ({
    preferenceId,
    amount,
    onSubmit,
    setError,
    setPreferenceId,
    setCurrentExternalRef,
    setPaymentProcessing
}) => {

    const handlePaymentSubmit = async ({ formData }) => {
        try {
            console.log('[PagoMercadoPago] Enviando formData al backend:', formData);

            const res = await fetch('/api/process_payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
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

            // Redireccionar si es ticket (Abitab/Redpagos)
            if (data.status === 'pending' && data.external_resource_url) {
                console.log('📄 Redirigiendo a instrucciones de pago:', data.external_resource_url);
                window.location.href = data.external_resource_url;
            }

            // Si es aprobado, no necesita redirección manual (webhook se encarga)
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
                key={preferenceId} // Se usa la key para forzar el reinicio del componente si cambia la preferencia
                initialization={{
                    amount,
                    preferenceId,
                }}
                customization={{
                    paymentMethods: {
                        mercadoPago: 'all',
                        creditCard: 'all',
                        debitCard: 'all',
                        ticket: 'all', 
                        maxInstallments: 6,
                    },
                    redirectMode: 'modal',
                    defaultPaymentOption: {
                        walletForm: true,
                   
                      },
                    visual: {
                        hideFormTitle: true,
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
                    setPaymentProcessing(false); // sin usar window.setPaymentProcessing
                }}
                  
            />
        </div>
    );
};

export default PagoMercadoPago;