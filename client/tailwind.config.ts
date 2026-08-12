import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary:   '#1f2937',
        'primary-dark': '#111827',
        accent:    '#f43f5e',
        'accent-light': '#ffe4e6',
        muted:     '#8a8581',
        surface:   '#faf9f7',
        card:      '#ffffff',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 4px 0 rgba(0,0,0,0.12)',
        'card-hover': '0 4px 16px 0 rgba(0,0,0,0.16)',
        nav: '0 2px 8px 0 rgba(0,0,0,0.16)',
      },
      keyframes: {
        'slide-in': { '0%': { transform: 'translateX(100%)' }, '100%': { transform: 'translateX(0)' } },
        'fade-in':  { '0%': { opacity: '0' },                  '100%': { opacity: '1' } },
      },
      animation: {
        'slide-in': 'slide-in 0.4s ease',
        'fade-in':  'fade-in 0.3s ease',
      },
    },
  },
  plugins: [],
};

export default config;
