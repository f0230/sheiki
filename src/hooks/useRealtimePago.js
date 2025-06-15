import { useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

const useRealtimePago = ({
    paymentProcessing,
    currentExternalRef,
    isCheckoutFinalized,
    finalizeCheckout,
    setError
}) => {
    useEffect(() => {
        if (isCheckoutFinalized || !paymentProcessing || !currentExternalRef) return;

        const channelName = `order_status_${currentExternalRef}`;
        const realtimeChannel = supabase.channel(channelName, {
            config: { broadcast: { self: false } }
        });

        const handleRealtimePaymentUpdate = (message) => {
            const { status, status_detail, external_reference } = message?.payload || {};

            if (external_reference !== currentExternalRef) return;

            console.log(`[RealtimePago] 🎯 Estado recibido: ${status} | Detail: ${status_detail}`);

            if (status === "approved") {
                finalizeCheckout('approved', 'realtime');
            } else if (["pending", "in_process"].includes(status)) {
                finalizeCheckout(status, 'realtime');
            } else if (status === "rejected") {
                console.warn(`[RealtimePago] 🚫 Pago rechazado (${status_detail})`);
                finalizeCheckout('rejected', 'realtime');
            } else {
                console.log(`[RealtimePago] ❔ Estado no manejado automáticamente: ${status}`);
            }
        };

        realtimeChannel
            .on('broadcast', { event: 'payment_update' }, handleRealtimePaymentUpdate)
            .subscribe((status, err) => {
                if (status === 'SUBSCRIBED') {
                    console.log(`[RealtimePago] ✅ Subscrito a ${channelName}`);
                } else if (['CHANNEL_ERROR', 'TIMED_OUT', 'CLOSED'].includes(status)) {
                    console.error(`[RealtimePago] ❌ Error en canal: ${channelName}`, err);
                    setError('No se pudo conectar con Mercado Pago en tiempo real.');
                }
            });

        return () => {
            supabase.removeChannel(realtimeChannel)
                .then(status => console.log(`[RealtimePago] 🧹 Canal cerrado: ${status}`))
                .catch(err => console.error('[RealtimePago] Error al cerrar canal:', err));
        };
    }, [paymentProcessing, currentExternalRef, isCheckoutFinalized, finalizeCheckout, setError]);
};

export default useRealtimePago;
