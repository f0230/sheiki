// tailwind.config.js
export default {
    darkMode: 'class',
    content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
    theme: {
        extend: {
            colors: {
                lightbg: '#FFFCEA',
                darkbg: '#D65FA5',
            },
            fontFamily: {
                blauer: ['Blauer', 'sans-serif'], // suponiendo que usás esta fuente
            },
        },
    },
    plugins: [],
};
  