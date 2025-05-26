import React, { useState, useEffect, useCallback } from 'react';
import { useCart } from '../store/useCart';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Payment } from '@mercadopago/sdk-react';
import SkeletonLoader from '../components/SkeletonLoader';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient'; // Importa tu cliente Supabase

const calcularCostoEnvio = ({ tipoEntrega, departamento, total }) => {
    if (total >= 1800) return 0;
    if (!tipoEntrega) return 0;
    const tipo = tipoEntrega.toLowerCase();
    const dpto = departamento ? departamento.trim().toLowerCase() : "";
    if (tipo === 'retiro') return 0;
    if (tipo === 'agencia') return 180;
    if (tipo === 'domicilio') {
        if (dpto === 'paysandú') return 100;
        return 250;
    }
    return 0;
};

const departamentosUY = [
    "Artigas", "Canelones", "Cerro Largo", "Colonia", "Durazno", "Flores",
    "Florida", "Lavalleja", "Maldonado", "Montevideo", "Paysandú", "Río Negro",
    "Rivera", "Rocha", "Salto", "San José", "Soriano", "Tacuarembó", "Treinta y Tres"
];

const CheckoutPage = () => {
    const navigate = useNavigate();
    const { items, clearCart } = useCart();

    const calculateTotal = useCallback(() => {
        return items.reduce((total, item) => total + item.precio * item.quantity, 0);
    }, [items]);

    const [shippingData, setShippingData] = useState({
        nombre: '', telefono: '', email: '', departamento: '', direccion: '', tipoEntrega: '',
    });
    const [shippingCost, setShippingCost] = useState(0);
    const [confirmed, setConfirmed] = useState(false);
    const [preferenceId, setPreferenceId] = useState(null);
    const [currentExternalRef, setCurrentExternalRef] = useState(null); // Para Supabase Realtime
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [paymentProcessing, setPaymentProcessing] = useState(false); // Renombrado para claridad
    const [isCheckoutFinalized, setIsCheckoutFinalized] = useState(false); // Para evitar múltiples finalizaciones

    const isEmailValid = shippingData.email.includes('@') && shippingData.email.includes('.');
    const isFormValid = Object.values({
        nombre: shippingData.nombre,
        telefono: shippingData.telefono,
        email: shippingData.email,
        departamento: shippingData.departamento,
        direccion: shippingData.tipoEntrega === 'domicilio' ? shippingData.direccion : 'N/A',
        tipoEntrega: shippingData.tipoEntrega
    }).every(value => value && String(value).trim() !== '') && isEmailValid;

    useEffect(() => {
        const totalActual = calculateTotal();
        const costo = calcularCostoEnvio({
            tipoEntrega: shippingData.tipoEntrega,
            departamento: shippingData.departamento,
            total: totalActual,
        });
        setShippingCost(costo);
    }, [shippingData.tipoEntrega, shippingData.departamento, items, calculateTotal]);

    useEffect(() => {
        const generarPreferencia = async () => {
            if (!confirmed || items.length === 0 || loading) return;
            setLoading(true);
            setError(null);
            try {
                const res = await fetch('/api/create-preference', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ items, shippingData, shippingCost }),
                });
                const data = await res.json();
                if (res.ok && data.preference && data.preference.id) {
                    setPreferenceId(data.preference.id);
                    // Guardar la external_reference devuelta por la API
                    if (data.preference.external_reference) {
                        setCurrentExternalRef(data.preference.external_reference);
                        console.log("Preferencia generada con external_reference:", data.preference.external_reference);
                    } else {
                        console.warn("External reference no fue devuelta por create-preference API en la respuesta esperada.");
                        // Intenta obtenerla de la estructura de la respuesta si es diferente
                        // Ejemplo: setCurrentExternalRef(data.preference.body?.external_reference);
                        // O si sabes que la `externalReference` en `metadata` es la misma
                        // que `preference.external_reference`, pero es mejor que tu API la devuelva claramente.
                        // Por ahora, asumimos que está en `data.preference.external_reference`
                    }
                } else {
                    throw new Error(data.error || data.message || 'Preferencia no generada correctamente');
                }
            } catch (err) {
                setError(err.message || 'No se pudo generar la preferencia de pago.');
                console.error('❌ Error al crear preferencia:', err);
                setConfirmed(false); // Permitir reintento
                setCurrentExternalRef(null);
            } finally {
                setLoading(false);
            }
        };

        if (confirmed && !preferenceId) { // Solo generar si no hay ya una preferenceId
            generarPreferencia();
        }
    }, [confirmed, items, shippingData, shippingCost, preferenceId, loading]); // Añadido loading y preferenceId

    const finalizeCheckout = useCallback((status) => {
        if (isCheckoutFinalized) return; // Evitar múltiples ejecuciones
        setIsCheckoutFinalized(true);

        setPaymentProcessing(false);
        setPreferenceId(null);
        setCurrentExternalRef(null);
        setConfirmed(false);
        clearCart();

        if (status === 'success') {
            navigate('/success', { replace: true });
        } else if (status === 'failure') {
            navigate('/failure', { replace: true });
        } else if (status === 'pending') {
            navigate('/pending', { replace: true });
        } else { // Caso desconocido o si solo se quiere resetear
            navigate('/', { replace: true });
        }
    }, [isCheckoutFinalized, clearCart, navigate]);


    // Listener para localStorage (redirección del navegador)
    useEffect(() => {
        if (isCheckoutFinalized) return; // No escuchar si ya se finalizó

        const handleStorageChange = (event) => {
            if (event.key === 'sheikiPaymentStatus' && event.newValue) {
                const status = event.newValue;
                localStorage.removeItem('sheikiPaymentStatus');
                console.log(`🔄 Estado de pago recibido de localStorage: ${status}`);
                finalizeCheckout(status);
            }
        };
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, [finalizeCheckout, isCheckoutFinalized]);

    // Listener para Supabase Realtime (confirmación del webhook)
    useEffect(() => {
        if (isCheckoutFinalized || !paymentProcessing || !currentExternalRef) return;

        const channelName = `order_status_${currentExternalRef}`;
        const realtimeChannel = supabase.channel(channelName, {
            config: {
                broadcast: {
                    self: false, // No recibir nuestros propios broadcasts si este cliente también pudiera enviar
                },
            },
        });

        const handleRealtimePaymentUpdate = (message) => {
            console.log(`🔔 Mensaje Realtime '${message.event}' recibido en canal ${channelName}:`, message.payload);
            if (message.payload && message.payload.external_reference === currentExternalRef) {
                if (message.payload.status === 'approved') {
                    console.log(`✅ Pago para ${currentExternalRef} aprobado vía webhook y Realtime.`);
                    finalizeCheckout('success');
                } else {
                    console.log(`⚠️ Actualización de estado no aprobada (${message.payload.status}) para ${currentExternalRef} vía Realtime.`);
                    // Podrías manejar 'rejected' o 'pending' desde aquí también si el webhook los enviara
                    // finalizeCheckout(message.payload.status); // Por ejemplo
                }
            }
        };

        realtimeChannel
            .on('broadcast', { event: 'payment_update' }, handleRealtimePaymentUpdate)
            .subscribe((status, err) => {
                if (status === 'SUBSCRIBED') {
                    console.log(`🔌 Suscrito al canal Realtime: ${channelName}`);
                } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
                    console.error(`❌ Error/Estado de canal Realtime (${channelName} - ${status}):`, err);
                    // Aquí podrías considerar un reintento de suscripción o notificar al usuario
                }
            });

        return () => {
            if (realtimeChannel) {
                console.log(`🔌 Desuscribiendo del canal Realtime: ${channelName}`);
                supabase.removeChannel(realtimeChannel).catch(err => console.error("Error al remover canal", err));
            }
        };
    }, [paymentProcessing, currentExternalRef, supabase, finalizeCheckout, isCheckoutFinalized]);


    const handlePaymentSubmit = useCallback(async () => {
        if (isCheckoutFinalized) return false;
        localStorage.setItem('datos_envio', JSON.stringify({
            ...shippingData,
            shippingCost: Number(shippingCost),
        }));
        localStorage.setItem('items_comprados', JSON.stringify(items));
        setPaymentProcessing(true);
        return true;
    }, [shippingData, shippingCost, items, isCheckoutFinalized]);

    if (paymentProcessing) {
        return (
            <div className="text-white font-product min-h-screen">
                <Header />
                <main className="max-w-[1440px] mx-auto px-4 py-12 mt-10 md:mt-12 flex flex-col items-center justify-center text-center min-h-[calc(100vh-200px)]">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white text-black p-8 rounded-lg shadow-xl"
                    >
                        <h2 className="text-2xl font-bold mb-4">Procesando tu pago</h2>
                        <p className="mb-2">Podrías ser redirigido a Mercado Pago para completar tu compra.</p>
                        <p className="mb-6">Si se abre una nueva pestaña, por favor completa el pago allí. Esta página se actualizará automáticamente.</p>
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
                        <p className="text-sm text-gray-600 mt-4">Aguardando confirmación del pago...</p>
                        {currentExternalRef && <p className="text-xs text-gray-400 mt-2">Ref: {currentExternalRef}</p>}
                    </motion.div>
                </main>
                <Footer />
            </div>
        );
    }

    return (
        <div className="text-white font-product min-h-screen">
            <Header />
            <main className="max-w-[1440px] mx-auto px-4 py-12 mt-10 md:mt-12">
                <motion.h1 /* ... */ > Checkout </motion.h1>

                {!preferenceId && !loading && (
                    <>
                        <motion.div /* ... */ >
                            <h2 className="text-xl font-semibold mb-4">Datos de envío</h2>
                            <fieldset disabled={confirmed || paymentProcessing} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Inputs de envío ... */}
                                <input type="text" placeholder="Nombre completo" value={shippingData.nombre} onChange={e => setShippingData({ ...shippingData, nombre: e.target.value })} className="border p-2 rounded disabled:bg-gray-100" />
                                <input type="email" placeholder="Email" value={shippingData.email} onChange={e => setShippingData({ ...shippingData, email: e.target.value })} className="border p-2 rounded disabled:bg-gray-100" />
                                <input type="tel" placeholder="Teléfono" value={shippingData.telefono} onChange={e => setShippingData({ ...shippingData, telefono: e.target.value })} className="border p-2 rounded disabled:bg-gray-100" />
                                <select value={shippingData.departamento} onChange={e => setShippingData({ ...shippingData, departamento: e.target.value })} className="border p-2 rounded disabled:bg-gray-100">
                                    <option value="">Seleccionar departamento</option>
                                    {departamentosUY.map(dep => <option key={dep} value={dep}>{dep}</option>)}
                                </select>
                                <input type="text" placeholder="Dirección (si aplica)" value={shippingData.direccion} onChange={e => setShippingData({ ...shippingData, direccion: e.target.value })} className="border p-2 rounded disabled:bg-gray-100" disabled={shippingData.tipoEntrega !== 'domicilio'} />
                                <select value={shippingData.tipoEntrega} onChange={e => setShippingData({ ...shippingData, tipoEntrega: e.target.value })} className="border p-2 rounded col-span-1 md:col-span-2 disabled:bg-gray-100">
                                    <option value="">Tipo de entrega</option>
                                    <option value="domicilio">A domicilio</option>
                                    <option value="agencia">Agencia DAC</option>
                                    <option value="retiro">Retiro en local (Paysandú)</option>
                                </select>
                            </fieldset>
                            {!confirmed && (
                                <button
                                    className={`mt-6 px-4 py-2 rounded font-bold transition-colors ${isFormValid && items.length > 0 ? 'bg-black text-white hover:bg-gray-700' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
                                    onClick={() => {
                                        if (isFormValid && items.length > 0) { setConfirmed(true); setError(null); }
                                        else if (items.length === 0) { setError("Tu carrito está vacío."); }
                                        else { setError("Completa todos los campos de envío requeridos."); }
                                    }}
                                    disabled={!isFormValid || items.length === 0 || paymentProcessing}
                                >
                                    Confirmar datos y generar pago
                                </button>
                            )}
                            {confirmed && !preferenceId && !loading && (
                                <button
                                    className="mt-4 ml-2 px-4 py-2 rounded font-bold bg-gray-200 text-black hover:bg-gray-300"
                                    onClick={() => { setConfirmed(false); setPreferenceId(null); setCurrentExternalRef(null); setError(null); }}
                                    disabled={paymentProcessing}
                                > Editar Datos </button>
                            )}
                        </motion.div>
                        <motion.div /* ... Resumen de compra ... */ >
                            {/* ... tu JSX del resumen de compra ... */}
                        </motion.div>
                    </>
                )}

                {loading && <div className="flex flex-col items-center justify-center bg-white text-black p-6 rounded-lg mt-8"> <SkeletonLoader lines={1} /> <p className="mt-4 text-lg">Generando tu orden de pago...</p> </div>}
                {error && <motion.div /* ... Error display ... */ > {error} </motion.div>}

                {confirmed && preferenceId && !loading && !error && (
                    <motion.div /* ... Payment Brick container ... */ >
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold">Completa tu pago</h2>
                            <button onClick={() => { setConfirmed(false); setPreferenceId(null); setCurrentExternalRef(null); setError(null); }}
                                className="text-sm text-blue-600 hover:underline"
                                disabled={paymentProcessing}>
                                Editar datos de envío
                            </button>
                        </div>
                        <Payment
                            key={preferenceId}
                            initialization={{ amount: calculateTotal() + shippingCost, preferenceId: preferenceId, }}
                            customization={{ paymentMethods: { ticket: 'all', creditCard: 'all', debitCard: 'all', mercadoPago: 'all', }, redirectMode: 'self', }}
                            onSubmit={handlePaymentSubmit}
                            onError={(mpError) => {
                                console.error('❌ Error en Payment Brick:', mpError);
                                setError('Error al iniciar el pago. Intenta de nuevo o edita tus datos.');
                                setPreferenceId(null); setCurrentExternalRef(null); setPaymentProcessing(false);
                                // No resetear `confirmed` para permitir reintento de generación de preferencia
                            }}
                            onReady={() => console.log("Brick de MP listo.")}
                        />
                    </motion.div>
                )}
                {items.length === 0 && !error && !loading && <p className="text-center mt-8"> Tu carrito está vacío. <Link to="/producto" className="text-blue-500 hover:underline ml-1">Ir a productos</Link> </p>}
            </main>
            <Footer />
        </div>
    );
};

export default CheckoutPage;