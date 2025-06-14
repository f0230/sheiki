// src/components/Footer.jsx
import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import resorte from '../assets/v.webp';
import logodte from '../assets/logodte.svg';
import SocialStrip from '../components/Social';



gsap.registerPlugin(ScrollTrigger);

const Footer = () => {
    const resorteRef = useRef(null);
    const footerRef = useRef(null);

    useEffect(() => {
        const resorteEl = resorteRef.current;

        // Animación inicial con efecto elástico
        const introTl = gsap.timeline({
            scrollTrigger: {
                trigger: footerRef.current,
                start: 'top 80%',
                onEnter: () => {
                    // Rebote continuo al ingresar
                    gsap.to(resorteEl, {
                        y: -15,
                        duration: 1.2,
                        ease: 'power1.inOut',
                        repeat: -1,
                        yoyo: true,
                        yoyoEase: 'sine.inOut',
                        overwrite: 'auto',
                    });
                },
            },
        });

        introTl.fromTo(
            resorteEl,
            {
                y: 80,
                opacity: 0,
                scaleY: 0.8,
                rotate: -5,
            },
            {
                y: 0,
                opacity: 1,
                scaleY: 1,
                rotate: 0,
                duration: 1.6,
                ease: 'elastic.out(1, 0.4)',
                overwrite: 'auto',
            }
        );

        // Movimiento orgánico con lerp
        let animationFrame;
        let target = { dx: 0, dy: 0 };
        const lerp = (start, end, amt) => (1 - amt) * start + amt * end;

        const handleMouseMove = (e) => {
            const rect = resorteEl.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            target.dx = (e.clientX - centerX) / rect.width;
            target.dy = (e.clientY - centerY) / rect.height;
        };

        const animateMouseEffect = () => {
            const scaleY = 1 + target.dy * 0.25;
            const scaleX = 1 - Math.abs(target.dx) * 0.15;
            const rotate = target.dx * 10;

            gsap.to(resorteEl, {
                scaleX: lerp(resorteEl.scaleX || 1, scaleX, 0.15),
                scaleY: lerp(resorteEl.scaleY || 1, scaleY, 0.15),
                rotate: lerp(resorteEl.rotate || 0, rotate, 0.15),
                boxShadow: '0px 20px 40px rgba(0,0,0,0.2)',
                transformOrigin: 'center bottom',
                duration: 0.2,
                ease: 'power2.out',
                overwrite: 'auto',
            });

            animationFrame = requestAnimationFrame(animateMouseEffect);
        };

        const resetAnimation = () => {
            gsap.to(resorteEl, {
                scaleX: 1,
                scaleY: 1,
                rotate: 0,
                boxShadow: '0px 0px 0px rgba(0,0,0,0)',
                duration: 0.6,
                ease: 'elastic.out(1, 0.5)',
                clearProps: 'all',
            });
            cancelAnimationFrame(animationFrame);
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseenter', animateMouseEffect);
        window.addEventListener('mouseleave', resetAnimation);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseenter', animateMouseEffect);
            window.removeEventListener('mouseleave', resetAnimation);
            cancelAnimationFrame(animationFrame);
        };
    }, []);


    return (
        <div ref={footerRef} className="overflow-hidden w-full  text-black flex justify-center">
            <footer className="w-full max-w-[1080px] px-6 pt-12 pb-36 md:pb-48 relative flex flex-col justify-start items-center">
                {/* Texto central superior */}

                <SocialStrip />


                {/* 3 columnas */}
                <div className="flex w-full justify-between items-start text-sm md:text-base z-10 gap-6">
                    {/* Izquierda */}
                    <div className="flex flex-col gap-2 font-product text-left">
                        <span>Sobre nosotros</span>
                        <span>Terminos y condiciones</span>
                        <span>Politicas de privacidad</span>
                       
                        <div className="mt-4">
                            <span>WSP</span>
                            <br />
                            <span>092 174 188</span>
                        </div>
                    </div>

                    {/* Derecha */}
                    <div className="flex flex-col gap-2 font-product text-right items-end">
                        <span>Envios y Devolución</span>
                        <span>Paysandú<br />Uruguay</span>
                        <span>Desarrollo</span>
                        <div className="mt-2 flex items-center justify-end">
                            <img src={logodte} className="w-[120px] md:w-[150px]" alt="logo" />
                        </div>
                    </div>
                </div>

                {/* Imagen del resorte al fondo */}
                <div className="absolute bottom-4 mb-[-50px] md:mb-[-75px] md:bottom-0 left-1/2 transform -translate-x-1/2 z-0 ">
                    <img
                        ref={resorteRef}
                        src={resorte}
                        alt="Resorte decorativo"
                        className="w-[180px] md:w-[420px] h-auto object-contain"
                    />
                </div>
            </footer>
        </div>
    );

};

export default Footer;
