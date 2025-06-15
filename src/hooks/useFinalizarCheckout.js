import { useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';

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
    shippingData
}) => {
    const finalizeCheckout = useCallback(async (status, fromSource = "unknown") => {
        if (isCheckoutFinalized) {
            console.log(`[Checkout] Ya finalizado (desde ${fromSource}). Estado: ${status}`);
            return;
        }

        console.log(`[Checkout] Finalizando con estado: ${status} (fuente: ${fromSource})`);
        setIsCheckoutFinalized(true);
        setPaymentProcessing(false);
        setPreferenceId(null);
        setConfirmed(false);

        const statusesToInsert = ["success", "pending", "failure", "pending_transferencia"];

        let externalRef = currentExternalRef ?? `transfer-${Date.now()}`;
        const montoFinal = calculateTotal() + shippingCost;
        const envioGratis = montoFinal >= 1800;
        const itemsComprados = JSON.parse(localStorage.getItem('items_comprados') || '[]');

        if (statusesToInsert.includes(status)) {
            const { data: { session } } = await supabase.auth.getSession();
            const id_usuario = session?.user?.id ?? null;
            const email_usuario = session?.user?.email ?? null;

            const orderData = {
                id_usuario,
                email_usuario,
                email_cliente: shippingData.email,
                nombre: shippingData.nombre,
                telefono: shippingData.telefono,
                direccion: shippingData.direccion,
                departamento: shippingData.departamento,
                tipo_entrega: shippingData.tipoEntrega,
                costo_envio: shippingCost,
                envio_gratis: envioGratis,
                total: montoFinal,
                estado_pago: status,
                items_comprados: JSON.stringify(itemsComprados),
                external_reference: externalRef,
                fecha: new Date().toISOString()
            };

            const { error } = await supabase.from('ordenes').insert([orderData]);

            if (error) {
                console.error('❌ Error al guardar la orden en Supabase:', error.message);
            }
        }

        // Guardamos localmente
        localStorage.setItem('monto_total', montoFinal.toString());
        localStorage.setItem('order_id', externalRef);
        if (shippingData.email) localStorage.setItem('user_email', shippingData.email);

        // 🔁 PROCESAR TRANSFERENCIA si aplica
        if (status === 'pending_transferencia') {
            try {
                const response = await fetch('/api/process-transfer', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${import.meta.env.VITE_ADMIN_SECRET_KEY}`
                    },
                    body: JSON.stringify({
                        order_id: externalRef,
                        items_comprados: itemsComprados,
                        datos_envio: shippingData,
                        shippingCost
                    })
                });

                const result = await response.json();
                if (!response.ok) {
                    console.error('❌ Error procesando transferencia:', result.message);
                } else {
                    console.log('✅ Transferencia procesada:', result.message);
                }
            } catch (err) {
                console.error('❌ Excepción al procesar transferencia:', err.message);
            }
        }
          
        // 🔁 Redirección según estado
        if (status === 'success') {
            navigate('/success', { replace: true });
        } else if (status === 'failure') {
            navigate('/failure', { replace: true });
        } else if (status === 'pending' || status === 'pending_transferencia') {
            navigate('/pending', { replace: true });
        } else {
            navigate('/', { replace: true });
        }

        clearCart();

    }, [
        isCheckoutFinalized, setIsCheckoutFinalized, setPaymentProcessing, setPreferenceId,
        setConfirmed, clearCart, navigate, calculateTotal, shippingCost,
        currentExternalRef, shippingData
    ]);

    return finalizeCheckout;
};

export default useFinalizarCheckout;
