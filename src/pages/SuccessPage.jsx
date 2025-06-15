import React, { useEffect } from 'react';
import { StatusScreen } from '@mercadopago/sdk-react';
import { useCart } from '../store/useCart';

const SuccessPage = () => {
    const { clearCart } = useCart();

    useEffect(() => {
        const paymentStatus = 'success';
        localStorage.setItem('sheikiPaymentStatus', paymentStatus);

        // 🔁 Limpieza y control de carrito
        clearCart();
        localStorage.removeItem('datos_envio');
        localStorage.removeItem('items_comprados');

        // 🎯 Evento Meta API
        const montoTotal = parseFloat(localStorage.getItem('monto_total')) || 0;
        const orderId = localStorage.getItem('order_id') || 'ORD-DEFAULT';
        const email = localStorage.getItem('user_email') || null;

        fetch('/api/sendEventToMeta', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                event_name: 'Purchase',
                url: window.location.href,
                user_agent: navigator.userAgent,
                email,
                custom_data: {
                    currency: 'UYU',
                    value: montoTotal,
                    order_id: orderId,
                },
            }),
        }).catch((err) =>
            console.error('[SuccessPage] ❌ Error al enviar evento de compra a Meta:', err)
        );

        // 🧹 Limpieza final
        setTimeout(() => {
            localStorage.removeItem('monto_total');
            localStorage.removeItem('order_id');
        }, 3000);

        return () => {
            if (window.statusScreenBrickController) {
                window.statusScreenBrickController.unmount();
                console.log('[SuccessPage] 🧹 Brick desmontado');
            }
        };
    }, [clearCart]);

    const initialization = {
        paymentId: localStorage.getItem('payment_id'), // Debe estar seteado en handlePaymentSubmit
    };

    const customization = {
        backUrls: {
            return: 'https://www.sheiki.uy',
            error: 'https://www.sheiki.uy/failure',
        },
        texts: {
            ctaReturnLabel: 'Volver a la tienda',
        },
    };

    const onReady = () => console.log('[SuccessPage] ✅ Brick listo');
    const onError = (error) => console.error('[SuccessPage] ❌ Error en StatusScreen:', error);

    return (
        <div className="min-h-screen bg-green-50 flex items-center justify-center p-4">
            <div id="statusScreenBrick_container" className="w-full max-w-xl">
                <StatusScreen
                    initialization={initialization}
                    customization={customization}
                    onReady={onReady}
                    onError={onError}
                />
            </div>
        </div>
    );
};

export default SuccessPage;
