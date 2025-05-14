import React from 'react';
import { useNavigate } from 'react-router-dom';

const Toast = ({ message, visible }) => {
    const navigate = useNavigate();

    if (!visible) return null;

    const handleClick = () => {
        navigate('/carrito'); // Redirige al carrito cuando se hace clic
    };

    return (
        <div
            className="fixed bottom-6 right-6 bg-black text-white py-2 px-4 rounded-xl shadow-lg z-50 transition-all duration-300 animate-fade-in cursor-pointer"
            onClick={handleClick}
        >
            {message}
        </div>
    );
};

export default Toast;
