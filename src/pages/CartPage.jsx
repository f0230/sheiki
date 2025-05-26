import React from 'react';
import { useCart } from '../store/useCart';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Link } from 'react-router-dom';  // Importar Link para redirección
import { FaArrowLeft } from 'react-icons/fa';  // Para la flecha (requiere instalar react-icons)

const CartPage = () => {
    const { items, removeFromCart, clearCart } = useCart();

    // Calcular el total del carrito
    const calculateTotal = () => {
        return items.reduce((total, item) => total + item.precio * item.quantity, 0);
    };

    return (
        <div className="max-w-[1080px] min-h-screen justify-center items-center mx-auto">
            <Header />
            <main className=" mx-auto px-4 py-[65px]">
                {/* Botón para ir atrás */}
                <Link to="/producto" className="flex items-center text-white mb-6">
                    <FaArrowLeft className="text-black dark:text-white mr-2" />
                    <span className='text-black dark:text-white text-[10px]'>Volver al producto</span>
                </Link>

                <h1 className="text-3xl font-bold mb-6">Tu carrito</h1>
                {items.length === 0 ? (
                    <p>No hay productos en tu carrito.</p>
                ) : (
                    <>
                        <ul className="space-y-4">
                            {items.map((item, i) => (
                                <li key={i} className="dark:bg-white bg-black text-white dark:text-black p-4 rounded-xl flex items-center justify-between">
                                    <div>
                                        <p className="font-semibold">{item.nombre}</p>
                                        <p className="text-sm">Color: {item.color} / Talle: {item.talle}</p>
                                        <p className="text-sm">Cantidad: {item.quantity}</p>
                                        <p className="text-sm">Precio unitario: ${item.precio}</p>
                                    </div>
                                    <button onClick={() => removeFromCart(i)} className="text-white dark:text-black hover:underline text-sm">Quitar</button>
                                </li>
                            ))}
                        </ul>

                        {/* Total del carrito */}
                        <div className="bg-white text-black p-4 mt-6 rounded-xl">
                            <h2 className="font-semibold">Total: ${calculateTotal()}</h2>
                        </div>

                        <div className='flex md:gap-4 gap-2 mt-6'>
                            <button onClick={clearCart} className="bg-black text-white py-2 px-4 rounded-full hover:bg-gray-800">
                                Vaciar carrito
                            </button>
                            <Link to="/pago">
                                <button className="bg-black text-white py-2 px-4 rounded-full hover:bg-gray-800">
                                    Finalizar compra
                                </button>
                            </Link>
                        </div>
                    </>
                )}
            </main>
            <Footer />
        </div>
    );
};

export default CartPage;
