
import React, { useState, useEffect } from 'react';

const isMobileDevice = () => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth <= 768;
};

const OptimizedImage = ({
    src,
    mobileSrc,
    alt = '',
    className = '',
    width,
    height,
    loading = 'lazy',
    sizes = '100vw',
    style = {},
}) => {
    const [isMobile, setIsMobile] = useState(isMobileDevice());
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        const handleResize = () => setIsMobile(isMobileDevice());
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const source = isMobile && mobileSrc ? mobileSrc : src;
    const webpSrc = source.replace(/\.(png|jpg|jpeg)$/i, '.webp');

    return (
        <picture>
            <source srcSet={webpSrc} type="image/webp" sizes={sizes} />
            <img
                src={source}
                alt={alt}
                width={width}
                height={height}
                loading={loading}
                className={`${className} transition-opacity duration-700 ease-in-out ${loaded ? 'opacity-100' : 'opacity-0'}`}
                onLoad={() => setLoaded(true)}
                style={style}
            />
        </picture>
    );
};

export default OptimizedImage;
