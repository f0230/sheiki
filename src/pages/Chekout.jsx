import React, { useState, useEffect } from 'react';
import { useCart } from '../store/useCart';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { CheckoutButton } from '@mercadopago/sdk-react';  // Importamos el botón de pago
import { Link } from 'react-router-dom';

const CheckoutPage = () => {
    const { items, clearCart } = useCart();
    const [userInfo, setUserInfo] = useState({
        nombre: '',
        correo: '',
        direccion: ''
    });
    const [paymentMethod, setPaymentMethod] = useState('credit_card');
    const [isProcessing, setIsProcessing] = useState(false);
    const [preference, setPreference] = useState(null); // Almacenamos la preferencia de pago

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setUserInfo((prev) => ({ ...prev, [name]: value }));
    };

    const handlePaymentChange = (e) => {
        setPaymentMethod(e.target.value);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setIsProcessing(true);
        setTimeout(() => {
            alert('¡Compra exitosa!');
            setIsProcessing(false);
            clearCart(); // Vaciar el carrito después de la compra
        }, 2000);
    };

    // Calcular el total del carrito
    const calculateTotal = () => {
        return items.reduce((total, item) => total + item.precio * item.quantity, 0);
    };

    // Crear la preferencia de pago en el backend
    useEffect(() => {
        const fetchPreference = async () => {
            const response = await fetch('/api/create-preference', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ items: items }), // Pasa los productos del carrito
            });

            const data = await response.json();
            setPreference(data.preference); // Guardamos la preferencia de pago
        };

        if (items.length > 0) {
            fetchPreference();
        }
    }, [items]);

    return (
        <div className="bg-[#D65FA5] text-white font-product min-h-screen">
            <Header />
            <main className="max-w-[1440px] mx-auto px-4 py-12">
                <h1 className="text-3xl font-bold mb-6">Checkout</h1>
                {items.length === 0 ? (
                    <p>No hay productos en tu carrito.</p>
                ) : (
                    <>
                        <div className="space-y-6">
                            {/* Resumen del carrito */}
                            <div className="bg-white text-black p-6 rounded-lg">
                                <h2 className="text-2xl font-semibold mb-4">Resumen de tu compra</h2>
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

                            {/* Método de Pago */}
                            <div className="bg-white text-black p-6 rounded-lg">
                                <h2 className="text-2xl font-semibold mb-4">Método de pago</h2>
                                <div>
                                    <label className="block mb-2">Selecciona un método de pago</label>
                                    <select
                                        value={paymentMethod}
                                        onChange={handlePaymentChange}
                                        className="w-full p-3 border rounded"
                                    >
                                        <option value="credit_card">Tarjeta de Crédito</option>
                                        <option value="paypal">PayPal</option>
                                    </select>
                                </div>
                            </div>

                            {/* Mercado Pago Button (Checkout) */}
                            <div className="bg-white text-black p-6 rounded-lg mt-8">
                                {preference && (
                                    <CheckoutButton
                                        preference={preference} // Pasamos la preferencia obtenida
                                        label="Pagar con Mercado Pago"
                                        onPaymentSuccess={() => {
                                            clearCart(); // Vacía el carrito después de un pago exitoso
                                        }}
                                    />
                                )}
                            </div>
                        </div>
                    </>
                )}
            </main>
            <Footer />
        </div>
    );
};

export default CheckoutPage;
