import React, { useEffect } from 'react';
import { useCart } from '../store/useCart';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

// Si tenés un contexto de usuario con email, podés descomentar esto:
// import { useAuth } from '../context/AuthContext';

const SuccessPage = () => {
    const { clearCart } = useCart();
    // const { user } = useAuth(); // Si tenés el email del usuario

    useEffect(() => {
        console.log("[SuccessPage] Estableciendo sheikiPaymentStatus a 'success'");
        localStorage.setItem('sheikiPaymentStatus', 'success');

        console.log("[SuccessPage] Limpiando carrito y datos locales.");
        clearCart();
        localStorage.removeItem('datos_envio');
        localStorage.removeItem('items_comprados');

        // 🔄 Obtener datos de la orden desde localStorage
        const montoTotal = parseFloat(localStorage.getItem('monto_total')) || 0;
        const idDeOrden = localStorage.getItem('order_id') || 'ORD-DEFAULT';
        const email = localStorage.getItem('user_email') || null; // Si lo guardaste en el login

        // 🎯 Enviar evento a Meta API
        fetch('/api/sendEventToMeta', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                event_name: 'Purchase',
                url: window.location.href,
                user_agent: navigator.userAgent,
                email: email,
                custom_data: {
                    currency: 'UYU',
                    value: montoTotal,
                    order_id: idDeOrden,
                },
            }),
        }).catch((err) => {
            console.error('[SuccessPage] ❌ Error al enviar evento de compra a Meta:', err);
        });

        // Opcional: limpiar después de enviar el evento
        localStorage.removeItem('monto_total');
        localStorage.removeItem('order_id');

    }, [clearCart]);

    return (
        <div className="min-h-screen bg-green-50 flex flex-col items-center justify-center text-center px-4 py-8">
            <motion.div
                initial={{ opacity: 0, y: -50, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.6, type: 'spring', stiffness: 120, delay: 0.2 }}
                className="bg-white p-8 md:p-12 rounded-xl shadow-2xl max-w-lg w-full"
            >
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.5, duration: 0.4, type: 'spring', stiffness: 150 }}
                >
                    <svg
                        className="text-green-500 w-24 h-24 mx-auto mb-6"
                        fill="none"
                        strokeWidth="2"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                </motion.div>

                <h1 className="text-3xl md:text-4xl font-bold text-green-700 mb-4">
                    ¡Pago exitoso!
                </h1>
                <p className="text-lg md:text-xl text-gray-700 max-w-md mx-auto mb-8">
                    Tu compra ha sido procesada correctamente. Hemos enviado un correo electrónico con los detalles de tu pedido.
                </p>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8, duration: 0.5 }}
                >
                    <Link
                        to="/"
                        className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-10 rounded-lg transition duration-300 ease-in-out text-lg shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50"
                    >
                        Volver a la tienda
                    </Link>
                </motion.div>

                <p className="text-xs text-gray-500 mt-8">
                    Si tienes alguna pregunta, no dudes en <Link to="/contacto" className="text-green-600 hover:underline">contactarnos</Link>.
                </p>
            </motion.div>
        </div>
    );
};

export default SuccessPage;
