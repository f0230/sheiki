// src/pages/PendingPage.jsx
import React from 'react';

const PendingPage = () => {
    return (
        <div className="min-h-screen bg-yellow-100 flex items-center justify-center">
            <h1 className="text-4xl font-bold text-yellow-700">Pago pendiente</h1>
            <p className="text-xl">Tu pago está siendo procesado. Te notificaremos pronto sobre el estado de tu pago.</p>
        </div>
    );
};

export default PendingPage;
