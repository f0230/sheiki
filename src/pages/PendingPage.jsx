import React, { useEffect } from 'react';
import { StatusScreen } from '@mercadopago/sdk-react';
import { useCart } from '../store/useCart';
import { useNavigate } from 'react-router-dom';

const PendingPage = () => {
    const { clearCart } = useCart();
    const navigate = useNavigate();

    const paymentId = localStorage.getItem('payment_id');

    useEffect(() => {
        console.log('[PendingPage] Estado: pending');

        // Guardar estado actual (opcional para debug o seguimiento)
        localStorage.setItem('sheikiPaymentStatus', 'pending');

        // Limpiar datos del carrito y envío
        clearCart();
        localStorage.removeItem('datos_envio');
        localStorage.removeItem('items_comprados');

        return () => {
            if (window.statusScreenBrickController) {
                window.statusScreenBrickController.unmount();
                console.log('[PendingPage] 🧹 Brick desmontado');
            }
        };
    }, [clearCart]);

    const initialization = {
        paymentId, // Se guarda en localStorage desde handlePaymentSubmit
    };

    const customization = {
        backUrls: {
            return: 'https://www.sheiki.uy',
            error: 'https://www.sheiki.uy/failure',
        },
        texts: {
            ctaReturnLabel: 'Volver a la tienda',
            ctaGeneralErrorLabel: 'Intentar de nuevo',
        },
    };

    const onReady = () => console.log('[PendingPage] ✅ StatusScreen Brick listo');
    const onError = (error) => {
        console.error('[PendingPage] ❌ Error en StatusScreen:', error);
        navigate('/failure');
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-yellow-50 px-4 py-12 text-center">
            {paymentId ? (
                <div id="statusScreenBrick_container" className="w-full max-w-2xl mx-auto">
                    <StatusScreen
                        initialization={initialization}
                        customization={customization}
                        onReady={onReady}
                        onError={onError}
                    />
                </div>
            ) : (
                <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
                    <h2 className="text-2xl font-bold mb-4 text-yellow-800">⏳ Procesando tu pago</h2>
                    <p className="mb-4 text-gray-700">
                        Esperamos la confirmación desde Mercado Pago. En breve recibirás las instrucciones por email.
                    </p>
                    <button
                        onClick={() => navigate('/')}
                        className="mt-4 bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700"
                    >
                        Volver a la tienda
                    </button>
                </div>
            )}
        </div>
    );
};

export default PendingPage;
