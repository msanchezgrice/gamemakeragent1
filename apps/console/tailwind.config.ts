import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/app/**/*.{ts,tsx}',
    './src/components/**/*.{ts,tsx}',
    './src/lib/**/*.{ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        background: '#05060A',
        surface: '#0B0D16',
        primary: {
          DEFAULT: '#3B82F6',
          foreground: '#F9FAFB'
        },
        accent: '#22D3EE',
        warning: '#F59E0B',
        success: '#22C55E'
      },
      boxShadow: {
        card: '0 18px 30px -20px rgba(59, 130, 246, 0.4)'
      },
      transitionTimingFunction: {
        smooth: 'cubic-bezier(0.4, 0.0, 0.2, 1)'
      }
    }
  },
  plugins: []
};

export default config;
