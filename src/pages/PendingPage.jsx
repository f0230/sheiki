import React, { useEffect } from 'react';
import { StatusScreen } from '@mercadopago/sdk-react';
import { useCart } from '../store/useCart';

const PendingPage = () => {
    const { clearCart } = useCart();

    useEffect(() => {
        console.log('[PendingPage] Estado: pending');
        localStorage.setItem('sheikiPaymentStatus', 'pending');

        clearCart();
        localStorage.removeItem('datos_envio');
        localStorage.removeItem('items_comprados');

        return () => {
            // Desmontar instancia del Brick al salir
            if (window.statusScreenBrickController) {
                window.statusScreenBrickController.unmount();
                console.log('[PendingPage] 🧹 Brick desmontado');
            }
        };
    }, [clearCart]);

    const initialization = {
        paymentId: localStorage.getItem('payment_id'), // Asegurate de guardar esto en handlePaymentSubmit
    };

    const customization = {
        backUrls: {
            return: 'https://www.sheiki.uy',       // ✅ Link para volver a la tienda
            error: 'https://www.sheiki.uy/failure' // ✅ Link en caso de error
        },
        texts: {
            ctaReturnLabel: 'Volver a la tienda',
            ctaGeneralErrorLabel: 'Intentar de nuevo',
        },
    };

    const onReady = () => console.log('[PendingPage] ✅ StatusScreen Brick listo');
    const onError = (error) => console.error('[PendingPage] ❌ Error en StatusScreen:', error);

    return (
        <div className="min-h-screen bg-yellow-50 flex items-center justify-center p-4">
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

export default PendingPage;
