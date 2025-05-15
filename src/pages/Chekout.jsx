import React, { useEffect, useState } from 'react';
import { useCart } from '../store/useCart';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Payment } from '@mercadopago/sdk-react';

const CheckoutPage = () => {
    const { items, clearCart } = useCart();
    const [preferenceId, setPreferenceId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const calculateTotal = () => {
        return items.reduce((total, item) => total + item.precio * item.quantity, 0);
    };

    useEffect(() => {
        const fetchPreference = async () => {
            try {
                const res = await fetch('/api/create-preference', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ items }),
                });

                if (!res.ok) throw new Error('Error al crear la preferencia');

                const data = await res.json();
                setPreferenceId(data.preference.id);
                setLoading(false);
            } catch (err) {
                console.error('Error creando preferencia:', err);
                setError('No se pudo iniciar el pago. Intenta más tarde.');
                setLoading(false);
            }
        };

        if (items.length > 0) {
            fetchPreference();
        } else {
            setLoading(false);
        }
    }, [items]);

    return (
        <div className="bg-[#D65FA5] text-white font-product min-h-screen">
            <Header />

            <main className="max-w-[1440px] mx-auto px-4 py-12">
                <h1 className="text-3xl font-bold mb-6">Checkout</h1>

                {loading ? (
                    <p>Cargando...</p>
                ) : error ? (
                    <p className="text-red-500 bg-white p-4 rounded-lg">{error}</p>
                ) : items.length === 0 ? (
                    <p>No hay productos en tu carrito.</p>
                ) : (
                    <>
                        <div className="bg-white text-black p-6 rounded-lg">
                            <h2 className="text-2xl font-semibold mb-4">Resumen de compra</h2>
                            <ul className="space-y-4">
                                {items.map((item, i) => (
                                    <li key={i} className="flex justify-between">
                                        <span>{item.nombre} x {item.quantity}</span>
                                        <span>${item.precio * item.quantity}</span>
                                    </li>
                                ))}
                            </ul>
                            <div className="mt-4 flex justify-between">
                                <span className="font-semibold">Total:</span>
                                <span>${calculateTotal()}</span>
                            </div>
                        </div>

                        {preferenceId && (
                            <div className="bg-white text-black p-6 rounded-lg mt-8">
                                <Payment
                                    initialization={{
                                        amount: calculateTotal(),
                                        preferenceId,
                                    }}
                                    onSubmit={async (param) => {
                                        console.log('Formulario enviado:', param);
                                        clearCart(); // Limpia el carrito al finalizar el pago
                                    }}
                                    onError={(error) => {
                                        console.error('Error en Payment Brick:', error);
                                        setError('Hubo un error al procesar el pago.');
                                    }}
                                />
                            </div>
                        )}
                    </>
                )}
            </main>

            <Footer />
        </div>
    );
};

export default CheckoutPage;
