import React from 'react';
import { useTheme } from '@/hooks/useTheme';
import { Moon, Sun } from 'lucide-react';
import { motion } from 'framer-motion';

const ThemeToggle = () => {
    const { theme, toggleTheme } = useTheme();
    const isDark = theme === 'dark';

    return (
        <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="w-10 h-5 flex items-center rounded-full px-0.5 bg-black/75 dark:bg-black/50 transition-colors duration-300"
        >
            <motion.div
                layout
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                className={`w-4 h-4 flex items-center justify-center rounded-full shadow-md ${isDark ? 'ml-5 bg-black/80' : 'ml-0 bg-white'
                    }`}
            >
                {isDark ? (
                    <Sun className="w-[10px] h-[10px] text-yellow-400" />
                ) : (
                    <Moon className="w-[10px] h-[10px] text-gray-600" />
                )}
            </motion.div>
        </button>
    );
};

export default ThemeToggle;
