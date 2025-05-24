import React, { forwardRef, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
import { useCart } from '../store/useCart';
import logo from '../assets/logo.webp';
import ThemeToggle from '@/components/ThemeToggle';

const Header = forwardRef((props, ref) => {
    const navigate = useNavigate();
    const { items } = useCart();
    const totalCantidad = items.reduce((sum, i) => sum + i.quantity, 0);
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        const onScroll = () => {
            setIsScrolled(window.scrollY > 10);
        };

        window.addEventListener('scroll', onScroll);
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    return (
        <header
            className={`fixed z-50 top-0 left-0 w-full transition-all duration-300 dark:bg-darkbg/80 light:bg-white/80 backdrop-blur-sm  ${isScrolled ? 'py-1' : 'py-4'
                }`}
        >
            <div className="flex justify-between items-center px-6 max-w-[1440px] mx-auto transition-all duration-300">
                {/* Logo al centro */}
                <Link to="/" className="flex-1 flex justify-center">
                    <img
                        src={logo}
                        alt="Logo Sheiki"
                        className={`transition-all duration-300 ${isScrolled ? 'h-3' : 'h-5'
                            }`}
                    />
                </Link>

                {/* Theme Toggle a la izquierda */}
                <div
                    className={`absolute left-6 top-1/2 -translate-y-1/2 transition-transform duration-300 ${isScrolled ? 'scale-50' : 'scale-100'
                        }`}
                >
                    <ThemeToggle />
                </div>

                {/* Carrito a la derecha */}
                <div
                    className={`absolute right-6 top-1/2 -translate-y-1/2 transition-transform duration-300 ${isScrolled ? 'scale-50' : 'scale-100'
                        }`}
                >
                    <div
                        ref={ref}
                        onClick={() => navigate('/carrito')}
                        className="relative group cursor-pointer"
                    >
                        <ShoppingCart
                            size={isScrolled ? 20 : 24}
                            strokeWidth={2.2}
                            color="black"
                            className="transition-all duration-300"
                        />

                        {totalCantidad > 0 && (
                            <span className="absolute -top-2 -right-2 bg-black text-white text-xs rounded-full px-2 py-0.5 shadow-sm font-bold">
                                {totalCantidad}
                            </span>
                        )}

                        <span className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-full h-1 bg-white opacity-0 group-hover:opacity-30 transition" />
                    </div>
                </div>
            </div>
        </header>
    );
});

export default Header;
