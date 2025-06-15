import React, { useEffect, useState } from 'react';
import { StatusScreen } from '@mercadopago/sdk-react';
import { useCart } from '../store/useCart';
import { CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SuccessPage = () => {
    const { clearCart } = useCart();
    const [backupCart, setBackupCart] = useState([]);
    const [montoTotal, setMontoTotal] = useState(0);
    const navigate = useNavigate();

    useEffect(() => {
        localStorage.setItem('sheikiPaymentStatus', 'success');

        // 🧠 Recuperar datos para visualización
        const cartBackup = JSON.parse(localStorage.getItem('items_comprados')) || [];
        const monto = parseFloat(localStorage.getItem('monto_total')) || 0;
        const orderId = localStorage.getItem('order_id') || 'ORD-DEFAULT';
        const email = localStorage.getItem('user_email') || null;

        setBackupCart(cartBackup);
        setMontoTotal(monto);

        // 🎯 Enviar evento Meta
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
                    value: monto,
                    order_id: orderId,
                },
            }),
        }).catch((err) => console.error('[SuccessPage] ❌ Error Meta Event:', err));

        // 🧹 Limpieza
        clearCart();
        setTimeout(() => {
            localStorage.removeItem('datos_envio');
            localStorage.removeItem('items_comprados');
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
        paymentId: localStorage.getItem('payment_id'),
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
    const onError = (error) => console.error('[SuccessPage] ❌ Error StatusScreen:', error);

    return (
        <div className="min-h-screen bg-green-50 flex flex-col items-center justify-center p-4 text-center">
            <div className="mb-6 flex flex-col items-center">
                <CheckCircle className="w-12 h-12 text-green-600 animate-bounce mb-2" />
                <h2 className="text-xl sm:text-2xl font-bold text-green-800">¡Gracias por tu compra!</h2>
                <p className="text-sm sm:text-base text-gray-700 mt-1">
                    En breve recibirás un correo con el detalle de tu pedido.
                </p>
            </div>

            <div className="w-full max-w-xl mb-6">
                <StatusScreen
                    initialization={initialization}
                    customization={customization}
                    onReady={onReady}
                    onError={onError}
                />
            </div>

            {backupCart.length > 0 && (
                <div className="bg-white rounded-xl shadow p-4 w-full max-w-xl text-left text-sm sm:text-base">
                    <h3 className="font-semibold mb-2 text-gray-800">Resumen de tu compra:</h3>
                    <ul className="divide-y divide-gray-200">
                        {backupCart.map((item, idx) => (
                            <li key={idx} className="py-2 flex justify-between items-center">
                                <div>
                                    <span className="font-medium">{item.nombre}</span>
                                    <span className="block text-xs text-gray-500">
                                        Color: {item.color} | Talle: {item.talle}
                                    </span>
                                </div>
                                <div className="text-right">
                                    <span className="block font-medium">${item.precio}</span>
                                    <span className="text-xs text-gray-500">x{item.quantity}</span>
                                </div>
                            </li>
                        ))}
                    </ul>
                    <div className="border-t mt-3 pt-3 text-right font-semibold text-green-700">
                        Total: ${montoTotal.toFixed(2)}
                    </div>
                </div>
            )}

            <button
                onClick={() => navigate('/')}
                className="mt-6 bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-full shadow transition"
            >
                Volver a la tienda
            </button>
        </div>
    );
};

export default SuccessPage;
