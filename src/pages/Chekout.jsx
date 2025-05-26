import React, { useState, useEffect, useCallback } from 'react';
import { useCart } from '../store/useCart';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Payment } from '@mercadopago/sdk-react';
import SkeletonLoader from '../components/SkeletonLoader';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';

// Definición de calcularCostoEnvio (como estaba en tu archivo original Chekout.jsx)
// Si prefieres usar el de src/utils/envio.js, puedes importarlo.
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
        nombre: '',
        telefono: '',
        email: '',
        departamento: '',
        direccion: '',
        tipoEntrega: '',
    });

    const [shippingCost, setShippingCost] = useState(0);
    const [confirmed, setConfirmed] = useState(false);
    const [preferenceId, setPreferenceId] = useState(null);
    const [loading, setLoading] = useState(false); // Para la creación de la preferencia
    const [error, setError] = useState(null);
    const [paymentProcessingInOtherTab, setPaymentProcessingInOtherTab] = useState(false);

    const isEmailValid = shippingData.email.includes('@') && shippingData.email.includes('.');
    const isFormValid = Object.values({
        nombre: shippingData.nombre,
        telefono: shippingData.telefono,
        email: shippingData.email,
        departamento: shippingData.departamento,
        // Dirección puede ser opcional si es retiro en agencia/local, ajusta según tu lógica
        direccion: shippingData.tipoEntrega === 'domicilio' ? shippingData.direccion : 'N/A',
        tipoEntrega: shippingData.tipoEntrega
    }).every(value => value && value.trim() !== '') && isEmailValid;

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
            if (!confirmed || items.length === 0) {
                if (items.length === 0 && confirmed) {
                    setError("Tu carrito está vacío. Agrega productos antes de pagar.");
                    setConfirmed(false);
                }
                return;
            }
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
                } else {
                    throw new Error(data.error || data.message || 'Preferencia no generada correctamente');
                }
            } catch (err) {
                setError(err.message || 'No se pudo generar la preferencia de pago.');
                console.error('❌ Error al crear preferencia:', err);
                setConfirmed(false);
            } finally {
                setLoading(false);
            }
        };

        if (confirmed) {
            generarPreferencia();
        }
    }, [confirmed, items, shippingData, shippingCost]);

    useEffect(() => {
        const handleStorageChange = (event) => {
            if (event.key === 'sheikiPaymentStatus' && event.newValue) {
                const status = event.newValue;
                localStorage.removeItem('sheikiPaymentStatus');

                setPaymentProcessingInOtherTab(false);
                setPreferenceId(null);
                setConfirmed(false);

                if (status === 'success') {
                    clearCart();
                    // Considera no mostrar alert y en su lugar, la página SuccessPage o PendingPage ya es suficiente
                    // O una notificación más integrada si la pestaña original sigue activa y visible.
                    // alert("¡Pago completado exitosamente! Tu orden está siendo procesada.");
                    navigate('/success', { replace: true });
                } else if (status === 'failure') {
                    // setError("El pago falló o fue cancelado en la otra pestaña.");
                    navigate('/failure', { replace: true });
                } else if (status === 'pending') {
                    // setError("El pago está pendiente de confirmación.");
                    navigate('/pending', { replace: true });
                }
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => {
            window.removeEventListener('storage', handleStorageChange);
        };
    }, [clearCart, navigate]);

    const handlePaymentSubmit = useCallback(async () => {
        localStorage.setItem('datos_envio', JSON.stringify({
            ...shippingData,
            shippingCost: Number(shippingCost), // Asegurar que sea número
        }));
        localStorage.setItem('items_comprados', JSON.stringify(items));

        // Si el redirectMode es 'blank' o si MP fuerza una nueva pestaña para ciertos métodos,
        // este estado ayudará a la UI de la pestaña original.
        setPaymentProcessingInOtherTab(true);
        return true; // Es importante retornar true para que MP proceda.
    }, [shippingData, shippingCost, items]);


    if (paymentProcessingInOtherTab && !preferenceId) {
        // Si estamos esperando el pago en otra pestaña Y ya no tenemos preferenceId (porque fue consumido o reseteado)
        // esto puede significar que la página fue refrescada o el estado se perdió.
        // En este caso, es mejor mostrar el checkout normal o un mensaje de error.
        // Para simplificar, vamos a resetear el estado si preferenceId se pierde aquí.
        // Esto es una heurística, un manejo más robusto implicaría persistir preferenceId si es necesario.
        // if (!preferenceId) setPaymentProcessingInOtherTab(false); 
        // Por ahora, si entramos aquí sin preferenceId, volvemos al flujo normal.
        // No haremos esto para no interrumpir el flujo si el usuario refresca la página de espera.
    }


    if (paymentProcessingInOtherTab) { // Mantenemos esta pantalla mientras el usuario está en la otra pestaña
        return (
            <div className="text-white font-product min-h-screen">
                <Header />
                <main className="max-w-[1440px] mx-auto px-4 py-12 mt-10 md:mt-12 flex flex-col items-center justify-center text-center min-h-[calc(100vh-200px)]">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white text-black p-8 rounded-lg shadow-xl"
                    >
                        <h2 className="text-2xl font-bold mb-4">Procesando tu pago...</h2>
                        <p className="mb-2">Has sido o serás redirigido a Mercado Pago para completar tu compra.</p>
                        <p className="mb-6">Si se abrió una nueva pestaña, por favor completa el pago allí. Una vez finalizado, esta página podría actualizarse o puedes navegar a la página de confirmación.</p>
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
                        <p className="text-sm text-gray-600 mt-4">Aguardando confirmación del pago...</p>
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
                            <h2 className="text-xl font-semibold mb-4">Datos de envío</h2>
                            <fieldset disabled={confirmed} className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                        if (isFormValid && items.length > 0) {
                                            setConfirmed(true);
                                            setError(null); // Limpiar errores al confirmar
                                        } else if (items.length === 0) {
                                            setError("Tu carrito está vacío. Agrega productos antes de continuar.");
                                        } else {
                                            setError("Por favor, completa todos los campos de envío requeridos.");
                                        }
                                    }}
                                    disabled={!isFormValid || items.length === 0}
                                >
                                    Confirmar datos y generar pago
                                </button>
                            )}
                            {confirmed && !preferenceId && !loading && ( // Botón para editar datos si ya confirmó pero aún no hay preferencia
                                <button
                                    className="mt-4 ml-2 px-4 py-2 rounded font-bold bg-gray-200 text-black hover:bg-gray-300 transition-colors"
                                    onClick={() => {
                                        setConfirmed(false);
                                        setPreferenceId(null); // Asegurarse de limpiar la preferencia si se editan datos
                                        setError(null);
                                    }}
                                >
                                    Editar Datos
                                </button>
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
                                            <span>{shippingCost === 0 && calculateTotal() >= 1800 ? 'Gratis (compra > $1800)' : shippingCost === 0 && (shippingData.tipoEntrega === 'retiro' || shippingData.tipoEntrega === 'agencia') ? 'Gratis' : shippingCost > 0 ? `$${shippingCost}` : 'A calcular'}</span>
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

                {loading && (
                    <div className="flex flex-col items-center justify-center bg-white text-black p-6 rounded-lg mt-8">
                        <SkeletonLoader lines={1} />
                        <p className="mt-4 text-lg">Generando tu orden de pago...</p>
                    </div>
                )}

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
                            onClick={() => {
                                setError(null);
                                // No resetear `confirmed` aquí automáticamente, 
                                // el usuario podría querer reintentar generar la preferencia o editar datos.
                                // Si el error es por preferencia, `confirmed` sigue true y se reintenta.
                                // Si es por validación, el botón de confirmar ya lo maneja.
                            }}
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
                            <button
                                onClick={() => {
                                    setConfirmed(false);
                                    setPreferenceId(null);
                                    setError(null);
                                }}
                                className="text-sm text-blue-600 hover:underline"
                            >
                                Editar datos de envío
                            </button>
                        </div>
                        <Payment
                            key={preferenceId}
                            initialization={{
                                amount: calculateTotal() + shippingCost,
                                preferenceId: preferenceId,
                            }}
                            customization={{
                                paymentMethods: {
                                    ticket: 'all',
                                    creditCard: 'all',
                                    debitCard: 'all',
                                    mercadoPago: 'all',
                                },
                                redirectMode: 'self', // Intentar siempre que sea en la misma pestaña
                            }}
                            onSubmit={handlePaymentSubmit}
                            onError={(mpError) => {
                                console.error('❌ Error en Payment Brick:', mpError);
                                setError('Error al iniciar el pago con Mercado Pago. Por favor, intenta de nuevo o edita tus datos.');
                                setPreferenceId(null); // Limpiar para re-generar si editan datos
                                setConfirmed(true); // Mantener confirmado para que se pueda reintentar generar preferencia
                                setPaymentProcessingInOtherTab(false);
                            }}
                            onReady={() => console.log("Brick de Mercado Pago listo.")}
                        />
                    </motion.div>
                )}
                {items.length === 0 && !error && !loading && (
                    <p className="text-center mt-8">
                        Tu carrito está vacío. Visita nuestra página de productos para agregar items.
                        <Link to="/producto" className="text-blue-500 hover:underline ml-2">
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