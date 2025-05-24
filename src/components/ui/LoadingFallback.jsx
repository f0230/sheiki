// src/components/ui/LoadingFallback.jsx
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react'; // Usa cualquier ícono de Lucide
import clsx from 'clsx';

const LoadingFallback = ({ type = "spinner", className = "" }) => {
    if (type === "skeleton") {
        return <div className="w-full h-[60vh] bg-gray-100 animate-pulse rounded-lg" />;
    }

    return (
        <div className={clsx("flex flex-col items-center justify-center h-[60vh] gap-4 text-center", className)}>
            <motion.div
                initial={{ rotate: 0 }}
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
                className="p-3 rounded-full bg-primary/10"
            >
                <Sparkles className="w-10 h-10 text-primary" />
            </motion.div>

            <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ repeat: Infinity, repeatType: 'mirror', duration: 1.5 }}
                className="text-sm text-gray-500"
            >
                Cargando Sheiki...
            </motion.p>
        </div>
    );
};

export default LoadingFallback;
