import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      colors: {
        gray: {
          50:  '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
        },
        // Warm amber palette — matches reference image
        app: {
          DEFAULT: '#F5E6CC',   // warm cream background
          card:    '#FFFFFF',   // card surface
          sidebar: '#EFD9B4',   // slightly darker sidebar
        },
        primary: {
          DEFAULT: '#E8941A',   // amber/orange accent
          light:   '#F5B642',   // lighter amber
          dark:    '#C97A10',   // deeper amber
          glow:    'rgba(232, 148, 26, 0.4)',
        },
      },
      borderRadius: {
        DEFAULT: '0.5rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      boxShadow: {
        sm: '0 1px 2px 0 rgb(0 0 0 / 0.04)',
        DEFAULT: '0 1px 3px 0 rgb(0 0 0 / 0.08), 0 1px 2px -1px rgb(0 0 0 / 0.08)',
        'soft':    '8px 8px 24px rgba(200,168,120,0.25), -4px -4px 16px rgba(255,255,255,0.8)',
        'soft-sm': '4px 4px 12px rgba(200,168,120,0.2), -2px -2px 8px rgba(255,255,255,0.7)',
        'card':    '0 4px 24px rgba(180,140,80,0.12)',
        'glow':    '0 8px 24px -4px rgba(232, 148, 26, 0.45)',
        'topbar':  '0 2px 20px rgba(200,168,120,0.18)',
      },
      animation: {
        'fade-in':  'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.25s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
      },
      keyframes: {
        fadeIn:  { from: { opacity: '0' },                                              to: { opacity: '1' } },
        slideUp: { from: { opacity: '0', transform: 'translateY(10px)' },              to: { opacity: '1', transform: 'translateY(0)' } },
        scaleIn: { from: { opacity: '0', transform: 'scale(0.95)' },                  to: { opacity: '1', transform: 'scale(1)' } },
      },
    },
  },
  plugins: [],
}

export default config