import React, { useEffect } from 'react';
import { useCart } from '../store/useCart';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const PendingPage = () => {
    const { clearCart } = useCart();

    useEffect(() => {
        console.log("[PendingPage] Estableciendo sheikiPaymentStatus a 'pending'");
        localStorage.setItem('sheikiPaymentStatus', 'pending');

        console.log("[PendingPage] Limpiando carrito y datos locales.");
        clearCart();
        localStorage.removeItem('datos_envio');
        localStorage.removeItem('items_comprados');
    }, [clearCart]);

    return (
        <div className="min-h-screen bg-yellow-50 flex flex-col items-center justify-center text-center px-4 py-8">
            <motion.div
                initial={{ opacity: 0, y: -50, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{
                    duration: 0.6,
                    type: 'spring',
                    stiffness: 120,
                    delay: 0.2
                }}
                className="bg-white p-8 md:p-12 rounded-xl shadow-2xl max-w-lg w-full"
            >
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.5, duration: 0.4, type: 'spring', stiffness: 150 }}
                >
                    <svg
                        className="text-yellow-500 w-24 h-24 mx-auto mb-6 animate-pulse"
                        fill="none"
                        strokeWidth="2"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </motion.div>

                <h1 className="text-3xl md:text-4xl font-bold text-yellow-700 mb-4">
                    Pago pendiente
                </h1>
                <p className="text-lg md:text-xl text-gray-700 max-w-md mx-auto mb-8">
                    Hemos registrado tu orden, pero tu pago aún está pendiente de confirmación.
                    Una vez realizado el pago en Redpagos o Abitab, te notificaremos.
                </p>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8, duration: 0.5 }}
                >
                    <Link
                        to="/"
                        className="bg-yellow-600 hover:bg-yellow-700 text-white font-semibold py-3 px-10 rounded-lg transition duration-300 ease-in-out text-lg shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-opacity-50"
                    >
                        Volver a la tienda
                    </Link>
                </motion.div>
                <p className="text-xs text-gray-500 mt-8">
                    Si necesitas ayuda, escribinos por <Link to="/contacto" className="text-yellow-600 hover:underline">aquí</Link>.
                </p>
            </motion.div>
        </div>
    );
};

export default PendingPage;
