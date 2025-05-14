// src/pages/FailurePage.jsx
import React from 'react';

const FailurePage = () => {
    return (
        <div className="min-h-screen bg-red-100 flex items-center justify-center">
            <h1 className="text-4xl font-bold text-red-700">¡Pago fallido!</h1>
            <p className="text-xl">Hubo un error al procesar tu pago. Por favor, intenta nuevamente.</p>
        </div>
    );
};

export default FailurePage;
