// src/components/ProductCard.jsx
import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { Link } from 'react-router-dom'; // Importa Link desde react-router-dom


const ProductCard = ({ title, imgSrc }) => {
    const cardRef = useRef(null);

    useEffect(() => {
        gsap.fromTo(
            cardRef.current,
            { opacity: 0, y: 80 },
            {
                opacity: 1,
                y: 0,
                duration: 1.2,
                ease: 'power3.out',
            }
        );
    }, []);

    return (
        <div
            ref={cardRef}
            className="relative w-full max-w-[695px] h-[600px] sm:h-[700px] md:h-[856px] overflow-hidden rounded-2xl shadow-lg"
        >
            <img
                src={imgSrc}
                alt="Pantufla"
                className="w-full h-full object-cover"
            />
            {title && (
                <h2 className="absolute top-6 left-6 text-white text-2xl md:text-3xl font-product drop-shadow-md">
                    {title}
                </h2>
            )}
            <Link to="/producto">
                <button
                    className="absolute bottom-6 left-6 w-[140px] md:w-[164px] h-[39px] bg-black text-white text-sm font-product font-bold rounded-full flex items-center justify-center"
                >
                    Comprar
                </button>
            </Link>
        </div>
    );
};

export default ProductCard;
