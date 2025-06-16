import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, FileText, ShoppingBag } from 'lucide-react'; // Icons
import {
    BACKUP_CART_KEY,
    BACKUP_ENVIO_KEY,
    EXTERNAL_REFERENCE_KEY,
    TICKET_URL_KEY
} from '../lib/constants';
import { useCart } from '../store/useCart';

const PendingPage = () => {
    const navigate = useNavigate();
    const { clearCart } = useCart(); // Optional: if you still want to clear the active cart

    const [ticketUrl, setTicketUrl] = useState('');
    const [backupCart, setBackupCart] = useState([]);
    const [backupEnvio, setBackupEnvio] = useState(null);
    const [externalRef, setExternalRef] = useState('');

    useEffect(() => {
        setTicketUrl(localStorage.getItem(TICKET_URL_KEY) || '');
        setBackupCart(JSON.parse(localStorage.getItem(BACKUP_CART_KEY)) || []);
        setBackupEnvio(JSON.parse(localStorage.getItem(BACKUP_ENVIO_KEY)) || null);
        setExternalRef(localStorage.getItem(EXTERNAL_REFERENCE_KEY) || '');

        // clearCart(); // Optional: Clears the main cart, not the backup for this page.
        // Decided to keep the active cart for now, user might go back.
        // No localStorage cleanup for BACKUP keys or TICKET_URL_KEY here.
    }, []);

    return (
        <div className="min-h-screen bg-amber-50 flex flex-col items-center justify-center p-4 text-center">
            <div className="w-full max-w-2xl bg-white rounded-xl shadow-xl p-6 sm:p-8 space-y-6">
                <div className="flex flex-col items-center">
                    <Clock className="w-16 h-16 text-amber-500 mb-4" />
                    <h2 className="text-2xl sm:text-3xl font-bold text-amber-800">Estamos esperando tu pago</h2>
                    <p className="text-md text-gray-600 mt-2">
                        Una vez que completes el pago, tu orden será procesada.
                    </p>
                </div>

                {ticketUrl && (
                    <div className="mt-6 text-center">
                        <a
                            href={ticketUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg text-lg shadow-md hover:shadow-lg transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                        >
                            <FileText className="w-5 h-5 mr-2" />
                            Ver Instrucciones / Pagar
                        </a>
                        <p className="text-xs text-gray-500 mt-2">
                            (Se abrirá en una nueva pestaña)
                        </p>
                    </div>
                )}

                {externalRef && (
                    <p className="text-sm text-gray-500 mt-6 border-t pt-4">
                        Número de Orden: <span className="font-semibold text-amber-700">{externalRef}</span>
                    </p>
                )}

                {backupCart.length > 0 && (
                    <div className="mt-6 pt-4 border-t">
                        <h3 className="font-semibold text-lg mb-3 text-gray-800 flex items-center justify-center">
                            <ShoppingBag className="w-5 h-5 mr-2 text-amber-600" />
                            Resumen de tu pedido:
                        </h3>
                        <ul className="divide-y divide-gray-200 max-h-60 overflow-y-auto">
                            {backupCart.map((item, idx) => (
                                <li key={idx} className="py-3 flex items-center space-x-3 text-left">
                                    {item.imagen && (
                                        <img src={item.imagen} alt={item.nombre} className="w-14 h-14 object-cover rounded-md shadow" />
                                    )}
                                    <div className="flex-grow">
                                        <span className="font-medium text-sm text-gray-900">{item.nombre}</span>
                                        <span className="block text-xs text-gray-500">
                                            Color: {item.color} | Talle: {item.talle}
                                        </span>
                                    </div>
                                    <div className="text-right">
                                        <span className="block font-medium text-sm text-gray-900">${item.precio}</span>
                                        <span className="text-xs text-gray-500">x{item.quantity}</span>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {backupEnvio && (
                    <div className="mt-6 pt-4 border-t">
                        <h4 className="font-semibold text-md mb-2 text-gray-700 text-center">Detalles del Envío:</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs text-left bg-amber-50 p-3 rounded-md">
                            <p><strong>Nombre:</strong> {backupEnvio.nombre} {backupEnvio.apellido}</p>
                            <p><strong>Email:</strong> {backupEnvio.email}</p>
                            <p><strong>Teléfono:</strong> {backupEnvio.telefono}</p>
                            <p><strong>Dirección:</strong> {backupEnvio.direccion}</p>
                            <p><strong>Localidad:</strong> {backupEnvio.localidad}</p>
                            <p><strong>Departamento:</strong> {backupEnvio.departamento}</p>
                            {backupEnvio.shippingCost > 0 && <p><strong>Costo de Envío:</strong> ${backupEnvio.shippingCost.toFixed(2)}</p>}
                            <p><strong>Tipo de Entrega:</strong> {backupEnvio.tipo_entrega === 'retiro_pickup' ? 'Retiro en Local' : 'Envío a Domicilio'}</p>
                            {backupEnvio.ci && <p><strong>CI:</strong> {backupEnvio.ci}</p>}
                        </div>
                    </div>
                )}

                <div className="mt-8">
                    <button
                        onClick={() => navigate('/')}
                        className="w-full bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white px-6 py-3 rounded-lg shadow hover:shadow-md transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-opacity-50"
                    >
                        Volver a la tienda
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PendingPage;
