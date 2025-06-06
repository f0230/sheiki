// src/components/Hero.jsx
import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import logo from '../assets/logo.webp';
import videoSrc from '../assets/videomodelosheiki.mp4'; // Asegurate de colocarlo en src/assets

const Hero = () => {
    const logoRef = useRef(null);

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
    }, []);

    return (
        <section className="mt-[55px] md:mt-[65px] w-full flex flex-col items-center px-4">
            <div className="w-full max-w-[1440px] flex flex-col items-center justify-center">
                {/* Logo animado */}
                <img
                    ref={logoRef}
                    src={logo}
                    alt="Sheiki Logo"
                    className="w-full max-w-[1440px] h-auto object-contain"
                />

                {/* Video debajo del logo */}
               
            </div>
            <video
                src={videoSrc}
                autoPlay
                muted
                loop
                playsInline
                className="w-full rounded-xl shadow-lg scale-95 "


            />
        </section>
    );
};

export default Hero;
