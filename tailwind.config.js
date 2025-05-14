/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,jsx,ts,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: "#E06EAC",
            },
            fontFamily: {
                'product': ['ProductSans', 'sans-serif'],

            },
        },
    },
    plugins: [],
}
