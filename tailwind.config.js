/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      boxShadow: {
        card: '0 2px 12px rgba(0,0,0,0.06)',
        'card-hover': '0 6px 24px rgba(0,0,0,0.10)',
        modal: '0 24px 60px rgba(0,0,0,0.15)',
      },
    },
  },
  plugins: [],
}
