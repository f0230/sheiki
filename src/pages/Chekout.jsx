import React, { useState, useEffect } from 'react';
import { useCart } from '../store/useCart';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Payment } from '@mercadopago/sdk-react';
import { usePreference } from '../hooks/usePreference';
import SkeletonLoader from '../components/SkeletonLoader';
import { motion } from 'framer-motion';


const CheckoutPage = () => {
    const { items, clearCart } = useCart();
    const { preferenceId, loading, error } = usePreference(items, shippingData, shippingCost);

    const calculateTotal = () =>
        items.reduce((total, item) => total + item.precio * item.quantity, 0);

    const [shippingData, setShippingData] = useState({
        nombre: '',
        telefono: '',
        departamento: '',
        direccion: '',
    });
    const [shippingCost, setShippingCost] = useState(0);
    

    useEffect(() => {
        if (calculateTotal() >= 1800) {
            setShippingCost(0);
        } else if (shippingData.departamento.toLowerCase() === 'paysandú') {
            setShippingCost(100);
        } else if (shippingData.departamento) {
            setShippingCost(180);
        }
    }, [shippingData.departamento, items]);

    

    return (
        <div className="text-white font-product min-h-screen">
            <Header />

            <main className="max-w-[1440px] mx-auto px-4 py-12">
                <motion.h1
                    className="text-3xl font-bold mb-6"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    Checkout
                </motion.h1>

                {loading ? (
                    <SkeletonLoader lines={6} className="max-w-lg bg-white p-6 rounded-lg" />
                ) : error ? (
                    <p className="text-red-500 bg-white p-4 rounded-lg">{error}</p>
                ) : items.length === 0 ? (
                    <p>No hay productos en tu carrito.</p>
                ) : (
                    <>

<motion.div
                                        className="bg-white text-black p-6 rounded-lg mb-8"
                                        initial={{ opacity: 0, y: 30 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.4 }}
                                    >
                                        <h2 className="text-xl font-semibold mb-4">Datos de envío</h2>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <input
                                                type="text"
                                                placeholder="Nombre completo"
                                                value={shippingData.nombre}
                                                onChange={e => setShippingData({ ...shippingData, nombre: e.target.value })}
                                                className="border p-2 rounded"
                                            />
                                            <input
                                                type="tel"
                                                placeholder="Teléfono"
                                                value={shippingData.telefono}
                                                onChange={e => setShippingData({ ...shippingData, telefono: e.target.value })}
                                                className="border p-2 rounded"
                                            />
                                            <input
                                                type="text"
                                                placeholder="Departamento"
                                                value={shippingData.departamento}
                                                onChange={e => setShippingData({ ...shippingData, departamento: e.target.value })}
                                                className="border p-2 rounded"
                                            />
                                            <input
                                                type="text"
                                                placeholder="Dirección"
                                                value={shippingData.direccion}
                                                onChange={e => setShippingData({ ...shippingData, direccion: e.target.value })}
                                                className="border p-2 rounded col-span-1 md:col-span-2"
                                            />
                                        </div>
                                    </motion.div>


                        <motion.div
                            className="bg-white text-black p-6 rounded-lg"
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                        >
                            <h2 className="text-2xl font-semibold mb-4">Resumen de compra</h2>
                            <ul className="space-y-4">
                                {items.map((item, i) => (
                                    <li key={i} className="flex justify-between">
                                        <span>{item.nombre} x {item.quantity}</span>
                                        <span>${item.precio * item.quantity}</span>
                                    </li>
                                ))}
                            </ul>
                            <div className="mt-4 flex justify-between">
                                <span className="font-semibold">Total:</span>
                                <span>${calculateTotal()}</span>
                            </div>

                                        <div className="mt-2 flex justify-between">
                                            <span className="font-semibold">Envío:</span>
                                            <span>{shippingCost === 0 ? 'Gratis' : `$${shippingCost}`}</span>
                                        </div>
                                        <div className="mt-2 flex justify-between text-lg font-bold">
                                            <span>Total final:</span>
                                            <span>${calculateTotal() + shippingCost}</span>
                                        </div>

                        </motion.div>

                        {preferenceId && (
                            <motion.div
                                className="bg-white text-black p-6 rounded-lg mt-8"
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.3 }}
                            >
                                <Payment
                                    initialization={{
                                                    amount: calculateTotal() + shippingCost,
                                        preferenceId,
                                    }}
                                    customization={{
                                        paymentMethods: {
                                            ticket: 'all',
                                            creditCard: 'all',
                                            debitCard: 'all',
                                            mercadoPago: 'all',
                                        },
                                    }}
                                    onSubmit={async ({ formData }) => {
                                        console.log('✅ Pago enviado:', formData);
                                        clearCart();
                                        return true;
                                    }}
                                    onError={(error) => {
                                        console.error('❌ Error en Payment Brick:', error);
                                    }}
                                />
                            </motion.div>
                        )}
                    </>
                )}
            </main>

            <Footer />
        </div>
    );
};

export default CheckoutPage;
