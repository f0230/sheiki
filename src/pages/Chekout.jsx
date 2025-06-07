import React, { useState, useEffect, useCallback } from 'react';
import { useCart } from '../store/useCart';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Payment } from '@mercadopago/sdk-react';
import SkeletonLoader from '../components/SkeletonLoader';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient'; // Tu cliente Supabase

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
    const [currentExternalRef, setCurrentExternalRef] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [paymentProcessing, setPaymentProcessing] = useState(false);
    const [isCheckoutFinalized, setIsCheckoutFinalized] = useState(false);

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
            if (!confirmed || items.length === 0 || loading || preferenceId) return; // Evitar regenerar si ya hay preferenceId
            console.log("[Checkout] Iniciando generación de preferencia...");
            setLoading(true);
            setError(null);
            setCurrentExternalRef(null); // Limpiar ref anterior

            try {
                const res = await fetch('/api/create-preference', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ items, shippingData, shippingCost }),
                });
                const data = await res.json();
                console.log("[Checkout] Respuesta de /api/create-preference:", data);

                if (res.ok && data.preference && data.preference.id) {
                    setPreferenceId(data.preference.id);
                    if (data.preference.external_reference) {
                        setCurrentExternalRef(data.preference.external_reference);
                        console.log(`[Checkout] ✅ Preferencia y external_reference (${data.preference.external_reference}) establecidos.`);
                    } else {
                        console.error("[Checkout] ❌ ERROR: data.preference.external_reference está ausente en la respuesta de la API.");
                        setError("Error al obtener la referencia para el seguimiento del pago.");
                    }
                } else {
                    throw new Error(data.error || data.details || data.message || 'Respuesta inválida al crear preferencia');
                }
            } catch (err) {
                setError(err.message || 'No se pudo generar la preferencia de pago.');
                console.error('[Checkout] ❌ Error al crear preferencia en frontend:', err);
                setConfirmed(false); // Permitir reintento
            } finally {
                setLoading(false);
            }
        };

        if (confirmed && !preferenceId) {
            generarPreferencia();
        }
    }, [confirmed, items, shippingData, shippingCost, loading, preferenceId]); // Dependencias

    const finalizeCheckout = useCallback((status, fromSource = "unknown") => {
        if (isCheckoutFinalized) {
            console.log(`[Checkout] Intento de finalizar checkout ya finalizado (desde ${fromSource}). Estado: ${status}`);
            return;
        }
        console.log(`[Checkout] Finalizando checkout con estado: ${status} (desde ${fromSource})`);
        setIsCheckoutFinalized(true);

        setPaymentProcessing(false);
        setPreferenceId(null);
        // No limpiar currentExternalRef aquí inmediatamente si la suscripción Realtime aún podría estar limpiándose.
        // Se limpiará al desmontar el efecto de Realtime o si se reinicia el flujo.
        setConfirmed(false);
        clearCart();

        // Redirigir según el estado
        if (status === 'success') {
            const montoFinal = calculateTotal() + shippingCost;
            localStorage.setItem('monto_total', montoFinal.toString());
            if (currentExternalRef) localStorage.setItem('order_id', currentExternalRef);
            if (shippingData.email) localStorage.setItem('user_email', shippingData.email);

            navigate('/success', { replace: true });
        }
          
        else if (status === 'failure') navigate('/failure', { replace: true });
        else if (status === 'pending') navigate('/pending', { replace: true });
        else navigate('/', { replace: true }); // Fallback a la home

    }, [isCheckoutFinalized, clearCart, navigate]);

    // Listener para localStorage
    useEffect(() => {
        if (isCheckoutFinalized) return;
        const handleStorageChange = (event) => {
            if (event.key === 'sheikiPaymentStatus' && event.newValue) {
                const status = event.newValue;
                localStorage.removeItem('sheikiPaymentStatus');
                finalizeCheckout(status, "localStorage");
            }
        };
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, [finalizeCheckout, isCheckoutFinalized]);

    // Listener para Supabase Realtime
    useEffect(() => {
        if (isCheckoutFinalized || !paymentProcessing || !currentExternalRef) {
            // console.log(`[Checkout-RT] No se suscribe. Finalized: ${isCheckoutFinalized}, Processing: ${paymentProcessing}, Ref: ${currentExternalRef}`);
            return;
        }

        const channelName = `order_status_${currentExternalRef}`;
        console.log(`[Checkout-RT] Intentando suscribir al canal: ${channelName}`);
        const realtimeChannel = supabase.channel(channelName, {
            config: { broadcast: { self: false } }
        });

        const handleRealtimePaymentUpdate = (message) => {
            console.log(`[Checkout-RT] 🔔 Mensaje Realtime '${message.event}' en canal ${channelName}:`, message.payload);

            if (message.payload && message.payload.external_reference === currentExternalRef) {
                const status = message.payload.status;
                console.log(`[Checkout-RT] 🔔 Estado recibido vía Realtime: ${status}`);

                if (['approved', 'pending', 'in_process'].includes(status)) {
                    const redirectStatus = status === 'approved' ? 'success' : status;
                    finalizeCheckout(redirectStatus, "realtime");
                } else {
                    console.log(`[Checkout-RT] ⚠️ Estado no manejado automáticamente: ${status}`);
                }
            } else {
                console.log(`[Checkout-RT] Mensaje Realtime ignorado (external_reference no coincide o payload inválido). Esperado: ${currentExternalRef}, Recibido: ${message.payload?.external_reference}`);
            }
        };


        realtimeChannel
            .on('broadcast', { event: 'payment_update' }, handleRealtimePaymentUpdate)
            .subscribe((status, err) => {
                if (status === 'SUBSCRIBED') {
                    console.log(`[Checkout-RT] 🔌 Suscrito exitosamente al canal: ${channelName}`);
                } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
                    console.error(`[Checkout-RT] ❌ Error/Estado de canal Realtime (${channelName} - ${status}):`, err);
                    // Considerar lógica de reintento o notificación al usuario si la suscripción falla persistentemente
                    setError("No se pudo conectar para actualizaciones de pago en tiempo real. Por favor, verifica tu confirmación de pago manualmente.");
                    setPaymentProcessing(false); // Para que el usuario no se quede "colgado"
                }
            });

        return () => {
            if (realtimeChannel) {
                console.log(`[Checkout-RT] 🔌 Desuscribiendo del canal Realtime: ${channelName}`);
                supabase.removeChannel(realtimeChannel)
                    .then(status => console.log(`[Checkout-RT] Estado de desuscripción: ${status}`))
                    .catch(removeErr => console.error("[Checkout-RT] Error al remover canal Realtime:", removeErr));
            }
        };
    }, [paymentProcessing, currentExternalRef, supabase, finalizeCheckout, isCheckoutFinalized]);

    const handlePaymentSubmit = useCallback(async () => {
        if (isCheckoutFinalized) return false;
        console.log("[Checkout] handlePaymentSubmit llamado.");
        localStorage.setItem('datos_envio', JSON.stringify({ ...shippingData, shippingCost: Number(shippingCost) }));
        localStorage.setItem('items_comprados', JSON.stringify(items));
        setPaymentProcessing(true);
        // La suscripción a Realtime se activará por el useEffect que depende de `paymentProcessing` y `currentExternalRef`
        return true;
    }, [shippingData, shippingCost, items, isCheckoutFinalized]);


    if (paymentProcessing) {
        return ( /* ... UI de "Procesando pago..." ... */
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
                        <p className="mb-6">Si se abrió una nueva pestaña, por favor completa el pago allí. Esta página se actualizará automáticamente.</p>
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
                        <p className="text-sm text-gray-600 mt-4">Aguardando confirmación del pago...</p>
                        {currentExternalRef && <p className="text-xs text-gray-400 mt-2">Ref: {currentExternalRef}</p>}
                    </motion.div>
                </main>
                <Footer />
            </div>
        );
    }

    return ( /* ... JSX del formulario, resumen y Payment Brick ... */
        <div className=" min-h-screen max-w-[1080px] mx-auto">
            <Header />
            <main className=" mx-auto px-4 py-12 mt-10 md:mt-12">
                <motion.h1
                    className="text-3xl font-bold mb-6"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    Checkout
                </motion.h1>

                {!preferenceId && !loading && (
                    <>
                        <motion.div
                            className="bg-white text-black p-6 rounded-lg mb-8"
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4 }}
                        >
                            <h2 className="text-xl mb-4">Datos de envío</h2>
                            <fieldset disabled={confirmed || paymentProcessing} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <input type="text" placeholder="Nombre completo" value={shippingData.nombre} onChange={e => setShippingData({ ...shippingData, nombre: e.target.value })} className="border p-2 rounded disabled:bg-gray-100" />
                                <input type="email" placeholder="Email" value={shippingData.email} onChange={e => setShippingData({ ...shippingData, email: e.target.value })} className="border p-2 rounded disabled:bg-gray-100" />
                                <input type="tel" placeholder="Teléfono" value={shippingData.telefono} onChange={e => setShippingData({ ...shippingData, telefono: e.target.value })} className="border p-2 rounded disabled:bg-gray-100" />
                                <select value={shippingData.departamento} onChange={e => setShippingData({ ...shippingData, departamento: e.target.value })} className="border p-2 rounded disabled:bg-gray-100">
                                    <option value="">Seleccionar departamento</option>
                                    {departamentosUY.map(dep => <option key={dep} value={dep}>{dep}</option>)}
                                </select>
                                <select value={shippingData.tipoEntrega} onChange={e => setShippingData({ ...shippingData, tipoEntrega: e.target.value })} className="border p-2 rounded col-span-1  disabled:bg-gray-100">
                                    <option value="">Tipo de entrega</option>
                                    <option value="domicilio">A domicilio</option>
                                    <option value="agencia">Agencia DAC</option>
                                    <option value="retiro">Retiro en local (Paysandú)</option>
                                </select>
                                <input type="text" placeholder="Dirección (si aplica)" value={shippingData.direccion} onChange={e => setShippingData({ ...shippingData, direccion: e.target.value })} className="border p-2 rounded disabled:bg-gray-100" disabled={shippingData.tipoEntrega !== 'domicilio'} />

                            </fieldset>
                            {!confirmed && (
                                <button
                                    className={`mt-6 px-4 py-2 rounded font-bold transition-colors ${isFormValid && items.length > 0 ? 'bg-black text-white hover:bg-gray-700' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
                                    onClick={() => {
                                        if (isFormValid && items.length > 0) { setConfirmed(true); setError(null); }
                                        else if (items.length === 0) { setError("Tu carrito está vacío. Agrega productos antes de continuar."); }
                                        else { setError("Por favor, completa todos los campos de envío requeridos."); }
                                    }}
                                    disabled={!isFormValid || items.length === 0 || paymentProcessing}
                                >
                                    Confirmar datos y generar pago
                                </button>
                            )}
                            {confirmed && !preferenceId && !loading && ( // Botón para editar datos si ya confirmó pero aún no hay preferencia
                                <button
                                    className="mt-4 ml-2 px-4 py-2 rounded font-bold bg-gray-200 text-black hover:bg-gray-300 transition-colors"
                                    onClick={() => { setConfirmed(false); setPreferenceId(null); setCurrentExternalRef(null); setError(null); }} // Limpiar también currentExternalRef
                                    disabled={paymentProcessing}
                                > Editar Datos </button>
                            )}
                        </motion.div>

                        <motion.div
                            className="bg-white text-black p-6 rounded-lg"
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                        >
                            <h2 className="text-2xl font-semibold mb-4">Resumen de compra</h2>
                            {items.length > 0 ? (
                                <>
                                    <ul className="space-y-4">
                                        {items.map((item, i) => (
                                            <li key={`${item.id}-${item.color}-${item.talle}-${i}`} className="flex justify-between">
                                                <span>{item.nombre} (x{item.quantity}) - {item.color} / T{item.talle}</span>
                                                <span>${item.precio * item.quantity}</span>
                                            </li>
                                        ))}
                                    </ul>
                                    <div className="mt-4 pt-4 border-t">
                                        <div className="flex justify-between">
                                            <span className="font-semibold">Subtotal:</span>
                                            <span>${calculateTotal()}</span>
                                        </div>
                                        <div className="mt-2 flex justify-between">
                                            <span className="font-semibold">Envío:</span>
                                            <span>{shippingCost === 0 && calculateTotal() >= 1800 ? 'Gratis ' : shippingCost === 0 && (shippingData.tipoEntrega === 'retiro') ? 'Gratis (Retiro)' : shippingCost === 0 && (shippingData.tipoEntrega === 'agencia') ? 'Gratis (Agencia)' : shippingCost > 0 ? `$${shippingCost}` : 'A calcular'}</span>
                                        </div>
                                        <div className="mt-2 flex justify-between text-lg font-bold">
                                            <span>Total final:</span>
                                            <span>${calculateTotal() + shippingCost}</span>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <p>No hay productos en tu carrito.</p>
                            )}
                        </motion.div>
                    </>
                )}

                {loading && <div className="flex flex-col items-center justify-center bg-white text-black p-6 rounded-lg mt-8"> <SkeletonLoader lines={1} /> <p className="mt-4 text-lg">Generando tu orden de pago...</p> </div>}

                {error && (
                    <motion.div
                        className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative my-6"
                        role="alert"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <strong className="font-bold">Error: </strong>
                        <span className="block sm:inline">{error}</span>
                        <button
                            onClick={() => { setError(null); }}
                            className="absolute top-0 bottom-0 right-0 px-4 py-3"
                        >
                            <span className="text-2xl">×</span>
                        </button>
                    </motion.div>
                )}

                {confirmed && preferenceId && !loading && !error && (
                    <motion.div
                        className="bg-white text-black p-6 rounded-lg mt-8"
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                    >
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold">Completa tu pago</h2>
                            <button onClick={() => { setConfirmed(false); setPreferenceId(null); setCurrentExternalRef(null); setError(null); }}
                                className="text-sm text-blue-600 hover:underline"
                                disabled={paymentProcessing}>
                                Editar datos de envío
                            </button>
                        </div>
                        <Payment
                            key={preferenceId} // Forzar re-render si preferenceId cambia
                            initialization={{
                                amount: calculateTotal() + shippingCost,
                                preferenceId: preferenceId,
                            }}
                            customization={{
                                paymentMethods: { mercadoPago: 'all', },
                                redirectMode: 'blank', // Abrir en nueva pestaña
                            }}
                            onSubmit={handlePaymentSubmit}
                            onError={(mpError) => {
                                console.error('[Checkout] ❌ Error en Payment Brick:', mpError);
                                setError('Error al iniciar el pago con Mercado Pago. Por favor, intenta de nuevo o edita tus datos.');
                                setPreferenceId(null);
                                setCurrentExternalRef(null);
                                setPaymentProcessing(false);
                                // Mantener `confirmed` como true para que el usuario pueda reintentar generar la preferencia o editar datos.
                            }}
                            onReady={() => console.log("[Checkout] Brick de Pago de Mercado Pago listo.")}
                        />
                    </motion.div>
                )}
                {items.length === 0 && !error && !loading && (
                    <p className="text-center mt-8">
                        Tu carrito está vacío.
                        <Link to="/producto" className="text-blue-500 hover:underline ml-1">
                            Ir a productos
                        </Link>
                    </p>
                )}
            </main>
            <Footer />
        </div>
    );
};

export default CheckoutPage;