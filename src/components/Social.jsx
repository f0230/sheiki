// src/components/SocialStrip.jsx
import React from 'react';
import { FaFacebookF, FaInstagram, FaWhatsapp } from 'react-icons/fa';
import mplogo from '../assets/mplogo.svg'; // Asegurate de tener este archivo en /src/assets

const SocialStrip = () => {
    return (
        <section className="text-white py-6 px-4 flex flex-col items-center gap-6">
            {/* Redes sociales */}
            <div className="flex flex-col items-center gap-4 md:flex-row md:justify-center md:gap-10">
              

                <div className="flex gap-6 text-black dark:text-white text-2xl">
                    <a
                        href="https://www.facebook.com/tu_pagina"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-primary transition-colors"
                    >
                        <FaFacebookF />
                    </a>

                    <a
                        href="https://www.instagram.com/tu_pagina"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-primary transition-colors"
                    >
                        <FaInstagram />
                    </a>

                    <a
                        href="https://wa.me/59812345678"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-primary transition-colors"
                    >
                        <FaWhatsapp />
                    </a>
                </div>
            </div>

            {/* Métodos de pago */}
            <div className="flex flex-wrap justify-center items-center gap-2 pt-2">
                <img
                    src={mplogo}
                    alt="Mercado Pago"
                    className="h-8 md:h-16 w-auto object-contain"
                />
                {/* Agregá más logos aquí si querés, por ejemplo: */}
                <img
                    src={mplogo}
                    alt="Mercado Pago"
                    className="h-8 md:h-16 w-auto object-contain"
                />
                <img
                    src={mplogo}
                    alt="Mercado Pago"
                    className="h-8 md:h-16 w-auto object-contain"
                />
                <img
                    src={mplogo}
                    alt="Mercado Pago"
                    className="h-8 md:h-16 w-auto object-contain"
                />
                <img
                    src={mplogo}
                    alt="Mercado Pago"
                    className="h-8 md:h-16 w-auto object-contain"
                />
                <img
                    src={mplogo}
                    alt="Mercado Pago"
                    className="h-8 md:h-16 w-auto object-contain"
                />
                <img
                    src={mplogo}
                    alt="Mercado Pago"
                    className="h-8 md:h-16 w-auto object-contain"
                />
                {/* <img src={visa} alt="Visa" className="h-8 w-auto" /> */}
            </div>
        </section>
    );
};

export default SocialStrip;
