// Refactorizado Checkout.jsx con resumen y flujo mejorado
import React, { useState, useEffect } from 'react';
import { useCart } from '../store/useCart';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Payment } from '@mercadopago/sdk-react';
import SkeletonLoader from '../components/SkeletonLoader';
import { motion } from 'framer-motion';

const calcularCostoEnvio = ({ tipoEntrega, departamento, total }) => {
    if (total >= 1800) return 0;
    if (!tipoEntrega) return 0;
    const tipo = tipoEntrega.toLowerCase();
    const dpto = departamento.trim().toLowerCase();
    if (tipo === 'retiro') return 0;
    if (tipo === 'agencia') return 180;
    if (tipo === 'domicilio') return dpto === 'paysandú' ? 100 : 250;
    return 0;
};

const departamentosUY = ["Artigas", "Canelones", "Cerro Largo", "Colonia", "Durazno", "Flores", "Florida", "Lavalleja", "Maldonado", "Montevideo", "Paysandú", "Río Negro", "Rivera", "Rocha", "Salto", "San José", "Soriano", "Tacuarembó", "Treinta y Tres"];

const CheckoutPage = () => {
    const { items } = useCart();
    const calculateTotal = () => items.reduce((total, item) => total + item.precio * item.quantity, 0);
    const [shippingData, setShippingData] = useState({ nombre: '', telefono: '', email: '', departamento: '', direccion: '', tipoEntrega: '' });
    const [shippingCost, setShippingCost] = useState(0);
    const [preferenceId, setPreferenceId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [step, setStep] = useState('form');

    const isEmailValid = shippingData.email.includes('@') && shippingData.email.includes('.');
    const isFormValid = Object.values(shippingData).every(v => v.trim() !== '') && isEmailValid;

    useEffect(() => {
        const total = calculateTotal();
        const costo = calcularCostoEnvio({ tipoEntrega: shippingData.tipoEntrega, departamento: shippingData.departamento, total });
        setShippingCost(costo);
    }, [shippingData.tipoEntrega, shippingData.departamento, items]);

    const handleGeneratePreference = async () => {
        if (!isFormValid) return;
        setLoading(true);
        try {
            const res = await fetch('/api/create-preference', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ items, shippingData, shippingCost })
            });
            const data = await res.json();
            if (data.preference?.id) {
                setPreferenceId(data.preference.id);
                localStorage.setItem('pending_payment', 'true');
                setStep('payment');
            } else {
                throw new Error('No se pudo generar la preferencia');
            }
        } catch (err) {
            console.error('❌ Error al crear preferencia:', err);
            setError('No se pudo generar la preferencia de pago.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="text-white font-product min-h-screen">
            <Header />
            <main className="max-w-[1440px] mx-auto px-4 py-12">
                <motion.h1 className="text-3xl font-bold mb-6" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
                    Checkout
                </motion.h1>

                {loading ? <SkeletonLoader lines={6} className="max-w-lg bg-white p-6 rounded-lg" /> : error ? (
                    <p className="text-red-500 bg-white p-4 rounded-lg">{error}</p>
                ) : items.length === 0 ? (
                    <p>No hay productos en tu carrito.</p>
                ) : (
                    <>
                        {step === 'form' && (
                            <motion.div className="bg-white text-black p-6 rounded-lg mb-8" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
                                <h2 className="text-xl font-semibold mb-4">Datos de envío</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <input type="text" placeholder="Nombre completo" value={shippingData.nombre} onChange={e => setShippingData({ ...shippingData, nombre: e.target.value })} className="border p-2 rounded" />
                                    <input type="email" placeholder="Email" value={shippingData.email} onChange={e => setShippingData({ ...shippingData, email: e.target.value })} className="border p-2 rounded" />
                                    <input type="tel" placeholder="Teléfono" value={shippingData.telefono} onChange={e => setShippingData({ ...shippingData, telefono: e.target.value })} className="border p-2 rounded" />
                                    <select value={shippingData.departamento} onChange={e => setShippingData({ ...shippingData, departamento: e.target.value })} className="border p-2 rounded">
                                        <option value="">Seleccionar departamento</option>
                                        {departamentosUY.map(dep => <option key={dep} value={dep}>{dep}</option>)}
                                    </select>
                                    <input type="text" placeholder="Dirección" value={shippingData.direccion} onChange={e => setShippingData({ ...shippingData, direccion: e.target.value })} className="border p-2 rounded" />
                                    <select value={shippingData.tipoEntrega} onChange={e => setShippingData({ ...shippingData, tipoEntrega: e.target.value })} className="border p-2 rounded col-span-1 md:col-span-2">
                                        <option value="">Tipo de entrega</option>
                                        <option value="domicilio">A domicilio</option>
                                        <option value="agencia">Agencia DAC</option>
                                        <option value="retiro">Retiro en local (Paysandú)</option>
                                    </select>
                                </div>
                                <button className={`mt-6 px-4 py-2 rounded font-bold ${isFormValid ? 'bg-black text-white' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`} onClick={handleGeneratePreference} disabled={!isFormValid}>
                                    Confirmar y proceder al pago
                                </button>
                            </motion.div>
                        )}

                        {step === 'payment' && preferenceId && (
                            <>
                                <motion.div className="bg-white text-black p-6 rounded-lg" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
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

                                <motion.div className="bg-white text-black p-6 rounded-lg mt-6" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}>
                                    <h2 className="text-2xl font-semibold mb-4">Pagar</h2>
                                            <Payment
                                                key={preferenceId}
                                                initialization={{ amount: calculateTotal() + shippingCost, preferenceId }}
                                                locale="es-UY"
                                                customization={{
                                                    paymentMethods: {
                                                        ticket: 'all',
                                                        creditCard: 'all',
                                                        debitCard: 'all',
                                                        mercadoPago: 'all',
                                                    }
                                                }}
                                                onSubmit={async () => {
                                                    console.log("📤 Pago enviado desde Brick. Esperando confirmación del webhook...");

                                                    const externalReference = `orden-${Date.now()}`;
                                                    localStorage.setItem('external_reference', externalReference);

                                                    const checkStatus = async () => {
                                                        const ref = localStorage.getItem('external_reference');
                                                        try {
                                                            const res = await fetch(`/api/check-order-status?ref=${ref}`);
                                                            const data = await res.json();
                                                            if (data.estado_pago === 'aprobado') {
                                                                console.log("✅ Pago aprobado confirmado por webhook.");
                                                                clearInterval(interval);
                                                                localStorage.removeItem('pending_payment');
                                                                localStorage.removeItem('external_reference');
                                                                clearCart();
                                                                window.location.href = '/'; // Redirige al home
                                                            }
                                                        } catch (err) {
                                                            console.warn("❌ Error al consultar estado de orden:", err);
                                                        }
                                                    };

                                                    const interval = setInterval(checkStatus, 3000);

                                                    return true; // Permite continuar el Brick
                                                }}
                                                onError={(error) => console.error('❌ Error en Payment Brick:', error)}
                                            />

                                </motion.div>
                            </>
                        )}
                    </>
                )}
            </main>
            <Footer />
        </div>
    );
};

export default CheckoutPage;
