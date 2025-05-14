// src/components/Hero.jsx
import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import logo from '../assets/logo.webp';

const Hero = () => {
    const logoRef = useRef(null);
    const badgeRef = useRef(null);

    useEffect(() => {
        gsap.fromTo(
            logoRef.current,
            { opacity: 0, y: 50 },
            {
                opacity: 1,
                y: 0,
                duration: 1.2,
                ease: 'power3.out',
            }
        );

        gsap.fromTo(
            badgeRef.current,
            { opacity: 0, y: 20 },
            {
                opacity: 1,
                y: 0,
                delay: 1,
                duration: 0.8,
                ease: 'power2.out',
            }
        );
    }, []);

    return (
        <section className="w-full flex justify-center px-4 pt-4 text-[#000]">
            <div className="w-full max-w-[1440px] h-[175px] md:h-[300px] lg:h-[358.55px] flex flex-col items-center justify-center relative">
                <img
                    ref={logoRef}
                    src={logo}
                    alt="Sheiki Logo"
                    className="w-[80%] max-w-[1336px] h-auto object-contain"
                />
                <div ref={badgeRef} className="absolute bottom-4">
                    <span className="bg-white text-[#D65FA5] text-[20px] md:text-[24px] font-bold px-3 py-1 rounded-sm">
                        NEW
                    </span>
                </div>
            </div>
        </section>
    );
};

export default Hero;
