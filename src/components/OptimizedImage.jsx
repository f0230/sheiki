// src/components/OptimizedImage.jsx
import React, { useState, useEffect, forwardRef } from 'react'; // Importa forwardRef

const isMobileDevice = () => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth <= 768;
};

// Envuelve tu componente con forwardRef
const OptimizedImage = forwardRef(({ // Agrega 'ref' como segundo argumento
    src,
    mobileSrc,
    alt = '',
    className = '',
    width,
    height,
    loading = 'lazy',
    sizes = '100vw',
    style = {},
    // Puedes añadir onClick si necesitas que la imagen sea clickeable directamente
    // y que esa sea la referencia para la animación, aunque el div wrapper es común
    onClick
}, ref) => { // Aquí está la ref reenviada
    const [isMobile, setIsMobile] = useState(isMobileDevice());
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        const handleResize = () => setIsMobile(isMobileDevice());
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const source = isMobile && mobileSrc ? mobileSrc : src;
    // Asegúrate de que `source` no sea undefined o null antes de llamar a replace
    const webpSrc = source ? source.replace(/\.(png|jpg|jpeg)$/i, '.webp') : '';

    // Pasa la ref al elemento <picture> o al <img> si es más apropiado
    // Si el elemento <picture> es el que tiene las dimensiones correctas y posición, usa ese.
    return (
        <picture ref={ref} onClick={onClick} className={className} style={style}> {/* Pasa la ref aquí */}
            {webpSrc && <source srcSet={webpSrc} type="image/webp" sizes={sizes} />}
            {source && (
                <img
                    src={source}
                    alt={alt}
                    width={width} // Asegúrate que estos props se estén pasando correctamente
                    height={height} // o que el CSS maneje las dimensiones
                    loading={loading}
                    className={`transition-opacity duration-700 ease-in-out ${loaded ? 'opacity-100' : 'opacity-0'} w-full h-full object-cover`} // Asegúrate que estas clases no interfieran con el ref
                    onLoad={() => setLoaded(true)}
                // No pases la ref aquí si ya la pasaste a <picture>
                />
            )}
        </picture>
    );
});

OptimizedImage.displayName = 'OptimizedImage'; // Buenas práctica para DevTools

export default OptimizedImage;