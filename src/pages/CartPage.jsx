import React from 'react';
import { useCart } from '../store/useCart';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Link, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaTrashAlt, FaCreditCard } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import OptimizedImage from '../components/OptimizedImage';
import pantuflaTriste from '../assets/pantuflatriste.webp';
import mplogo from '../assets/mplogo.svg';

import ConfettiExplosion from '../components/ConfettiExplosion';



const CartPage = () => {
    const { items, removeFromCart, addToCart } = useCart();
    const { user } = useAuth();
    const navigate = useNavigate();

    const total = items.reduce((sum, item) => sum + item.precio * item.quantity, 0);
    const faltan = 1800 - total;

    const handleQuantityChange = (item, delta) => {
        const newQty = item.quantity + delta;
        if (newQty <= 0) {
            removeFromCart(items.indexOf(item));
        } else {
            addToCart(item, item.color, item.talle, delta);
        }
    };

    const handleCheckout = async () => {
        try {
            await fetch('/api/sendEventToMeta', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    event_name: 'InitiateCheckout',
                    url: window.location.href,
                    user_agent: navigator.userAgent,
                    email: user?.email || null,
                    custom_data: {
                        currency: 'UYU',
                        value: total,
                    },
                }),
            });
        } catch (error) {
            console.error("Error al enviar evento de checkout a Meta:", error);
        }
        navigate('/pago');
    };

    return (
        <div className="max-w-[1080px] mx-auto">
            <Header />
            <main className="px-4 py-[65px] md:min-h-[500px] min-h-[450px]">
                <ConfettiExplosion trigger={total >= 1800} />

                <Link to="/producto" className="flex items-center text-white mb-6">
                    <FaArrowLeft className="text-black dark:text-white mr-2" />
                    <span className="text-black dark:text-white text-[10px]">Volver al producto</span>
                </Link>

                {/* Vacío */}
                {items.length === 0 ? (
                    <div className="text-center flex flex-col items-center justify-center mt-10 relative">
                        <div className="bg-black dark:bg-white text-white dark:text-black px-4 py-2 rounded-xl shadow-md text-sm md:text-[25px] font-semibold max-w-[240px] relative -mb-8 md:-mb-20">
                            <span>¡Tu carrito está vacío!</span>
                            <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[10px] border-t-black dark:border-t-white" />
                        </div>
                        <OptimizedImage src={pantuflaTriste} alt="Pantufla triste" className="w-100 mx-auto mb-4" />
                        <Link to="/" className="text-primary underline font-medium">
                            ¡Agregá una pantufla y empezá a mimar tus pies!
                        </Link>
                    </div>
                ) : (
                    <>
                        {/* Lista de productos */}
                        <ul className="space-y-1">
                            <h1 className="text-3xl font-bold">Tu pedido está casi listo</h1>
                            <p className="mb-6 text-black dark:text-white">
                                Reservamos los productos por tiempo limitado
                            </p>
                            <AnimatePresence>
                                {items.map((item, i) => (
                                    <motion.li
                                        key={i}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="dark:bg-white bg-black text-white dark:text-black p-4 rounded-xl flex items-center justify-between"
                                    >
                                        <div className="flex gap-4 items-center">
                                            <OptimizedImage src={item.imagen} alt={item.nombre} className="w-20 h-20 rounded-md" />
                                            <div>
                                                <p className="font-semibold">{item.nombre}</p>
                                                <p className="text-sm">Color: {item.color} / Talle: {item.talle}</p>
                                                <div className="flex gap-2 items-center mt-1">
                                                    <button onClick={() => handleQuantityChange(item, -1)} className="px-2 bg-white text-black rounded">−</button>
                                                    <span>{item.quantity}</span>
                                                    <button onClick={() => handleQuantityChange(item, 1)} className="px-2 bg-white text-black rounded">+</button>
                                                </div>
                                                <p className="text-sm mt-1">Subtotal: {item.precio * item.quantity}</p>
                                            </div>
                                        </div>
                                        <button onClick={() => removeFromCart(i)} className="hover:text-red-600 transition">
                                            <FaTrashAlt />
                                        </button>
                                    </motion.li>
                                ))}
                            </AnimatePresence>
                        </ul>

                        {/* Resumen */}
                        <div className="bg-white text-black p-4 mt-6 rounded-xl space-y-3">
                            <h2 className="font-semibold text-lg">Resumen</h2>
                            <p>Total productos: <span className="font-bold">${total}</span></p>
                            <p className="text-sm text-gray-500 leading-none">
                                El costo de envío se calculará en el siguiente paso.
                            </p>

                            {/* Incentivo dinámico */}
                            {total < 1800 ? (
                                <motion.p
                                    key={faltan}
                                    initial={{ opacity: 0, y: -4 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.4 }}
                                    className="text-sm text-primary font-bold"
                                >
                                    ¡Te faltan ${faltan} para tener envío gratis!
                                </motion.p>
                            ) : (
                                <motion.p
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="text-sm text-green-600 font-semibold text-center"
                                >
                                    🎉 ¡Tu envío es gratis!
                                </motion.p>
                            )}

                            {/* CTA pagar */}
                            <button
                                onClick={handleCheckout}
                                className="bg-black text-white w-full mt-2 py-3 rounded-full text-lg flex items-center justify-center gap-2 hover:bg-gray-800 transition"
                            >
                                <FaCreditCard /> Ir a pagar
                            </button>

                            {/* Confianza */}
                            <div className="flex  items-center justify-center text-sm mt-4"> 
                                <span>Pago seguro </span>
                                 <OptimizedImage src={mplogo} alt="MercadoPago" className="w-20" />
                            

                            </div>
                            <p className="text-center text-xs text-gray-500">
                                Tarjeta, efectivo o transferencia. Envíos a todo Uruguay.
                            </p>

                            {/* CTA seguir comprando */}
                            <Link to="/producto" className="block text-sm text-center text-gray-400 mt-2 hover:text-primary transition">
                                ← Seguir viendo pantuflas
                            </Link>
                        </div>
                    </>
                )}
            </main>
            <Footer />
        </div>
    );
};

export default CartPage;
