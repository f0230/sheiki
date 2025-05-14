import React, { forwardRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
import { useCart } from '../store/useCart';
import logo from '../assets/logo.webp'; // Importa la imagen

const Header = forwardRef((props, ref) => {
    const navigate = useNavigate();
    const { items } = useCart();
    const totalCantidad = items.reduce((sum, i) => sum + i.quantity, 0);

    return (
        <header className="flex justify-between items-center px-6 py-4 max-w-[1440px] mx-auto">
            <Link to="/">
                <img src={logo} alt="Logo Sheiki" className="h-5" /> {/* Usa la imagen importada */}
            </Link>

            <div
                ref={ref}
                onClick={() => navigate('/carrito')}
                className="relative group cursor-pointer"
            >
                <ShoppingCart size={24} strokeWidth={2.2} />

                {totalCantidad > 0 && (
                    <span className="absolute -top-2 -right-2 bg-black text-white text-xs rounded-full px-2 py-0.5 shadow-sm font-bold">
                        {totalCantidad}
                    </span>
                )}

                <span className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-full h-1 bg-white opacity-0 group-hover:opacity-30 transition"></span>
            </div> 
        </header>
    );
});

export default Header;
