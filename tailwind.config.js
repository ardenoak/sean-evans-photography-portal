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
        // Primary luxury palette (accessibility-compliant)
        charcoal: {
          DEFAULT: '#2c2c2c',
          light: '#404040',
          dark: '#1a1a1a',
        },
        verde: {
          DEFAULT: '#4a5d23',
          light: '#6B8E5A',
          dark: '#3a4a1b',
        },
        gold: {
          DEFAULT: '#876214', // WCAG AA compliant
          light: '#B8941F',
          dark: '#6B5412',
        },
        ivory: {
          DEFAULT: '#f8f6f0',
          warm: '#faf9f4',
          cool: '#f6f5f2',
        },
        'warm-gray': {
          DEFAULT: '#4B5563', // WCAG AA compliant
          light: '#6b7280',
          dark: '#374151',
        },
        // Legacy colors for backward compatibility
        'warm-brown': '#A67C52',
      },
      fontFamily: {
        'luxury-serif': ['Didot', 'Times New Roman', 'serif'],
        'luxury-sans': ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
        // Legacy font for backward compatibility
        didot: ['Didot', 'Times New Roman', 'serif'],
      },
      fontSize: {
        'luxury-xs': ['0.75rem', { lineHeight: '1.1' }],
        'luxury-sm': ['0.875rem', { lineHeight: '1.25' }],
        'luxury-base': ['1rem', { lineHeight: '1.5' }],
        'luxury-lg': ['1.125rem', { lineHeight: '1.5' }],
        'luxury-xl': ['1.25rem', { lineHeight: '1.5' }],
        'luxury-2xl': ['1.5rem', { lineHeight: '1.25' }],
        'luxury-3xl': ['1.875rem', { lineHeight: '1.25' }],
        'luxury-4xl': ['2.25rem', { lineHeight: '1.1' }],
        'luxury-5xl': ['3rem', { lineHeight: '1.1' }],
      },
      spacing: {
        'luxury-xs': '0.25rem',    // 4px
        'luxury-sm': '0.5rem',     // 8px
        'luxury-md': '1rem',       // 16px
        'luxury-lg': '1.5rem',     // 24px
        'luxury-xl': '2rem',       // 32px
        'luxury-2xl': '3rem',      // 48px
        'luxury-3xl': '4rem',      // 64px
        'luxury-4xl': '6rem',      // 96px
      },
      lineHeight: {
        'luxury-tight': '1.1',
        'luxury-snug': '1.25',
        'luxury-normal': '1.5',
        'luxury-relaxed': '1.75',
        'luxury-loose': '2',
      },
      boxShadow: {
        'luxury-sm': '0 1px 2px 0 rgba(44, 44, 44, 0.05)',
        'luxury-md': '0 4px 6px -1px rgba(44, 44, 44, 0.1), 0 2px 4px -1px rgba(44, 44, 44, 0.06)',
        'luxury-lg': '0 10px 15px -3px rgba(44, 44, 44, 0.1), 0 4px 6px -2px rgba(44, 44, 44, 0.05)',
        'luxury-xl': '0 20px 25px -5px rgba(44, 44, 44, 0.1), 0 10px 10px -5px rgba(44, 44, 44, 0.04)',
      },
      borderRadius: {
        'luxury-sm': '0.125rem',   // 2px
        'luxury-md': '0.375rem',   // 6px
        'luxury-lg': '0.5rem',     // 8px
        'luxury-xl': '0.75rem',    // 12px
        'luxury-2xl': '1rem',      // 16px
        'luxury-3xl': '1.5rem',    // 24px
      },
      keyframes: {
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in': {
          '0%': { opacity: '0', transform: 'translateX(-20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'luxury-pulse': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.8' },
        },
      },
      animation: {
        shimmer: 'shimmer 2s infinite',
        'fade-in': 'fade-in 0.6s ease-out forwards',
        'slide-in': 'slide-in 0.6s ease-out forwards',
        'luxury-pulse': 'luxury-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      backdropBlur: {
        'luxury-sm': '4px',
        'luxury-md': '12px',
        'luxury-lg': '16px',
      },
      transitionDuration: {
        'luxury': '300ms',
        'luxury-slow': '500ms',
      },
      transitionTimingFunction: {
        'luxury': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'luxury-out': 'cubic-bezier(0, 0, 0.2, 1)',
        'luxury-in': 'cubic-bezier(0.4, 0, 1, 1)',
      },
    },
  },
  plugins: [],
}