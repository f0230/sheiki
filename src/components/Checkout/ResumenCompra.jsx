import React from 'react';

const ResumenCompra = ({ items, calculateTotal, shippingCost, shippingData }) => {
    const envioLabel = () => {
        if (shippingCost === 0 && calculateTotal() >= 1800) return 'Gratis';
        if (shippingCost === 0 && shippingData.tipoEntrega === 'retiro') return 'Gratis (Retiro)';
        if (shippingCost === 0 && shippingData.tipoEntrega === 'agencia') return 'Gratis (Agencia)';
        if (shippingCost > 0) return `$${shippingCost}`;
        return 'A calcular';
    };

    return (
        <div className="bg-white text-black p-6 rounded-lg mt-8">
            <h2 className="text-2xl font-semibold mb-4">Resumen de compra</h2>
            {items.length > 0 ? (
                <>
                    <ul className="space-y-4">
                        {items.map((item, i) => (
                            <li key={`${item.id}-${item.color}-${item.talle}-${i}`} className="flex justify-between">
                                <span>{item.nombre} (x{item.quantity}) - {item.color} / T{item.talle}</span>
                                <span>${item.precio * item.quantity}</span>
                            </li>
                        ))}
                    </ul>
                    <div className="mt-4 pt-4 border-t">
                        <div className="flex justify-between">
                            <span className="font-semibold">Subtotal:</span>
                            <span>${calculateTotal()}</span>
                        </div>
                        <div className="mt-2 flex justify-between">
                            <span className="font-semibold">Envío:</span>
                            <span>{envioLabel()}</span>
                        </div>
                        <div className="mt-2 flex justify-between text-lg font-bold">
                            <span>Total final:</span>
                            <span>${calculateTotal() + shippingCost}</span>
                        </div>
                    </div>
                </>
            ) : (
                <p>No hay productos en tu carrito.</p>
            )}
        </div>
    );
};

export default ResumenCompra;
