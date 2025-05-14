import React, { useState } from 'react';
import { useCart } from '../store/useCart';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Link } from 'react-router-dom';

const CheckoutPage = () => {
    const { items } = useCart();
    const [userInfo, setUserInfo] = useState({
        nombre: '',
        correo: '',
        direccion: ''
    });
    const [paymentMethod, setPaymentMethod] = useState('credit_card');
    const [isProcessing, setIsProcessing] = useState(false);

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

        // Simular el proceso de pago
        setTimeout(() => {
            alert('¡Compra exitosa!');
            setIsProcessing(false);
        }, 2000);
    };

    const calculateTotal = () => {
        return items.reduce((total, item) => total + item.precio * item.quantity, 0);
    };

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

                            {/* Formulario de Datos del Usuario */}
                            <div className="bg-white text-black p-6 rounded-lg">
                                <h2 className="text-2xl font-semibold mb-4">Datos de envío</h2>
                                <form onSubmit={handleSubmit}>
                                    <input
                                        type="text"
                                        name="nombre"
                                        placeholder="Nombre completo"
                                        value={userInfo.nombre}
                                        onChange={handleInputChange}
                                        className="w-full p-3 mb-4 border rounded"
                                    />
                                    <input
                                        type="email"
                                        name="correo"
                                        placeholder="Correo electrónico"
                                        value={userInfo.correo}
                                        onChange={handleInputChange}
                                        className="w-full p-3 mb-4 border rounded"
                                    />
                                    <input
                                        type="text"
                                        name="direccion"
                                        placeholder="Dirección de envío"
                                        value={userInfo.direccion}
                                        onChange={handleInputChange}
                                        className="w-full p-3 mb-4 border rounded"
                                    />
                                </form>
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

                            {/* Botón de Confirmación */}
                            <div className="flex justify-between items-center mt-6">
                                <button
                                    type="submit"
                                    onClick={handleSubmit}
                                    disabled={isProcessing}
                                    className="bg-black text-white py-3 px-6 rounded-full text-lg hover:bg-gray-900 transition"
                                >
                                    {isProcessing ? 'Procesando...' : 'Confirmar Compra'}
                                </button>
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
