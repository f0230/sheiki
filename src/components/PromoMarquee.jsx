// src/components/PromoMarquee.jsx
import React from 'react';

const PromoMarquee = () => {
    return (
        <div
            className="mt-2 w-full overflow-hidden bg-red-100 h-[75px] md:h-[60px] flex items-center"
            aria-label="🔥 STOCK LIMITADO 🧦"
        >
            <div
                className="flex items-center whitespace-nowrap will-change-transform animate-marquee px-4"
                style={{
                    animation: 'marquee-horizontal 20s linear infinite',
                }}
            >
                <span className="text-[44px] md:text-[54px] l font-bold  text-red-700 ">
                    🔥 STOCK LIMITADO: SOLO 210 UNIDADES DISPONIBLES 🔥 STOCK LIMITADO: SOLO 210 UNIDADES DISPONIBLES 🔥
                </span>
            </div>
        </div>
    );
};

export default PromoMarquee;
