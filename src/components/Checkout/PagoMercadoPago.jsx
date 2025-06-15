// /components/Checkout/PagoMercadoPago.jsx

import React, { useEffect } from 'react';
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
    // Guardar referencia al controlador global
    useEffect(() => {
        window.setPaymentProcessing = setPaymentProcessing;
    }, [setPaymentProcessing]);

    // Función personalizada para crear el pago
    const createPayment = () => {
        if (!window.paymentBrickController) {
            console.error('❌ paymentBrickController no está listo.');
            return;
        }

        window.paymentBrickController
            .getFormData()
            .then(({ formData }) => {
                console.log('[🧾 Sheiki] Enviando pago manual...');
                fetch('/api/process_payment', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(formData)
                }).then(res => {
                    if (!res.ok) throw new Error('Error al procesar el pago');
                    return res.json();
                }).then(data => {
                    console.log('✅ Pago enviado:', data);
                }).catch(error => {
                    console.error('❌ Error al enviar pago:', error);
                    setError('No se pudo completar el pago. Intentalo de nuevo.');
                });
            })
            .catch((error) => {
                console.error('❌ Error al obtener formData:', error);
                setError('Error al procesar el formulario de pago.');
            });
    };

    return (
        <div className="bg-white text-black p-6 rounded-lg mt-8">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Completa tu pago</h2>
            </div>

            <p className="text-sm text-gray-600 mb-4">
                Serás redirigido de forma segura para completar el pago.
            </p>

            <Payment
                key={preferenceId}
                initialization={{ amount, preferenceId }}
                customization={{
                    paymentMethods: {
                        mercadoPago: 'all',
                        maxInstallments: 6,
                    },
                    redirectMode: 'modal',
                    defaultPaymentOption: {
                        walletForm: true,
                    },
                    visual: {
                        hideFormTitle: true,
                        hidePaymentButton: true,
                    },
                }}
                onSubmit={onSubmit}
                onError={(mpError) => {
                    console.error('[Pago] ❌ Error en Payment Brick:', mpError);
                    setError('Error al iniciar el pago con Mercado Pago. Por favor, intenta de nuevo o edita tus datos.');
                    setPreferenceId(null);
                    setCurrentExternalRef(null);
                    setPaymentProcessing(false);
                }}
                onReady={() => console.log('[Pago] ✅ Brick de Pago de Mercado Pago listo.')}
                onClose={() => {
                    console.warn('[Brick] 🛑 El usuario cerró el modal sin pagar');
                    if (typeof window.setPaymentProcessing === 'function') {
                        window.setPaymentProcessing(false);
                    }
                }}
            />

            {/* Botón personalizado estilo Sheiki */}
            <button
                type="button"
                onClick={createPayment}
                className="mt-6 bg-black text-white w-full py-3 rounded-full text-lg font-semibold hover:bg-gray-800 transition"
            >
                Confirmar y pagar
            </button>
        </div>
    );
};

export default PagoMercadoPago;
