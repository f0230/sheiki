import React, { useEffect, useState } from 'react';
import { useCart } from '../store/useCart';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Payment } from '@mercadopago/sdk-react';

const departamentosUY = [
    "Artigas", "Canelones", "Cerro Largo", "Colonia", "Durazno", "Flores",
    "Florida", "Lavalleja", "Maldonado", "Montevideo", "Paysandú", "Río Negro",
    "Rivera", "Rocha", "Salto", "San José", "Soriano", "Tacuarembó", "Treinta y Tres"
];

const calcularCostoEnvio = (departamento, total) => {
    if (total >= 1800) return 0;

    const zonas = {
        'Paysandú': 100,
        'Salto': 180, 'Río Negro': 180, 'Tacuarembó': 180, 'Artigas': 180,
        'Soriano': 200, 'Durazno': 200, 'Flores': 200, 'Florida': 200, 'Colonia': 200,
        'Montevideo': 260, 'Canelones': 260, 'Maldonado': 260, 'Lavalleja': 260,
        'Rocha': 260, 'San José': 260, 'Treinta y Tres': 260
    };

    return zonas[departamento] || 250;
};

const CheckoutPage = () => {
    const { items, clearCart } = useCart();
    const [preferenceId, setPreferenceId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [shippingCost, setShippingCost] = useState(0);

    const [formData, setFormData] = useState({
        nombre: '',
        telefono: '',
        direccion: '',
        departamento: '',
        metodoEntrega: 'domicilio'
    });

    const calculateSubtotal = () =>
        items.reduce((total, item) => total + item.precio * item.quantity, 0);

    const formValid = formData.nombre && formData.telefono && formData.direccion && formData.departamento;

    useEffect(() => {
        const subtotal = calculateSubtotal();
        const costo = calcularCostoEnvio(formData.departamento, subtotal);
        setShippingCost(costo);
    }, [formData.departamento, items]);

    useEffect(() => {
        const fetchPreference = async () => {
            try {
                const res = await fetch('/api/create-preference', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ items }),
                });

                const data = await res.json();
                if (!data.preference?.id) throw new Error("Sin ID de preferencia");
                setPreferenceId(data.preference.id);
            } catch (err) {
                console.error('❌ Error creando preferencia:', err);
                setError('No se pudo iniciar el pago.');
            } finally {
                setLoading(false);
            }
        };

        if (items.length > 0) fetchPreference();
        else setLoading(false);
    }, [items]);

    return (
        <div className="min-h-screen font-product bg-white text-black">
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
                        <div className="bg-white border p-6 rounded-lg shadow-sm">
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
                                <span>Subtotal:</span>
                                <span>${calculateSubtotal()}</span>
                            </div>
                            <div className="mt-1 flex justify-between">
                                <span>Envío:</span>
                                <span>{shippingCost === 0 ? 'Gratis' : `$${shippingCost}`}</span>
                            </div>
                            <div className="mt-2 flex justify-between font-bold text-lg">
                                <span>Total:</span>
                                <span>${calculateSubtotal() + shippingCost}</span>
                            </div>
                        </div>

                        <div className="bg-white border p-6 rounded-lg shadow-sm mt-8">
                            <h2 className="text-xl font-semibold mb-4">Datos de envío</h2>
                            <form className="space-y-4">
                                <input type="text" placeholder="Nombre completo" className="w-full border rounded px-3 py-2"
                                    value={formData.nombre} onChange={(e) => setFormData({ ...formData, nombre: e.target.value })} />
                                <input type="tel" placeholder="Teléfono" className="w-full border rounded px-3 py-2"
                                    value={formData.telefono} onChange={(e) => setFormData({ ...formData, telefono: e.target.value })} />
                                <input type="text" placeholder="Dirección" className="w-full border rounded px-3 py-2"
                                    value={formData.direccion} onChange={(e) => setFormData({ ...formData, direccion: e.target.value })} />
                                <select className="w-full border rounded px-3 py-2"
                                    value={formData.departamento} onChange={(e) => setFormData({ ...formData, departamento: e.target.value })}>
                                    <option value="">Seleccionar departamento</option>
                                    {departamentosUY.map(dep => (
                                        <option key={dep} value={dep}>{dep}</option>
                                    ))}
                                </select>
                                <select className="w-full border rounded px-3 py-2"
                                    value={formData.metodoEntrega} onChange={(e) => setFormData({ ...formData, metodoEntrega: e.target.value })}>
                                    <option value="domicilio">Entrega a domicilio</option>
                                    <option value="agencia">Retiro en agencia (DAC)</option>
                                    <option value="local">Retiro en local (Paysandú)</option>
                                </select>
                            </form>
                        </div>

                        {preferenceId && formValid && (
                            <div className="bg-white border p-6 rounded-lg shadow-sm mt-8">
                                <Payment
                                    initialization={{ preferenceId }}
                                    onSubmit={async () => {
                                        localStorage.setItem('datos_envio', JSON.stringify({
                                            ...formData,
                                            costo_envio: shippingCost
                                        }));
                                        clearCart();
                                        return true;
                                    }}
                                    onError={(error) => {
                                        console.error('❌ Error en Payment Brick:', error);
                                        setError('Hubo un error al procesar el pago.');
                                    }}
                                />
                            </div>
                        )}

                        {!formValid && (
                            <p className="text-sm mt-4 text-red-600">
                                Completá todos los datos de envío para habilitar el pago.
                            </p>
                        )}
                    </>
                )}
            </main>
            <Footer />
        </div>
    );
};

export default CheckoutPage;