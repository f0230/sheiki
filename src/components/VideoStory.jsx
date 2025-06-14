// src/components/VideoStory.jsx
import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import videoSrc from '../assets/videomodelosheiki.mp4';

const VideoStory = ({ isOpen, onClose }) => {
    const videoRef = useRef(null);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        if (!isOpen) return;

        const interval = setInterval(() => {
            const video = videoRef.current;
            if (video?.duration) {
                const current = (video.currentTime / video.duration) * 100;
                setProgress(current);
                if (current >= 100) {
                    clearInterval(interval);
                    onClose(); // cerrar al terminar
                }
            }
        }, 100);

        return () => clearInterval(interval);
    }, [isOpen, onClose]);

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="fixed inset-0 z-50 bg-black flex items-center justify-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    {/* Barra de progreso */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-white bg-opacity-20 z-50">
                        <motion.div
                            className="h-full bg-white"
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ ease: 'linear', duration: 0.1 }}
                        />
                    </div>

                    {/* Botón cerrar */}
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 z-50 text-white text-3xl bg-black bg-opacity-50 rounded-full px-4 py-2 hover:bg-opacity-80"
                    >
                        ✕
                    </button>

                    {/* Video vertical estilo historia */}
                    <video
                        ref={videoRef}
                        src={videoSrc}
                        autoPlay
                        muted
                        playsInline
                        className="aspect-[9/16] h-full object-cover"
                    />
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default VideoStory;
