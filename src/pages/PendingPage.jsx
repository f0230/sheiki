import React, { useEffect, useState } from 'react';
import { StatusScreen } from '@mercadopago/sdk-react';
import { useCart } from '../store/useCart';
import { useNavigate } from 'react-router-dom';

const PendingPage = () => {
    const { clearCart } = useCart();
    const navigate = useNavigate();

    const paymentId = localStorage.getItem('payment_id');
    const [status, setStatus] = useState('pending');
    const [statusDetail, setStatusDetail] = useState('pending_waiting_payment');

    useEffect(() => {
        console.log('[PendingPage] Estado inicial:', { paymentId });

        const storedStatus = localStorage.getItem('sheikiPaymentStatus');
        const storedDetail = localStorage.getItem('sheikiPaymentStatusDetail');
        if (storedStatus) setStatus(storedStatus);
        if (storedDetail) setStatusDetail(storedDetail);

        // Limpiar carrito y datos de envío
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
        paymentId,
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

    const mensaje = (() => {
        if (status === 'approved') {
            return {
                titulo: '🎉 ¡Pago aprobado!',
                texto: 'Gracias por tu compra. Te enviamos los detalles por email.',
            };
        }

        switch (statusDetail) {
            case 'pending_waiting_payment':
                return {
                    titulo: '📄 Instrucciones generadas',
                    texto: 'Podés pagar en Abitab, Redpagos o puntos de pago habilitados.',
                };
            case 'pending_contingency':
            case 'pending_review_manual':
            case 'in_process':
                return {
                    titulo: '🕐 Validación en curso',
                    texto: 'Tu pago está siendo revisado por Mercado Pago. Recibirás una confirmación por email.',
                };
            default:
                return {
                    titulo: '⏳ Procesando tu pago',
                    texto: 'Estamos esperando confirmación. Pronto recibirás noticias.',
                };
        }
    })();

    return (
        <div className="min-h-screen flex items-center justify-center bg-yellow-50 px-4 py-12 text-center">
            {paymentId ? (
                <div className="w-full max-w-2xl mx-auto">
                    <div className="mb-6">
                        <h2 className="text-2xl font-bold text-yellow-800">{mensaje.titulo}</h2>
                        <p className="text-gray-700 mt-2">{mensaje.texto}</p>
                    </div>
                    <div id="statusScreenBrick_container">
                        <StatusScreen
                            initialization={initialization}
                            customization={customization}
                            onReady={onReady}
                            onError={onError}
                        />
                    </div>
                </div>
            ) : (
                <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
                    <h2 className="text-2xl font-bold mb-4 text-yellow-800">⏳ Esperando confirmación</h2>
                    <p className="mb-4 text-gray-700">
                        Aguardamos respuesta de Mercado Pago. Si pagaste con efectivo, revisá tu email para el ticket.
                    </p>
                    <button
                        onClick={() => navigate('/')}
                        className="mt-4 bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700 transition"
                    >
                        Volver a la tienda
                    </button>
                </div>
            )}
        </div>
    );
};

export default PendingPage;
