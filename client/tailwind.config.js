/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'class',
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                'coop-blue': '#003366', // Deep reputable blue
                'coop-green': '#28a745', // Growth/Stability green
                'coop-light-green': '#e9f7ef', // Background tint
                'coop-bg': '#f4f6f8', // App background
            }
        },
    },
    plugins: [],
}
