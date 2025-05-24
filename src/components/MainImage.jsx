// src/components/MainImage.jsx
import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import img3 from '../assets/img3.webp';

gsap.registerPlugin(ScrollTrigger);

const MainImage = () => {
    const containerRef = useRef(null);
    const innerRef = useRef(null);

    useEffect(() => {
        // Animación de entrada scroll
        gsap.fromTo(
            containerRef.current,
            { opacity: 0, y: 100 },
            {
                opacity: 1,
                y: 0,
                duration: 1.2,
                ease: 'power3.out',
                scrollTrigger: {
                    trigger: containerRef.current,
                    start: 'top 80%',
                    toggleActions: 'play none none reverse',
                },
            }
        );

        // Animación hover zoom suave
        const el = innerRef.current;
        const zoomIn = () => gsap.to(el, { scale: 1.03, duration: 0.6, ease: 'power2.out' });
        const zoomOut = () => gsap.to(el, { scale: 1, duration: 0.6, ease: 'power2.out' });

        el.addEventListener('mouseenter', zoomIn);
        el.addEventListener('mouseleave', zoomOut);

        // Cleanup
        return () => {
            el.removeEventListener('mouseenter', zoomIn);
            el.removeEventListener('mouseleave', zoomOut);
        };
    }, []);

    return (
        <section className="flex justify-center px-4">
            <div
                ref={containerRef}
                className="pt-4 w-full max-w-[1415px] h-[280px] sm:h-[360px] md:h-[420px] lg:h-[508px]  md:pt-8  overflow-hidden"
            >
                <div
                    ref={innerRef}
                    className="w-full h-full bg-cover bg-center transition-transform duration-500"
                    style={{ backgroundImage: `url(${img3})` }}
                >
                    <div className="absolute flex justify-center items-center dark:bg-darkbg bg-lightbg  w-[85px] h-[35px] md:w-[192px] md:h-[73px]">
                        <p className="text-[30px] md:text-[70px]">NEW</p>
                    </div>

                </div>
            </div>
            <div>
                
            </div>
        </section>
        
    );
};

export default MainImage;
