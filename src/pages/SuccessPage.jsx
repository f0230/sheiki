// src/pages/SuccessPage.jsx
import React, { useEffect } from 'react';
import { useCart } from '../store/useCart';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const SuccessPage = () => {
    const { clearCart } = useCart();
    const { user } = useAuth();

    useEffect(() => {
        // Comunicar a la pestaña original que el pago fue exitoso
        localStorage.setItem('sheikiPaymentStatus', 'success');

        const datosEnvio = JSON.parse(localStorage.getItem('datos_envio') || '{}');
        const itemsComprados = JSON.parse(localStorage.getItem('items_comprados') || '[]');

        const enviarDatosYLimpiar = async () => {
            if (itemsComprados.length === 0) {
                // Esto podría pasar si el usuario refresca SuccessPage después de que ya se procesó.
                // O si llega aquí sin items.
                console.warn("SuccessPage: No hay items en localStorage para procesar.");
                clearCart(); // Asegurarse de que el carrito local esté limpio
                return;
            }

            try {
                const res = await fetch('/api/update-stock', { // Asegúrate que este endpoint exista y funcione.
                    // Este endpoint debería ser el webhook.js o uno similar.
                    // El webhook es más robusto para esto.
                    // La llamada desde el frontend es un fallback o complemento.
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        items: itemsComprados, // Cambiado a itemsComprados
                        estado_pago: 'aprobado',
                        id_usuario: user?.id ?? null,
                        email_usuario: user?.email ?? null,
                        datos_envio: {
                            nombre: datosEnvio.nombre,
                            telefono: datosEnvio.telefono,
                            direccion: datosEnvio.direccion,
                            departamento: datosEnvio.departamento,
                            tipoEntrega: datosEnvio.tipoEntrega,
                            shippingCost: datosEnvio.shippingCost ?? 0,
                        },
                    }),
                });

                const data = await res.json();
                if (!res.ok) {
                    throw new Error(data.error || 'Error al registrar orden');
                }

                console.log('✅ Orden registrada/actualizada (desde SuccessPage)');
            } catch (err) {
                console.error('❌ Error al enviar orden (desde SuccessPage):', err);
                // No borres los datos si falla el envío, para posible reintento o manejo manual
                return; // Salir para no limpiar si hubo error
            } finally {
                // Limpiar carrito y localStorage solo si la llamada fue exitosa o si no hay items (ya procesado)
                clearCart();
                localStorage.removeItem('datos_envio');
                localStorage.removeItem('items_comprados');
            }
        };

        enviarDatosYLimpiar();
    }, [clearCart, user]);

    return (
        <div className="min-h-screen bg-green-100 flex flex-col items-center justify-center text-center px-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, type: 'spring' }}
                className="bg-white p-8 md:p-12 rounded-xl shadow-2xl"
            >
                <svg className="text-green-500 w-24 h-24 mx-auto mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                <h1 className="text-3xl md:text-4xl font-bold text-green-700 mb-4">¡Pago exitoso!</h1>
                <p className="text-lg md:text-xl text-gray-700 max-w-xl mb-8">
                    Tu compra ha sido procesada correctamente. Recibirás un correo electrónico con los detalles de tu pedido en breve.
                </p>
                <Link
                    to="/"
                    className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-8 rounded-lg transition duration-300 ease-in-out text-lg"
                >
                    Volver a la tienda
                </Link>
            </motion.div>
        </div>
    );
};

export default SuccessPage;