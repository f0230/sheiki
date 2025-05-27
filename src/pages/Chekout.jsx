// src/pages/Chekout.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useCart } from '../store/useCart'; //
import Header from '../components/Header'; //
import Footer from '../components/Footer'; //
import SkeletonLoader from '../components/SkeletonLoader'; //
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient'; //

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
}; //

const departamentosUY = [
    "Artigas", "Canelones", "Cerro Largo", "Colonia", "Durazno", "Flores",
    "Florida", "Lavalleja", "Maldonado", "Montevideo", "Paysandú", "Río Negro",
    "Rivera", "Rocha", "Salto", "San José", "Soriano", "Tacuarembó", "Treinta y Tres"
]; //

// Keep controller at module level or manage it carefully to avoid stale closures in callbacks
let cardPaymentBrickController = null;

const safeUnmountBrick = (controller) => {
    if (controller && typeof controller.unmount === 'function') {
        try {
            const promise = controller.unmount();
            if (promise && typeof promise.catch === 'function') {
                promise.catch(e => console.warn("Error unmounting brick:", e));
            } else {
                console.warn("Brick controller unmount did not return a catchable promise or was already unmounted.");
            }
        } catch (e) {
            console.warn("Exception during brick unmount:", e);
        }
    }
    return null;
};


const CheckoutPage = () => {
    const navigate = useNavigate();
    const { items, clearCart } = useCart(); //

    const calculateTotal = useCallback(() => {
        return items.reduce((total, item) => total + item.precio * item.quantity, 0);
    }, [items]); //

    const [shippingData, setShippingData] = useState({
        nombre: '', telefono: '', email: '', departamento: '', direccion: '', tipoEntrega: '',
    }); //
    const [shippingCost, setShippingCost] = useState(0); //
    const [confirmedShipping, setConfirmedShipping] = useState(false);
    const [preferenceDetails, setPreferenceDetails] = useState({ id: null, externalReference: null, totalAmount: 0 });
    const [loadingPreference, setLoadingPreference] = useState(false);
    const [error, setError] = useState(null); //
    const [paymentProcessing, setPaymentProcessing] = useState(false); //
    const [isCheckoutFinalized, setIsCheckoutFinalized] = useState(false); //
    const [isBrickInitialized, setIsBrickInitialized] = useState(false);

    const brickContainerRef = useRef(null);

    const mpPublicKey = 'APP_USR-e255a7a3-c855-4cac-8ef9-b51094d2701b'; //

    const isEmailValid = shippingData.email.includes('@') && shippingData.email.includes('.'); //
    const isFormValid = Object.values({
        nombre: shippingData.nombre,
        telefono: shippingData.telefono,
        email: shippingData.email,
        departamento: shippingData.departamento,
        direccion: shippingData.tipoEntrega === 'domicilio' ? shippingData.direccion : 'N/A',
        tipoEntrega: shippingData.tipoEntrega
    }).every(value => value && String(value).trim() !== '') && isEmailValid; //

    useEffect(() => {
        const totalActual = calculateTotal();
        const costo = calcularCostoEnvio({
            tipoEntrega: shippingData.tipoEntrega,
            departamento: shippingData.departamento,
            total: totalActual,
        });
        setShippingCost(costo);
    }, [shippingData.tipoEntrega, shippingData.departamento, items, calculateTotal]); //

    const handleConfirmShippingAndCreatePreference = async () => {
        if (!isFormValid || items.length === 0) {
            setError(items.length === 0 ? "Tu carrito está vacío." : "Por favor, completa todos los campos de envío requeridos.");
            return;
        }
        setLoadingPreference(true);
        setError(null);
        setIsBrickInitialized(false); // Reset brick status before creating new preference

        cardPaymentBrickController = safeUnmountBrick(cardPaymentBrickController);
        if (brickContainerRef.current) {
            brickContainerRef.current.innerHTML = ''; // Clear the container
        }

        try {
            const res = await fetch('/api/create-preference', { //
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ items, shippingData, shippingCost }),
            });
            const data = await res.json();

            if (res.ok && data.preference && data.preference.id && data.preference.external_reference) {
                setPreferenceDetails({
                    id: data.preference.id,
                    externalReference: data.preference.external_reference,
                    totalAmount: parseFloat((calculateTotal() + shippingCost).toFixed(2))
                });
                setConfirmedShipping(true);
                console.log(`[Checkout] ✅ Preferencia y external_reference (${data.preference.external_reference}) establecidos.`);
            } else {
                throw new Error(data.error || data.details || data.message || 'Respuesta inválida al crear preferencia');
            }
        } catch (err) {
            setError(err.message || 'No se pudo generar la preferencia de pago.');
            console.error('[Checkout] ❌ Error al crear preferencia en frontend:', err);
            setConfirmedShipping(false);
        } finally {
            setLoadingPreference(false);
        }
    };

    useEffect(() => {
        // This effect should only run when the conditions to initialize the brick are met
        // and the brick isn't already initialized for the current preference.
        if (confirmedShipping && preferenceDetails.id && preferenceDetails.externalReference && !loadingPreference && !isBrickInitialized) {
            if (!window.MercadoPago) {
                console.error("MercadoPago SDK not loaded!");
                setError("Error al cargar el SDK de Mercado Pago. Refresca la página.");
                return;
            }

            const mp = new window.MercadoPago(mpPublicKey);
            const bricksBuilder = mp.bricks();

            const brickSettings = {
                initialization: {
                    amount: preferenceDetails.totalAmount,
                    preferenceId: preferenceDetails.id,
                    payer: {
                        email: shippingData.email,
                        firstName: shippingData.nombre.split(' ')[0],
                        lastName: shippingData.nombre.split(' ').slice(1).join(' '),
                    },
                },
                customization: {
                    paymentMethods: {
                        maxInstallments: 3,
                        // Exclude payment types if needed, e.g. Mercado Pago Wallet redirect
                        // mercadoPago: 'none', 
                    },
                    visual: { style: { theme: 'default' } },
                },
                callbacks: {
                    onReady: () => {
                        console.log('Card Payment Brick está listo.');
                        setIsBrickInitialized(true);
                        setPaymentProcessing(false);
                    },
                    onError: (errorCallback) => {
                        console.error('Error en Card Payment Brick:', errorCallback);
                        setError(errorCallback.message || 'Error al inicializar el formulario de pago. Por favor, revisa los datos e intenta de nuevo.');
                        setPaymentProcessing(false);
                        setIsBrickInitialized(false); // Allow re-initialization attempt
                        cardPaymentBrickController = safeUnmountBrick(cardPaymentBrickController);
                        if (brickContainerRef.current) {
                            brickContainerRef.current.innerHTML = '';
                        }
                        // setConfirmedShipping(false); // Optionally allow user to re-confirm data, or show a retry button
                    },
                    onSubmit: async (formData) => {
                        setPaymentProcessing(true);
                        setError(null);
                        try {
                            // Ensure all necessary data is sent to the backend
                            const payload = {
                                ...formData,
                                transaction_amount: preferenceDetails.totalAmount,
                                external_reference: preferenceDetails.externalReference,
                                order_items: items.map(item => ({
                                    id: item.id, // Ensure product ID is passed
                                    title: item.nombre,
                                    unit_price: item.precio,
                                    quantity: item.quantity,
                                    color: item.color,
                                    talle: item.talle
                                })),
                                shipping_cost: shippingCost,
                                shipping_data: shippingData,
                            };
                            console.log("[Checkout] Enviando datos del brick al backend:", payload);
                            const response = await fetch('/api/process-card-payment', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify(payload),
                            });
                            const paymentResult = await response.json();
                            if (!response.ok) {
                                throw new Error(paymentResult.message || paymentResult.error || 'Error al procesar el pago con tarjeta.');
                            }
                            console.log('[Checkout] Respuesta del backend a process-card-payment:', paymentResult);
                            // UI shows "Processing payment..." and waits for Realtime update
                        } catch (err) {
                            console.error('[Checkout] Error enviando datos del brick al backend:', err);
                            setError(err.message || 'No se pudo procesar el pago. Intenta nuevamente.');
                            setPaymentProcessing(false);
                        }
                    },
                },
            };

            // Ensure previous instance is unmounted before creating a new one.
            // This check helps if the effect re-runs due to other dependency changes.
            cardPaymentBrickController = safeUnmountBrick(cardPaymentBrickController);

            if (brickContainerRef.current) {
                bricksBuilder.create('cardPayment', brickContainerRef.current.id, brickSettings)
                    .then(controller => {
                        cardPaymentBrickController = controller;
                        // setIsBrickInitialized(true); // Moved to onReady
                    })
                    .catch(err => {
                        console.error('Error creating Card Payment Brick:', err);
                        setError('Error al inicializar el formulario de pago.');
                        setIsBrickInitialized(false); // Ensure this is reset on creation failure
                    });
            } else {
                console.error("Brick container ref not available for mounting.");
                setError("No se pudo mostrar el formulario de pago. Intenta de nuevo.");
            }
        }
        // The cleanup function for this useEffect
        return () => {
            // Unmount the brick if the component unmounts or if dependencies cause a re-run
            // before the brick is naturally replaced.
            if (cardPaymentBrickController) {
                console.log("[Checkout] useEffect Brick cleanup: Unmounting brick.");
                cardPaymentBrickController = safeUnmountBrick(cardPaymentBrickController);
                // setIsBrickInitialized(false); // Reset here to allow re-init if deps change
            }
        };
    }, [
        confirmedShipping,
        preferenceDetails, // Note: if this is an object, ensure it's stable or use its primitive parts
        loadingPreference,
        // mpPublicKey, // Constant, can be removed if defined outside
        // shippingData, // Object, consider stability or use primitives
        // items, // Array, consider stability or use length/derived primitive
        // shippingCost, // Primitive
        // calculateTotal // Callback, ensure memoized correctly
        // --- Dependencies that define when to re-initialize the brick ---
        // If shippingData, items, shippingCost, calculateTotal are expected to change
        // and require a new brick instance, they should be here.
        // However, for stability, often only preferenceDetails.id or externalReference is enough
        // if the amount is part of preferenceDetails.
        // For now, keeping it simple:
        mpPublicKey, // Added back for completeness, though it's constant
        // The core idea is: if preferenceDetails.id changes, we need a new brick.
        // Other data is passed into the brick's initialization.
    ]); // Removed isBrickInitialized from here


    const finalizeCheckout = useCallback((status, fromSource = "unknown") => {
        if (isCheckoutFinalized) {
            console.log(`[Checkout] Intento de finalizar checkout ya finalizado (desde ${fromSource}). Estado: ${status}`);
            return;
        }
        console.log(`[Checkout] Finalizando checkout con estado: ${status} (desde ${fromSource})`);
        setIsCheckoutFinalized(true); // Mark as finalized early
        setPaymentProcessing(false);
        setConfirmedShipping(false); // Reset for potential new checkout later
        setIsBrickInitialized(false); // Reset brick status

        cardPaymentBrickController = safeUnmountBrick(cardPaymentBrickController);
        if (brickContainerRef.current) {
            brickContainerRef.current.innerHTML = ''; // Clear container
        }

        // Only clear cart after all other operations that might need cart data
        // However, for payment status pages, cart should be cleared.
        // Deferring clearCart to SuccessPage/PendingPage might be safer
        // if there's any scenario where user might return to checkout from them.
        // But current logic is to clear it here before redirect.
        clearCart(); //

        if (status === 'approved' || status === 'success') navigate('/success', { replace: true });
        else if (status === 'rejected' || status === 'failure') navigate('/failure', { replace: true });
        else if (status === 'pending' || status === 'in_process') navigate('/pending', { replace: true });
        else navigate('/', { replace: true });

    }, [isCheckoutFinalized, clearCart, navigate]); //

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
    }, [finalizeCheckout, isCheckoutFinalized]); //

    useEffect(() => {
        if (isCheckoutFinalized || !preferenceDetails.externalReference) {
            // If no external reference, or checkout is done, don't subscribe.
            return;
        }

        const channelName = `order_status_${preferenceDetails.externalReference}`;
        console.log(`[Checkout-RT] Intentando suscribir al canal: ${channelName}`);
        let realtimeChannel = supabase.channel(channelName, { //
            config: { broadcast: { self: true } }
        });

        const handleRealtimePaymentUpdate = (message) => {
            console.log(`[Checkout-RT] 🔔 Mensaje Realtime '${message.event}' en canal ${channelName}:`, message.payload);
            if (message.payload && message.payload.external_reference === preferenceDetails.externalReference) {
                const status = message.payload.status;
                console.log(`[Checkout-RT] 🔔 Estado recibido vía Realtime: ${status}`);
                finalizeCheckout(status, "realtime");
            } else {
                console.log(`[Checkout-RT] Mensaje Realtime ignorado. Esperado: ${preferenceDetails.externalReference}, Recibido: ${message.payload?.external_reference}`);
            }
        };

        realtimeChannel
            .on('broadcast', { event: 'payment_update' }, handleRealtimePaymentUpdate)
            .subscribe((status, err) => {
                if (status === 'SUBSCRIBED') {
                    console.log(`[Checkout-RT] 🔌 Suscrito: ${channelName}`);
                } else if (['CHANNEL_ERROR', 'TIMED_OUT', 'CLOSED'].includes(status)) {
                    console.error(`[Checkout-RT] ❌ Canal ${channelName} - ${status}:`, err || 'No error object provided by SDK');
                }
            });

        return () => {
            if (realtimeChannel) {
                console.log(`[Checkout-RT] 🔌 Desuscribiendo del canal: ${channelName}`);
                supabase.removeChannel(realtimeChannel)
                    .then(responseStatus => {
                        console.log(`[Checkout-RT] Estado de desuscripción para ${channelName}: ${responseStatus}`);
                        realtimeChannel = null; // Ensure it's marked as removed
                    })
                    .catch(removeErr => {
                        console.error(`[Checkout-RT] Error al remover canal ${channelName}:`, removeErr || 'No error object provided by SDK');
                        realtimeChannel = null; // Ensure it's marked as removed
                    });
            }
        };
    }, [preferenceDetails.externalReference, supabase, finalizeCheckout, isCheckoutFinalized]); //

    // UI Rendering
    if (paymentProcessing && !isBrickInitialized && confirmedShipping) { // Loading state while brick is being prepared OR actual payment processing
        return (
            <div className="text-black dark:text-white font-product min-h-screen">
                <Header />
                <main className="max-w-[1440px] mx-auto px-4 py-12 mt-10 md:mt-12 flex flex-col items-center justify-center text-center min-h-[calc(100vh-200px)]">
                    <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="bg-white text-black p-8 rounded-lg shadow-xl">
                        <h2 className="text-2xl font-bold mb-4">
                            {paymentProcessing && isBrickInitialized ? "Procesando tu pago" : "Preparando formulario de pago"}
                        </h2>
                        <p className="mb-6">Aguardando...</p>
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
                        {preferenceDetails.externalReference && <p className="text-xs text-gray-400 mt-2">Ref: {preferenceDetails.externalReference}</p>}
                    </motion.div>
                </main>
                <Footer />
            </div>
        );
    }


    return (
        <div className="min-h-screen max-w-[1080px] mx-auto">
            <Header />
            <main className="mx-auto px-4 py-12 mt-10 md:mt-12">
                <motion.h1 className="text-3xl font-bold mb-6 text-black dark:text-white" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
                    Checkout
                </motion.h1>

                {!confirmedShipping && ( // Show shipping form if not confirmed
                    <motion.div className="bg-white text-black p-6 rounded-lg mb-8" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
                        <h2 className="text-xl mb-4">Datos de envío</h2>
                        <fieldset disabled={loadingPreference || paymentProcessing} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Inputs for shipping data */}
                            <input type="text" placeholder="Nombre completo" value={shippingData.nombre} onChange={e => setShippingData({ ...shippingData, nombre: e.target.value })} className="border p-2 rounded disabled:bg-gray-100" />
                            <input type="email" placeholder="Email" value={shippingData.email} onChange={e => setShippingData({ ...shippingData, email: e.target.value })} className="border p-2 rounded disabled:bg-gray-100" />
                            <input type="tel" placeholder="Teléfono" value={shippingData.telefono} onChange={e => setShippingData({ ...shippingData, telefono: e.target.value })} className="border p-2 rounded disabled:bg-gray-100" />
                            <select value={shippingData.departamento} onChange={e => setShippingData({ ...shippingData, departamento: e.target.value })} className="border p-2 rounded disabled:bg-gray-100">
                                <option value="">Seleccionar departamento</option>
                                {departamentosUY.map(dep => <option key={dep} value={dep}>{dep}</option>)}
                            </select>
                            <select value={shippingData.tipoEntrega} onChange={e => setShippingData({ ...shippingData, tipoEntrega: e.target.value })} className="border p-2 rounded col-span-1 disabled:bg-gray-100">
                                <option value="">Tipo de entrega</option>
                                <option value="domicilio">A domicilio</option>
                                <option value="agencia">Agencia DAC</option>
                                <option value="retiro">Retiro en local (Paysandú)</option>
                            </select>
                            <input type="text" placeholder="Dirección (si aplica)" value={shippingData.direccion} onChange={e => setShippingData({ ...shippingData, direccion: e.target.value })} className="border p-2 rounded disabled:bg-gray-100" disabled={shippingData.tipoEntrega !== 'domicilio'} />
                        </fieldset>
                        <button
                            className={`mt-6 px-4 py-2 rounded font-bold transition-colors ${isFormValid && items.length > 0 ? 'bg-black text-white hover:bg-gray-700' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
                            onClick={handleConfirmShippingAndCreatePreference}
                            disabled={!isFormValid || items.length === 0 || loadingPreference || paymentProcessing}
                        >
                            {loadingPreference ? 'Generando...' : 'Confirmar datos y Pagar'}
                        </button>
                    </motion.div>
                )}

                {/* Order Summary - Always visible if items exist, or when shipping is confirmed */}
                <motion.div
                    className="bg-white text-black p-6 rounded-lg mb-8"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    // Show summary always if items are present, or if shipping confirmed and not yet processing payment with brick
                    hidden={paymentProcessing && isBrickInitialized && confirmedShipping}
                >
                    <h2 className="text-2xl font-semibold mb-4">Resumen de compra</h2>
                    {items.length > 0 ? (
                        <>
                            {/* items list */}
                            <ul className="space-y-4">
                                {items.map((item, i) => (
                                    <li key={`${item.id}-${item.color}-${item.talle}-${i}`} className="flex justify-between">
                                        <span>{item.nombre} (x{item.quantity}) - {item.color} / T{item.talle}</span>
                                        <span>${(item.precio * item.quantity).toFixed(2)}</span>
                                    </li>
                                ))}
                            </ul>
                            <div className="mt-4 pt-4 border-t">
                                <div className="flex justify-between">
                                    <span className="font-semibold">Subtotal:</span>
                                    <span>${calculateTotal().toFixed(2)}</span>
                                </div>
                                <div className="mt-2 flex justify-between">
                                    <span className="font-semibold">Envío:</span>
                                    <span>{shippingCost === 0 && calculateTotal() >= 1800 ? 'Gratis (compra > $1800)' : shippingCost === 0 && (shippingData.tipoEntrega === 'retiro') ? 'Gratis (Retiro)' : shippingCost > 0 ? `$${shippingCost.toFixed(2)}` : 'A calcular'}</span>
                                </div>
                                <div className="mt-2 flex justify-between text-lg font-bold">
                                    <span>Total final:</span>
                                    <span>${(calculateTotal() + shippingCost).toFixed(2)}</span>
                                </div>
                            </div>
                        </>
                    ) : (<p>No hay productos en tu carrito.</p>)}
                    {confirmedShipping && !paymentProcessing && ( // Edit button
                        <button
                            className="mt-4 text-sm text-blue-600 hover:underline"
                            onClick={() => {
                                setConfirmedShipping(false);
                                setPreferenceDetails({ id: null, externalReference: null, totalAmount: 0 });
                                setIsBrickInitialized(false);
                                cardPaymentBrickController = safeUnmountBrick(cardPaymentBrickController);
                                if (brickContainerRef.current) brickContainerRef.current.innerHTML = '';
                                setError(null);
                            }}
                            disabled={loadingPreference || paymentProcessing}
                        >
                            Editar Datos de Envío
                        </button>
                    )}
                </motion.div>

                {loadingPreference && !confirmedShipping && ( // Loading preference state
                    <div className="flex flex-col items-center justify-center bg-white text-black p-6 rounded-lg mt-8">
                        <SkeletonLoader lines={1} />
                        <p className="mt-4 text-lg">Generando tu orden de pago...</p>
                    </div>
                )}

                {error && ( // Error display
                    <motion.div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative my-6" role="alert" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                        <strong className="font-bold">Error: </strong>
                        <span className="block sm:inline">{error}</span>
                        <button onClick={() => { setError(null); }} className="absolute top-0 bottom-0 right-0 px-4 py-3">
                            <span className="text-2xl">×</span>
                        </button>
                    </motion.div>
                )}

                {/* Brick Container Logic */}
                {confirmedShipping && preferenceDetails.id && !loadingPreference && !error && (
                    <motion.div
                        id="cardPaymentBrick_container"
                        ref={brickContainerRef}
                        className={`bg-white text-black p-6 rounded-lg mt-8 ${paymentProcessing && isBrickInitialized ? 'opacity-50 pointer-events-none' : ''}`}
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                    >
                        {(!isBrickInitialized && !paymentProcessing) && <p className="text-center text-gray-500">Cargando formulario de pago...</p>}
                        {(paymentProcessing && isBrickInitialized) && ( // Show this when brick has submitted
                            <div className="flex flex-col items-center justify-center py-4">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-2"></div>
                                <p>Procesando pago, por favor espera...</p>
                            </div>
                        )}
                        {/* Brick is mounted here by SDK. If !isBrickInitialized, the "Cargando..." message shows.
                            If isBrickInitialized AND paymentProcessing is true (meaning Brick onSubmit was called),
                            the processing message above is shown, and the container is faded/disabled. */}
                    </motion.div>
                )}

                {items.length === 0 && !error && !loadingPreference && !confirmedShipping && (
                    <p className="text-center mt-8 text-black dark:text-white">
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