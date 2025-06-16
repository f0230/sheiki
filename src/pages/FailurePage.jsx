import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { XCircle, RefreshCw, ShoppingCart, Home } from 'lucide-react'; // Added ShoppingCart, Home
import { motion } from 'framer-motion';
import {
    BACKUP_CART_KEY,
    BACKUP_ENVIO_KEY,
    STATUS_DETAIL_KEY,
    PAYMENT_METHOD_ID_KEY_LS,
    ITEMS_COMPRADOS_KEY,
    DATOS_ENVIO_KEY,
    CHECKOUT_PAGE_PATH, // Assuming /pago
    HOME_PAGE_PATH,     // Assuming /
    ABITAB_PM,          // For checking method
    REDPAGOS_PM         // For checking method
} from '../lib/constants';

const getRejectionMessage = (statusDetail) => {
    switch (statusDetail) {
        case 'cc_rejected_bad_filled_card_number':
        case 'cc_rejected_bad_filled_security_code':
        case 'cc_rejected_bad_filled_date':
        case 'cc_rejected_bad_filled_other':
            return 'Los datos de tu tarjeta parecen incorrectos. Verificalos e intentá de nuevo.';
        case 'cc_rejected_call_for_authorize':
            return 'Debés autorizar esta transacción con tu banco. Llamalos y volvé a intentar.';
        case 'cc_rejected_card_disabled':
            return 'Tu tarjeta está inactiva. Activala o intentá con otra.';
        case 'cc_rejected_card_error':
            return 'No pudimos procesar tu tarjeta. Probá nuevamente o usá otro medio.';
        case 'cc_rejected_duplicated_payment':
            return 'Ya hiciste un pago por este mismo monto. Verificá si fue aprobado.';
        case 'cc_rejected_high_risk':
            return 'Tu pago fue rechazado por políticas antifraude. Usá otro método o contactá a tu banco.';
        case 'cc_rejected_insufficient_amount':
            return 'Fondos insuficientes. Probá con otra tarjeta o cargá saldo.';
        case 'cc_rejected_invalid_installments':
            return 'Tu tarjeta no permite esa cantidad de cuotas. Elegí otra opción.';
        case 'cc_rejected_max_attempts':
            return 'Alcanzaste el máximo de intentos permitidos. Intentá más tarde.';
        case 'cc_rejected_other_reason':
        default:
            return 'Tu pago fue rechazado. Intenta nuevamente o usá otro medio.';
    }
};

const FailurePage = () => {
    const [statusDetail, setStatusDetail] = useState(''); // Default to empty string
    const [message, setMessage] = useState('');
    const [metodoPago, setMetodoPago] = useState('');
    const [backupCart, setBackupCart] = useState([]);
    const [backupEnvio, setBackupEnvio] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        // localStorage.setItem(SHEIKI_PAYMENT_STATUS_KEY, 'failure'); // SHEIKI_PAYMENT_STATUS_KEY not imported, using string for now
        localStorage.setItem('sheikiPaymentStatus', 'failure');


        const detail = localStorage.getItem(STATUS_DETAIL_KEY);
        const metodo = localStorage.getItem(PAYMENT_METHOD_ID_KEY_LS);
        setStatusDetail(detail || '');
        setMetodoPago(metodo || '');
        setMessage(getRejectionMessage(detail));

        setBackupCart(JSON.parse(localStorage.getItem(BACKUP_CART_KEY)) || []);
        setBackupEnvio(JSON.parse(localStorage.getItem(BACKUP_ENVIO_KEY)) || null);

        // No brick unmount logic needed
    }, []);

    return (
        <div className="min-h-screen bg-red-50 flex flex-col items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="bg-white border border-red-300 shadow-xl rounded-xl max-w-xl w-full p-6 sm:p-8 text-center"
            >
                <div className="flex flex-col items-center mb-6">
                    <XCircle className="w-16 h-16 text-red-500 animate-pulse mb-3" />
                    <h2 className="text-2xl sm:text-3xl font-bold text-red-700">Hubo un problema con tu pago</h2>
                </div>

                {message && (
                    <p className="text-sm text-gray-700 mt-3">{message}</p>
                )}

                <div className="mt-4 text-sm text-gray-500">
                    Si creés que esto es un error, podés intentar nuevamente o escribirnos.
                </div>

                <a
                    href="https://wa.me/59891234567?text=Hola!%20Tuve%20un%20problema%20al%20pagar%20en%20Sheiki" // Consider making this configurable
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-green-600 hover:text-green-700 hover:underline mt-2 inline-block font-medium"
                >
                    📱 Contactar por WhatsApp
                </a>

                {backupCart.length > 0 && (
                    <div className="mt-6 bg-gray-50 rounded-xl shadow p-4 w-full text-left text-sm">
                        <h3 className="font-semibold mb-2 text-gray-700 flex items-center">
                            <ShoppingCart className="w-4 h-4 mr-2 text-gray-500" />
                            Tu pedido que intentaste pagar:
                        </h3>
                        <ul className="divide-y divide-gray-200 max-h-60 overflow-y-auto"> {/* Increased max-h like other pages */}
                            {backupCart.map((item, idx) => (
                               <li key={idx} className="py-3 flex items-center space-x-3">
                               {item.imagen && (
                                 <img
                                   src={item.imagen}
                                   alt={item.nombre}
                                   className="w-16 h-16 object-cover rounded-md shadow"
                                 />
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
                        {backupCart.length > 0 && (
                            <div className="border-t mt-4 pt-4 text-right font-bold text-lg text-red-700">
                                Total Intentado: ${backupCart.reduce((sum, item) => sum + (item.precio * item.quantity), 0).toFixed(2)}
                            </div>
                        )}
                    </div>
                )}

                {backupEnvio && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg text-xs text-left border border-gray-200">
                        <h4 className="font-semibold mb-1 text-gray-600">Datos de envío proporcionados:</h4>
                        <p><strong>Nombre:</strong> {backupEnvio.nombre} {backupEnvio.apellido}</p>
                        <p><strong>Dirección:</strong> {backupEnvio.direccion}, {backupEnvio.localidad}</p>
                        {/* Add more fields as needed, e.g., email, phone */}
                    </div>
                )}

                <div className="mt-8 space-y-3">
                    {metodoPago !== ABITAB_PM && metodoPago !== REDPAGOS_PM && ( // Check against imported constants
                        <button
                            onClick={() => {
                                const cartData = localStorage.getItem(BACKUP_CART_KEY);
                                const envioData = localStorage.getItem(BACKUP_ENVIO_KEY);
                                if (cartData) localStorage.setItem(ITEMS_COMPRADOS_KEY, cartData);
                                if (envioData) localStorage.setItem(DATOS_ENVIO_KEY, envioData);
                                navigate(CHECKOUT_PAGE_PATH);
                            }}
                            className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition duration-300 flex items-center justify-center gap-2"
                        >
                            <RefreshCw className="w-5 h-5" />
                            Volver a intentar el pago
                        </button>
                    )}
                    <button
                        onClick={() => navigate(HOME_PAGE_PATH)}
                        className="w-full bg-gray-500 hover:bg-gray-600 text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition duration-300 flex items-center justify-center gap-2"
                    >
                        <Home className="w-5 h-5" />
                        Volver a la tienda
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

export default FailurePage;