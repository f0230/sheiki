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
            const status = message?.payload?.status;
            const ref = message?.payload?.external_reference;

            if (ref !== currentExternalRef) return;

            if (["approved", "pending", "in_process", "rejected"].includes(status)) {
                const redirectStatus = status === "approved" ? "success" : status;
                finalizeCheckout(redirectStatus, "realtime");
            } else {
                console.log(`[RealtimePago] Estado no manejado automáticamente: ${status}`);
            }
        };
        

        realtimeChannel
            .on('broadcast', { event: 'payment_update' }, handleRealtimePaymentUpdate)
            .subscribe((status, err) => {
                if (status === 'SUBSCRIBED') {
                    console.log(`[RealtimePago] ✅ Subscrito a ${channelName}`);
                } else if (['CHANNEL_ERROR', 'TIMED_OUT', 'CLOSED'].includes(status)) {
                    console.error(`[RealtimePago] ❌ Error en canal: ${channelName}`, err);
                    setError('No se pudo conectar a Mercado Pago en tiempo real. Verifica manualmente tu pago.');
                }
            });

        return () => {
            supabase.removeChannel(realtimeChannel)
                .then(status => console.log(`[RealtimePago] Canal cerrado: ${status}`))
                .catch(err => console.error('[RealtimePago] Error al cerrar canal:', err));
        };
    }, [paymentProcessing, currentExternalRef, isCheckoutFinalized, finalizeCheckout, setError]);
};

export default useRealtimePago;
