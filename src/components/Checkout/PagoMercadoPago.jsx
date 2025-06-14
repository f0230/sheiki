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
const handleSubmit = async ({ formData }) => {
    try {
        console.log('[✅ onSubmit] Datos recibidos del Brick:', formData);

        const {
            payment_method_id,
            payer = {},
            issuer_id,
            installments,
            token,
            external_resource_url
        } = formData;

        const email = payer.email ?? '';
        const monto = formData.transaction_amount ?? formData.amount ?? 0;

        // 🔍 Logs útiles
        console.log('Método de pago:', payment_method_id);
        console.log('Email del comprador:', email);
        console.log('Monto:', monto);
        console.log('Issuer:', issuer_id);
        console.log('Cuotas:', installments);

        // 🟡 Pago en efectivo: Redpagos, Abitab, ticket
        const esPagoEfectivo = ['ticket', 'redpagos', 'abitab'].includes(payment_method_id);

        if (esPagoEfectivo) {
            if (external_resource_url) {
                console.log('🔁 Redirigiendo a external_resource_url (ticket):', external_resource_url);
                window.location.href = external_resource_url;
                return true;
            } else {
                console.warn('⚠️ No se recibió external_resource_url. Redirigiendo a /pending como fallback.');
                navigate('/pending');
                return true;
            }
        }

        // ✅ Flujo normal para tarjeta o cuenta Mercado Pago
        const resultado = await onSubmit(formData);
        return resultado;

    } catch (err) {
        console.error('❌ Error interno en handleSubmit:', err);
        setError('Ocurrió un error inesperado al procesar el pago.');
        setPreferenceId(null);
        setCurrentExternalRef(null);
        setPaymentProcessing(false);
        return false;
    }
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
                initialization={{
                    amount,
                    preferenceId,
                }}
                customization={{
                    paymentMethods: {
                        mercadoPago: 'all',
                        creditCard: 'all',
                        debitCard: 'all',
                        ticket: 'all', // ✅ habilita Abitab, Redpagos
                    },
                    redirectMode: 'modal',
                }}
                onSubmit={handleSubmit}
                onError={(mpError) => {
                    console.error('[Pago] ❌ Error en Payment Brick:', mpError);
                    setError('Error al iniciar el pago con Mercado Pago. Por favor, intenta de nuevo o edita tus datos.');
                    setPreferenceId(null);
                    setCurrentExternalRef(null);
                    setPaymentProcessing(false);
                }}
                onReady={() => console.log("[Pago] ✅ Brick de Pago listo.")}
            />
        </div>
    );
};

export default PagoMercadoPago;
