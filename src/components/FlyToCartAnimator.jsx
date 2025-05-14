// src/components/FlyToCartAnimator.jsx
import { gsap } from 'gsap';
import { MotionPathPlugin } from 'gsap/MotionPathPlugin';

gsap.registerPlugin(MotionPathPlugin);

const useFlyToCart = () => {
    const animate = (sourceImgEl, targetEl) => {
        if (!sourceImgEl || !targetEl) {
            console.warn("❌ No se encontró alguno de los elementos para animar");
            return;
        }

        const sourceRect = sourceImgEl.getBoundingClientRect();
        const targetRect = targetEl.getBoundingClientRect();

        // Crear un clon de la imagen que se moverá
        const clone = sourceImgEl.cloneNode(true);
        Object.assign(clone.style, {
            position: 'fixed',
            left: `${sourceRect.left}px`,
            top: `${sourceRect.top}px`,
            width: `${sourceRect.width}px`,
            height: `${sourceRect.height}px`,
            zIndex: 9999,
            borderRadius: '12px',
            pointerEvents: 'none',
            boxShadow: '0 8px 20px rgba(0,0,0,0.15)',
            transformOrigin: 'center center',
            transition: 'all 0.3s ease', // Suavizar la transición del movimiento
        });

        document.body.appendChild(clone);

        // Calcular la distancia a recorrer
        const dx = targetRect.left - sourceRect.left;
        const dy = targetRect.top - sourceRect.top;

        // Ajustar la curva para que suba más hacia arriba, responsivo al tamaño de la pantalla
        const controlX = sourceRect.left + dx / 2;
        const controlY = sourceRect.top - Math.max(250, Math.abs(dy / 2) * 0.8); // Ajustar según el tamaño de la pantalla

        // Definir la trayectoria
        const path = [
            { x: 0, y: 0 },
            { x: controlX - sourceRect.left, y: controlY - sourceRect.top },
            { x: dx, y: dy },
        ];

        // Animación fluida con timeline
        const tl = gsap.timeline({
            defaults: { ease: 'power3.inOut' },
            onComplete: () => {
                document.body.removeChild(clone);

                // Pulso del carrito
                gsap.fromTo(
                    targetEl,
                    { scale: 1 },
                    { scale: 1.3, duration: 0.2, ease: 'power1.out', yoyo: true, repeat: 1 }
                );

                // Mejorar el shadow sin bordes cuadrados
                gsap.fromTo(
                    targetEl,
                    {
                        boxShadow: '0 0 0px rgba(255,255,255,0)', // Sin sombra inicialmente
                        borderRadius: '100%', // Asegurarnos de que el carrito tenga bordes redondeados
                    },
                    {
                        boxShadow: '0 0 20px rgba(255,255,255,0.8)', // Sombra solo alrededor del carrito
                        duration: 0.4,
                        ease: 'power1.out',
                        yoyo: true,
                        repeat: 1,
                    }
                );
            },
        });

        // Animación del ítem que volará hacia el carrito
        tl.to(clone, {
            scale: 1.5,  // Ligero aumento de escala al inicio
            duration: 0.3,
        });

        tl.to(clone, {
            motionPath: {
                path,
                autoRotate: true,  // Hacer que la imagen rote durante la animación
            },
            scale: 0.3,  // Reducir el tamaño de la imagen
            opacity: 0.5,  // Hacerla semi-translúcida
            duration: 1.2, // Velocidad más lenta para mayor fluidez
        });
    };

    return { animate };
};

export default useFlyToCart;
