// src/pages/Chekout.jsx
import React, { useState, useEffect } from 'react';
import { useCart } from '../store/useCart';
import Header from '../components/Header';
import Footer from '../components/Footer';

const CheckoutPage = () => {
    const { items, clearCart } = useCart();
    const [preferenceId, setPreferenceId] = useState(null);

    const calculateTotal = () =>
        items.reduce((total, item) => total + item.precio * item.quantity, 0);

    useEffect(() => {
        const fetchPreference = async () => {
            const response = await fetch('/api/create-preference', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ items }),
            });

            const data = await response.json();
            setPreferenceId(data.preference.id);
        };

        if (items.length > 0) fetchPreference();
    }, [items]);

    useEffect(() => {
        if (!preferenceId) return;

        const bricksBuilder = window.mercadopago.bricks();

        bricksBuilder.create('payment', 'paymentBrick_container', {
            initialization: {
                amount: calculateTotal(),
                preferenceId,
            },
            customization: {
                paymentMethods: {
                    ticket: "all",
                    creditCard: "all",
                    prepaidCard: "all",
                    debitCard: "all",
                    mercadoPago: "all",
                },
            },
            onSubmit: async ({ formData }) => {
                return new Promise((resolve, reject) => {
                    fetch('/api/process_payment', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(formData),
                    })
                        .then(res => res.json())
                        .then(res => {
                            clearCart();
                            resolve();
                        })
                        .catch(reject);
                });
            },
            onReady: () => console.log("Brick listo"),
            onError: (error) => console.error("Error:", error),
        });

        return () => {
            if (window.paymentBrickController) {
                window.paymentBrickController.unmount();
            }
        };
    }, [preferenceId]);

    return (
        <div className="bg-[#D65FA5] text-white font-product min-h-screen">
            <Header />
            <main className="max-w-[1440px] mx-auto px-4 py-12">
                <h1 className="text-3xl font-bold mb-6">Checkout</h1>
                {items.length === 0 ? (
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

                        <div id="paymentBrick_container" className="bg-white text-black p-6 rounded-lg mt-8" />
                    </>
                )}
            </main>
            <Footer />
        </div>
    );
};

export default CheckoutPage;
