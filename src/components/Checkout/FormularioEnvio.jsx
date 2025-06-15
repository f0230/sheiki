import React from 'react';

const departamentosUY = [
    "Artigas", "Canelones", "Cerro Largo", "Colonia", "Durazno", "Flores",
    "Florida", "Lavalleja", "Maldonado", "Montevideo", "Paysandú", "Río Negro",
    "Rivera", "Rocha", "Salto", "San José", "Soriano", "Tacuarembó", "Treinta y Tres"
];

const FormularioEnvio = ({
    shippingData,
    setShippingData,
    confirmed,
    setConfirmed,
    paymentProcessing,
    isFormValid,
    items,
    setError,
    setPreferenceId,
    setCurrentExternalRef,
    setLoading
}) => {

    // Función para manejar el cambio en los inputs y selects
    const handleChange = (e) => {
        const { name, value } = e.target;

        // Si se cambia el tipo de entrega a algo que no es domicilio, se limpia la dirección
        if (name === 'tipoEntrega' && value !== 'domicilio') {
            setShippingData(prevData => ({
                ...prevData,
                direccion: '',
                [name]: value
            }));
        } else {
            setShippingData(prevData => ({
                ...prevData,
                [name]: value
            }));
        }
    };

    return (
        <div className="bg-white text-black p-6 rounded-lg mb-8">
            <h2 className="text-xl mb-4">Datos de envío</h2>
            <fieldset disabled={confirmed || paymentProcessing} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                    type="text"
                    name="nombre" // <<< Añadido para el handler genérico
                    placeholder="Nombre completo"
                    value={shippingData.nombre}
                    onChange={handleChange}
                    className="border p-2 rounded disabled:bg-gray-100"
                />
                <input
                    type="email"
                    name="email" // <<< Añadido
                    placeholder="Email"
                    value={shippingData.email}
                    onChange={handleChange}
                    className="border p-2 rounded disabled:bg-gray-100"
                />
                <input
                    type="tel"
                    name="telefono" // <<< Añadido
                    placeholder="Teléfono"
                    value={shippingData.telefono}
                    onChange={handleChange}
                    className="border p-2 rounded disabled:bg-gray-100"
                />
                <input
                    type="text"
                    name="ci"
                    placeholder="Cédula de identidad (solo para pagos en efectivo)"
                    value={shippingData.ci || ''}
                    onChange={handleChange}
                    className="border p-2 rounded disabled:bg-gray-100 mt-2"
                />


                <select
                    name="departamento" // <<< Añadido
                    value={shippingData.departamento}
                    onChange={handleChange}
                    className="border p-2 rounded disabled:bg-gray-100"
                >
                    <option value="">Seleccionar departamento</option>
                    {departamentosUY.map(dep => (
                        <option key={dep} value={dep}>{dep}</option>
                    ))}
                </select>
                <select
                    name="tipoEntrega" // <<< Añadido
                    value={shippingData.tipoEntrega}
                    onChange={handleChange}
                    className="border p-2 rounded col-span-1 disabled:bg-gray-100"
                >
                    <option value="">Tipo de entrega</option>
                    <option value="domicilio">A domicilio</option>
                    <option value="agencia">Agencia DAC</option>
                    <option value="retiro">Retiro en local (Paysandú)</option>
                </select>
                <input
                    type="text"
                    name="direccion" // <<< Añadido
                    placeholder="Dirección (si aplica)"
                    value={shippingData.direccion}
                    onChange={handleChange}
                    className="border p-2 rounded disabled:bg-gray-100"
                    disabled={shippingData.tipoEntrega !== 'domicilio'}
                />
            </fieldset>

            {!confirmed && (
                <button
                    className={`mt-6 px-4 py-2 rounded font-bold transition-colors ${isFormValid && items.length > 0 ? 'bg-black text-white hover:bg-gray-700' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
                    onClick={() => {
                        if (isFormValid && items.length > 0) {
                            setConfirmed(true);
                            setError(null);
                        } else if (items.length === 0) {
                            setError("Tu carrito está vacío. Agrega productos antes de continuar.");
                        } else {
                            setError("Por favor, completa todos los campos de envío requeridos.");
                        }
                    }}
                    disabled={!isFormValid || items.length === 0 || paymentProcessing}
                >
                    Confirmar datos y generar pago
                </button>
            )}

            {confirmed && !paymentProcessing && (
                <button
                    className="mt-4 ml-2 px-4 py-2 rounded font-bold bg-gray-200 text-black hover:bg-gray-300 transition-colors"
                    onClick={() => {
                        setConfirmed(false);
                        setPreferenceId(null);
                        setCurrentExternalRef(null);
                        setError(null);
                        setLoading(false);
                    }}
                    disabled={paymentProcessing}
                >
                    Editar Datos
                </button>
            )}
        </div>
    );
};

export default FormularioEnvio;