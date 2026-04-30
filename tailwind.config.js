/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        'serif': ['Playfair Display', 'serif'],
        'sans': ['Inter', 'sans-serif'],
      },
      colors: {
        primary: {
          50: '#FFE0FF',
          100: '#FFA8D9',
          200: '#FF69B4',
          300: '#C33B80',
          400: '#C33B80',
          500: '#89004F',
          600: '#89004F',
          700: '#89004F',
          800: '#89004F',
          900: '#89004F',
          // Colores legacy del proyecto
          legacy: {
            100: '#FFE0FF',
            500: '#C33B80',
            900: '#89004F',
          },
        },
        neutral: {
          0: '#FFFFFF',
          100: '#F8F8FA',
          400: '#E1E1E6',
          600: '#69697A',
          900: '#1A1A2E',
        },
        accent: {
          gold: {
            DEFAULT: '#C33B80',
            light: '#FFA8D9',
            dark: '#89004F',
          },
        },
        success: '#28a745',
        error: '#dc3545',
      },
      spacing: {
        'xs': '8px',
        'sm': '16px',
        'md': '24px',
        'lg': '32px',
        'xl': '48px',
        'xxl': '64px',
        'xxxl': '96px',
        'xxxxl': '128px',
      },
      boxShadow: {
        'md': '0px 8px 24px rgba(195, 59, 128, 0.08)',
        'lg': '0px 12px 32px rgba(195, 59, 128, 0.12)',
      },
      borderRadius: {
        'default': '8px',
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease-in-out',
        'slide-up': 'slideUp 0.6s ease-out',
        'hover-lift': 'hoverLift 0.4s cubic-bezier(0.25, 0.8, 0.25, 1)',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        hoverLift: {
          '0%': { transform: 'translateY(0px)' },
          '100%': { transform: 'translateY(-8px)' },
        },
      },
    },
  },
  plugins: [],
}