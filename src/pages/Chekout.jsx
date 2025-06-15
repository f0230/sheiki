import React, { useState, useEffect, useCallback } from 'react';
import { useCart } from '../store/useCart';
import Header from '../components/Header';
import Footer from '../components/Footer';
import SkeletonLoader from '../components/SkeletonLoader';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import Toast from '../components/Toast';

// Nuevos componentes modulares
import FormularioEnvio from '../components/Checkout/FormularioEnvio';
import ResumenCompra from '../components/Checkout/ResumenCompra';
import PagoMercadoPago from '../components/Checkout/PagoMercadoPago';

// Nuevos hooks modulares
import useGenerarPreferencia from '../hooks/useGenerarPreferencia';
import useFinalizarCheckout from '../hooks/useFinalizarCheckout';
import useRealtimePago from '../hooks/useRealtimePago';

const LOCAL_STORAGE_KEY = 'shippingData';

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { items, clearCart } = useCart();
  const [metodoPago, setMetodoPago] = useState('mercadopago');
  const [toastVisible, setToastVisible] = useState(false);

  // --- LÓGICA DEL LOCALSTORAGE ---
  const [shippingData, setShippingData] = useState(() => {
    const savedData = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (savedData) {
      return JSON.parse(savedData);
    } else {
      return {
        nombre: '', email: '', telefono: '',
        departamento: '', tipoEntrega: '', direccion: ''
      };
    }
  });

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(shippingData));
  }, [shippingData]);

  // --- ESTADOS Y LÓGICA DEL COMPONENTE ---
  const calculateTotal = useCallback(() => {
    return items.reduce((total, item) => total + item.precio * item.quantity, 0);
  }, [items]);

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

  // Calcular costo de envío
  useEffect(() => {
    const totalActual = calculateTotal();
    const costo = calcularCostoEnvio({
      tipoEntrega: shippingData.tipoEntrega,
      departamento: shippingData.departamento,
      total: totalActual,
    });
    setShippingCost(costo);
  }, [shippingData.tipoEntrega, shippingData.departamento, items, calculateTotal]);

  // Hook personalizado para generar preferencia
  useGenerarPreferencia({
    confirmed,
    items,
    shippingData,
    shippingCost,
    setPreferenceId,
    setCurrentExternalRef,
    setError,
    setLoading,
    setConfirmed,
    preferenceId
  });

  // Hook para finalizar el checkout
  const finalizeCheckout = useFinalizarCheckout({
    isCheckoutFinalized,
    setIsCheckoutFinalized,
    setPaymentProcessing,
    setPreferenceId,
    setConfirmed,
    clearCart,
    navigate,
    calculateTotal,
    shippingCost,
    currentExternalRef,
    shippingData
  });

  // Hook para realtime de pagos
  useRealtimePago({
    paymentProcessing,
    currentExternalRef,
    isCheckoutFinalized,
    finalizeCheckout,
    setError
  });

  // Submit al iniciar pago
  const handlePaymentSubmit = useCallback(async () => {
    if (isCheckoutFinalized || items.length === 0 || !shippingData?.email) return false;
    localStorage.setItem('datos_envio', JSON.stringify({ ...shippingData, shippingCost: Number(shippingCost) }));
    localStorage.setItem('items_comprados', JSON.stringify(items));
    setPaymentProcessing(true);
    return true;
  }, [shippingData, shippingCost, items, isCheckoutFinalized]);

  // --- RENDERIZADO CONDICIONAL ---

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
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto" />
            {currentExternalRef && <p className="text-xs text-gray-400 mt-2">Ref: {currentExternalRef}</p>}
          </motion.div>
        </main>
        <Footer />
        <Toast message="✅ Pedido registrado por transferencia" visible={toastVisible} />
      </div>
    );
  }

  // --- RENDERIZADO PRINCIPAL ---

  return (
    <div className="min-h-screen max-w-[1080px] mx-auto">
      <Header />
      <main className="mx-auto px-4 py-12 mt-10 md:mt-12">
        <motion.h1
          className="text-3xl font-bold mb-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          Checkout
        </motion.h1>

        {!loading && (
          <>
            {!preferenceId && (
              <>
                <FormularioEnvio
                  shippingData={shippingData}
                  setShippingData={setShippingData}
                  confirmed={confirmed}
                  setConfirmed={setConfirmed}
                  paymentProcessing={paymentProcessing}
                  isFormValid={isFormValid}
                  items={items}
                  setError={setError}
                  setPreferenceId={setPreferenceId}
                  setCurrentExternalRef={setCurrentExternalRef}
                  setLoading={setLoading}
                />
                <ResumenCompra
                  items={items}
                  calculateTotal={calculateTotal}
                  shippingCost={shippingCost}
                  shippingData={shippingData}
                />
              </>
            )}

            {confirmed && (
              <div className="bg-white text-black p-6 rounded-lg mt-8">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold">Método de pago</h2>
                  <button
                    onClick={() => {
                      setConfirmed(false);
                      setPreferenceId(null);
                      setCurrentExternalRef(null);
                      setError(null);
                      setLoading(false);
                    }}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    Editar datos de envío
                  </button>
                </div>
                <label className="block">
                  <input
                    type="radio"
                    name="metodoPago"
                    value="mercadopago"
                    checked={metodoPago === 'mercadopago'}
                    onChange={() => setMetodoPago('mercadopago')}
                    className="mr-2"
                  />
                  Mercado Pago (tarjetas, Efectivo)
                </label>
                <label className="block mt-2">
                  <input
                    type="radio"
                    name="metodoPago"
                    value="transferencia"
                    checked={metodoPago === 'transferencia'}
                    onChange={() => setMetodoPago('transferencia')}
                    className="mr-2"
                  />
                  Transferencia bancaria
                </label>
              </div>
            )}

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
              onClick={() => setError(null)}
              className="absolute top-0 bottom-0 right-0 px-4 py-3"
            >
              <span className="text-2xl">×</span>
            </button>
          </motion.div>
        )}

        {confirmed && metodoPago === 'mercadopago' && preferenceId && !loading && !error && (
          <PagoMercadoPago
            preferenceId={preferenceId}
            amount={calculateTotal() + shippingCost}
            onSubmit={handlePaymentSubmit}
            setError={setError}
            setPreferenceId={setPreferenceId}
            setCurrentExternalRef={setCurrentExternalRef}
            setPaymentProcessing={setPaymentProcessing}
          />
        )}

        {confirmed && metodoPago === 'transferencia' && (
          <div className="bg-white text-black p-6 rounded-lg mt-8">
            <h2 className="text-xl font-semibold mb-2">Transferencia bancaria</h2>
            <p className="mb-4">Realizá la transferencia a la siguiente cuenta:</p>
            <ul className="mb-4 text-sm">
              <li><strong>Banco:</strong> BROU</li>
              <li><strong>Cuenta:</strong> 001234567-00001</li>
              <li><strong>Titular:</strong> Sheiki</li>
              <li><strong>CI:</strong> 1.234.567-8</li>
            </ul>
            <p className="text-sm mb-4">
              Una vez realizado el pago, presioná el botón para confirmar tu pedido.
            </p>
            <button
              className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800"
              onClick={async () => {
                try {
                  setToastVisible(true);
                  await finalizeCheckout('pending_transferencia', 'manual_transfer');
                } catch (error) {
                  console.error("❌ Error al confirmar transferencia:", error);
                } finally {
                  setTimeout(() => setToastVisible(false), 5000);
                }
              }}
            >
              Confirmar pedido por transferencia
            </button>
          </div>
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

// --- FUNCIÓN AUXILIAR ---
function calcularCostoEnvio({ tipoEntrega, departamento, total }) {
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
}