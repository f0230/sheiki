import React from 'react';
import { Payment } from '@mercadopago/sdk-react';

const PagoMercadoPago = ({
    preferenceId,
    amount,
    onSubmit,
    setError,
    setPreferenceId,
    setCurrentExternalRef,
    setPaymentProcessing
}) => {
    return (
        <div className="bg-white text-black p-6 rounded-lg mt-8">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Completa tu pago</h2>
            </div>

            <p className="text-sm text-gray-600 mb-4">
                Serás redirigido de forma segura para completar el pago.
            </p>

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
                        ticket: 'all', // Habilita pagos en efectivo (Abitab, Redpagos)
                    },
                    redirectMode: 'modal',
                }}
                onSubmit={onSubmit}
                onError={(mpError) => {
                    console.error('[Pago] ❌ Error en Payment Brick:', mpError);
                    setError('Error al iniciar el pago con Mercado Pago. Por favor, intenta de nuevo o edita tus datos.');
                    setPreferenceId(null);
                    setCurrentExternalRef(null);
                    setPaymentProcessing(false);
                }}
                onReady={() => console.log("[Pago] ✅ Brick de Pago de Mercado Pago listo.")}
            />
        </div>
    );
};

export default PagoMercadoPago;