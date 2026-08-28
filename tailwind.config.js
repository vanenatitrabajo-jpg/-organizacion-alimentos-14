/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Outfit"', 'sans-serif'],
        sans: ['"Outfit"', 'sans-serif'],
      },
      colors: {
        base: {
          50: '#FAFAF8',
          100: '#F3F2EE',
          200: '#E7E5DE',
          300: '#D3D0C5',
        },
        ink: {
          900: '#231F1A',
          700: '#4A4438',
          500: '#7A7367',
        },
        cocina: {
          50: '#FDF3EC',
          100: '#F8E0CC',
          400: '#E08A3C',
          600: '#B8641E',
        },
        office: {
          50: '#EEF4F3',
          100: '#D3E4E1',
          400: '#4C8C82',
          600: '#316A61',
        },
        menu: {
          50: '#F3EFF6',
          100: '#DFD4E8',
          400: '#8563A6',
          600: '#664988',
        },
        manana: '#F5C97B',
        tarde: '#E88F6B',
        noche: '#5B6B94',
      },
      boxShadow: {
        soft: '0 2px 10px rgba(35, 31, 26, 0.06)',
        card: '0 4px 20px rgba(35, 31, 26, 0.08)',
      },
      borderRadius: {
        xl2: '1.25rem',
      },
    },
  },
  plugins: [],
}
