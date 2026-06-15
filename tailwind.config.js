/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#4CAF50',
          dark: '#43A047',
          light: '#E8F5E9',
          soft: '#F0FDF4',
        },
        petrol: {
          DEFAULT: '#1E3A5F',
          light: '#2D5280',
          muted: '#4A6285',
        },
        surface: '#FFFFFF',
        background: '#F7F8FA',
        muted: {
          DEFAULT: '#64748B',
          light: '#94A3B8',
          lighter: '#CBD5E1',
        },
        border: {
          DEFAULT: '#E8ECF0',
          light: '#F1F3F5',
        },
        accent: '#FF9800',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        xl: '16px',
        '2xl': '20px',
        '3xl': '24px',
      },
      boxShadow: {
        soft: '0 2px 12px rgba(30, 58, 95, 0.06)',
        card: '0 4px 20px rgba(30, 58, 95, 0.08)',
        'card-hover': '0 12px 36px rgba(30, 58, 95, 0.14)',
        float: '0 8px 32px rgba(30, 58, 95, 0.12)',
      },
      transitionTimingFunction: {
        smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      animation: {
        shimmer: 'shimmer 1.5s ease-in-out infinite',
        'fade-up': 'fadeSlideUp 0.45s ease forwards',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
        fadeSlideUp: {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
