import React, { useEffect, useState } from 'react';
import { useCart } from '../store/useCart';
import { CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
    BACKUP_CART_KEY,
    BACKUP_ENVIO_KEY,
    EXTERNAL_REFERENCE_KEY,
    MONTO_TOTAL_KEY,
    USER_EMAIL_KEY,
    PAYMENT_ID_KEY,
    SHEIKI_PAYMENT_STATUS_KEY, // For setting 'success'
    ORDER_ID_KEY,             // Added
    TICKET_URL_KEY,           // Added for cleanup
    STATUS_DETAIL_KEY,        // Added for cleanup
    PAYMENT_METHOD_ID_KEY_LS  // Added for cleanup
} from '../lib/constants';

const SuccessPage = () => {
    const { clearCart } = useCart();
    const [backupCart, setBackupCart] = useState([]);
    const [montoTotal, setMontoTotal] = useState(0);
    const [backupEnvio, setBackupEnvio] = useState(null);
    const [externalRef, setExternalRef] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        localStorage.setItem(SHEIKI_PAYMENT_STATUS_KEY, 'success'); // Using constant

        // 🧠 Recuperar datos para visualización
        const cartData = JSON.parse(localStorage.getItem(BACKUP_CART_KEY)) || [];
        const shippingData = JSON.parse(localStorage.getItem(BACKUP_ENVIO_KEY)) || null;
        const totalAmount = parseFloat(localStorage.getItem(MONTO_TOTAL_KEY)) || 0;
        // Try ORDER_ID_KEY first (from finalizeCheckout), fallback to EXTERNAL_REFERENCE_KEY (from Brick payment), then default
        const orderId = localStorage.getItem(ORDER_ID_KEY) || localStorage.getItem(EXTERNAL_REFERENCE_KEY) || 'ORD-DEFAULT';
        const userEmailRetrieved = localStorage.getItem(USER_EMAIL_KEY) || null;

        setBackupCart(cartData);
        setMontoTotal(totalAmount);
        setBackupEnvio(shippingData);
        setExternalRef(orderId); // Use the potentially richer orderId

        // 🎯 Enviar evento Meta
        if (totalAmount > 0 && orderId !== 'ORD-DEFAULT') {
            fetch('/api/sendEventToMeta', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    event_name: 'Purchase',
                    url: window.location.href,
                    user_agent: navigator.userAgent,
                    email: userEmailRetrieved,
                    custom_data: {
                        currency: 'UYU',
                        value: totalAmount,
                        order_id: orderId, // Use the potentially richer orderId
                    },
                }),
            }).catch((err) => console.error('[SuccessPage] ❌ Error Meta Event:', err));
        }

        // 🧹 Limpieza
        clearCart(); // Clears current cart from Zustand store
        
        setTimeout(() => {
            localStorage.removeItem(BACKUP_CART_KEY);
            localStorage.removeItem(BACKUP_ENVIO_KEY);
            localStorage.removeItem(MONTO_TOTAL_KEY); 
            localStorage.removeItem(USER_EMAIL_KEY);  
            localStorage.removeItem(PAYMENT_ID_KEY); 
            localStorage.removeItem(TICKET_URL_KEY); 
            localStorage.removeItem(STATUS_DETAIL_KEY); 
            localStorage.removeItem(PAYMENT_METHOD_ID_KEY_LS); 
            // EXTERNAL_REFERENCE_KEY is cleaned by useFinalizarCheckout if ORDER_ID_KEY was used,
            // or it's the same as ORDER_ID_KEY if that was the source.
            // ORDER_ID_KEY itself is also cleared by useFinalizarCheckout.
            // DATOS_ENVIO_KEY and ITEMS_COMPRADOS_KEY (original ones) are cleaned by useFinalizarCheckout.
        }, 3000);

    }, [clearCart]); // Dependencies: clearCart. Others are loaded on mount.

    return (
        <div className="min-h-screen bg-green-50 flex flex-col items-center justify-center p-4 text-center">
            <div className="mb-6 flex flex-col items-center">
                <CheckCircle className="w-16 h-16 text-green-600 animate-bounce mb-3" /> {/* Slightly larger icon */}
                <h2 className="text-2xl sm:text-3xl font-bold text-green-800">¡Gracias por tu compra!</h2> {/* Larger text */}
                <p className="text-md sm:text-lg text-gray-700 mt-2"> {/* Slightly larger text */}
                    En breve recibirás un correo con el detalle de tu pedido.
                </p>
                {externalRef && externalRef !== 'ORD-DEFAULT' && (
                    <p className="text-sm text-gray-600 mt-2">
                        Número de Orden: <span className="font-semibold text-green-700">{externalRef}</span>
                    </p>
                )}
            </div>

            <div className="w-full max-w-2xl bg-white rounded-xl shadow-xl p-6 space-y-6"> {/* Wider card, more padding, shadow-xl */}
                {backupCart.length > 0 && (
                    <div>
                        <h3 className="font-semibold text-lg mb-3 text-gray-800 border-b pb-2">Resumen de tu compra:</h3>
                        <ul className="divide-y divide-gray-200">
                            {backupCart.map((item, idx) => (
                                <li key={idx} className="py-3 flex items-center space-x-3">
                                    {item.imagen && (
                                        <img src={item.imagen} alt={item.nombre} className="w-16 h-16 object-cover rounded-md shadow" />
                                    )}
                                    <div className="flex-grow">
                                        <span className="font-medium text-gray-900">{item.nombre}</span>
                                        <span className="block text-xs text-gray-500">
                                            Color: {item.color} | Talle: {item.talle}
                                        </span>
                                    </div>
                                    <div className="text-right">
                                        <span className="block font-medium text-gray-900">${item.precio}</span>
                                        <span className="text-xs text-gray-500">x{item.quantity}</span>
                                    </div>
                                </li>
                            ))}
                        </ul>
                        <div className="border-t mt-4 pt-4 text-right font-bold text-xl text-green-700"> {/* Larger total */}
                            Total: ${montoTotal.toFixed(2)}
                        </div>
                    </div>
                )}

                {backupEnvio && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg text-sm border border-gray-200">
                        <h4 className="font-semibold text-md mb-2 text-gray-700 border-b pb-1">Detalles del Envío:</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
                            <p><strong>Nombre:</strong> {backupEnvio.nombre} {backupEnvio.apellido}</p>
                            <p><strong>Email:</strong> {backupEnvio.email}</p>
                            <p><strong>Teléfono:</strong> {backupEnvio.telefono}</p>
                            <p><strong>Dirección:</strong> {backupEnvio.direccion}</p>
                            <p><strong>Localidad:</strong> {backupEnvio.localidad}</p>
                            <p><strong>Departamento:</strong> {backupEnvio.departamento}</p>
                            {backupEnvio.shippingCost > 0 && <p><strong>Costo de Envío:</strong> ${backupEnvio.shippingCost.toFixed(2)}</p>}
                            <p><strong>Tipo de Entrega:</strong> {backupEnvio.tipo_entrega === 'retiro_pickup' ? 'Retiro en Pickup' : 'Envío a Domicilio'}</p>
                            {backupEnvio.ci && <p><strong>CI:</strong> {backupEnvio.ci}</p>}
                        </div>
                    </div>
                )}


                <button
                    onClick={() => navigate('/')}
                    className="mt-6 bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-full shadow transition"
                >
                    Volver a la tienda
                </button>
            </div>
        </div> 
    );
};


export default SuccessPage;
