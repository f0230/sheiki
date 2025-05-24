// src/components/FreeShippingMarquee.jsx
import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

const phrases = [
    'Envío gratis en compras mayores a $1500',
    '3 cuotas sin recargo con Visa o Mastercard',
    'Cambios sin costo dentro de los 10 días',
    'Pantuflas hechas con amor 💖',
    '¡Nuevo stock disponible esta semana!'
];

const FreeShippingMarquee = () => {
    const marqueeRef = useRef(null);

    useEffect(() => {
        const tween = gsap.to(marqueeRef.current, {
            xPercent: -50,
            repeat: -1,
            duration: 25,
            ease: 'linear',
        });

        return () => tween.kill();
    }, []);

    const repeatedPhrases = [...phrases, ...phrases]; // duplicado para bucle perfecto

    return (
        <div className="mt-[55px] w-full overflow-hidden bg-black dark:bg-darkbg py-2 text-sm  relative">
            <div className="flex gap-12 whitespace-nowrap w-max" ref={marqueeRef}>
                {repeatedPhrases.map((text, i) => (
                    <span
                        key={i}
                        className="uppercase tracking-wide  text-white dark:text-black"
                    >
                        {text}
                    </span>
                ))}
            </div>
        </div>
    );
};

export default FreeShippingMarquee;
