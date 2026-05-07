/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#EEEDFE',
          100: '#CECBF6',
          200: '#AFA9EC',
          300: '#9089E4',
          400: '#7F77DD',
          500: '#6660CC',
          600: '#534AB7',
          700: '#443B99',
          800: '#3C3489',
          900: '#26215C',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        xl:    '12px',
        '2xl': '16px',
        '3xl': '24px',
      },
      boxShadow: {
        card:         '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)',
        'card-hover': '0 4px 12px rgba(0,0,0,0.12)',
        brand:        '0 4px 14px rgba(83,74,183,0.35)',
      },
      backgroundImage: {
        'brand-gradient':       'linear-gradient(135deg, #534AB7 0%, #7F77DD 50%, #3C3489 100%)',
        'brand-gradient-light': 'linear-gradient(135deg, #6660CC 0%, #9089E4 100%)',
        'dark-gradient':        'linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)',
      },
      animation: {
        'fade-in':       'fadeIn 0.3s ease-in-out',
        'slide-up':      'slideUp 0.3s ease-out',
        'slide-in-right':'slideInRight 0.3s ease-out',
        'pulse-dot':     'pulseDot 1.4s infinite ease-in-out',
        shimmer:         'shimmer 1.5s infinite linear',
      },
      keyframes: {
        fadeIn:       { '0%': { opacity: '0' },                              '100%': { opacity: '1' } },
        slideUp:      { '0%': { transform: 'translateY(16px)', opacity: '0' },'100%': { transform: 'translateY(0)', opacity: '1' } },
        slideInRight: { '0%': { transform: 'translateX(16px)', opacity: '0' },'100%': { transform: 'translateX(0)', opacity: '1' } },
        pulseDot:     { '0%, 80%, 100%': { transform: 'scale(0)', opacity: '0.4' }, '40%': { transform: 'scale(1)', opacity: '1' } },
        shimmer:      { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
      },
    },
  },
  plugins: [],
};
