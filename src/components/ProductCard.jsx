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
            className="relative w-full max-w-[695px] h-[350px] sm:h-[500px] md:h-[856px] overflow-hidden shadow-lg"
        >
            <img
                src={imgSrc}
                alt="Pantufla"
                className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
            />
            <div className="absolute inset-x-0 bottom-6 flex flex-col items-center gap-2">
                {title && (
                    <h2 className="text-white text-2xl md:text-3xl font-product drop-shadow-md text-center">
                        {title}
                    </h2>
                )}
                <Link to="/producto">
                    <button
                        className="w-[140px] md:w-[164px] h-[39px] bg-black text-white text-sm font-product font-bold rounded-full flex items-center justify-center"
                    >
                        Comprar
                    </button>
                </Link>
            </div>
        </div>
    );
};

export default ProductCard;
