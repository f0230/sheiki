// src/pages/SuccessPage.jsx
import React, { useEffect } from 'react';
import { useCart } from '../store/useCart';
import { useAuth } from '../context/AuthContext';

const SuccessPage = () => {
    const { items, clearCart } = useCart();
    const { user } = useAuth();

    useEffect(() => {
        const datosEnvio = JSON.parse(localStorage.getItem('datos_envio') || '{}');

        const enviarDatos = async () => {
            try {
                const res = await fetch('/api/update-stock', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        items,
                        estado_pago: 'aprobado',
                        id_usuario: user?.id ?? null,
                        email_usuario: user?.email ?? null,
                        datos_envio: datosEnvio,
                    }),
                });

                const data = await res.json();
                if (!res.ok) {
                    throw new Error(data.error || 'Error al registrar orden');
                }

                console.log('✅ Orden registrada correctamente');
                clearCart();
                localStorage.removeItem('datos_envio'); // Limpiar después de guardar
            } catch (err) {
                console.error('❌ Error al enviar orden:', err);
            }
        };

        if (items.length > 0) {
            enviarDatos();
        }
    }, [items, clearCart, user]);

    return (
        <div className="min-h-screen bg-green-100 flex flex-col items-center justify-center text-center px-4">
            <h1 className="text-4xl font-bold text-green-700 mb-4">¡Pago exitoso!</h1>
            <p className="text-xl max-w-xl">Tu compra ha sido procesada correctamente. Gracias por tu compra.</p>
        </div>
    );
};

export default SuccessPage;
