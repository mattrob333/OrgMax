/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          bg: '#050505',
          surface: 'rgba(255,255,255,0.06)',
          accent: '#C4F82A',
          accentSoft: '#DCFBAA',
        },
      },
      borderRadius: {
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      boxShadow: {
        'brand-soft':
          '0 18px 45px rgba(0,0,0,0.7), 0 0 22px rgba(196,248,42,0.18)',
      },
    },
  },
  plugins: [],
}
