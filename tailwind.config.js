/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./src/renderer/index.html', './src/renderer/src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Semantic surface tokens driven by CSS variables (see index.css)
        surface: {
          bg: 'rgb(var(--c-bg) / <alpha-value>)',
          card: 'rgb(var(--c-card) / <alpha-value>)',
          hover: 'rgb(var(--c-hover) / <alpha-value>)',
          border: 'rgb(var(--c-border) / <alpha-value>)'
        },
        content: {
          primary: 'rgb(var(--c-text) / <alpha-value>)',
          secondary: 'rgb(var(--c-text-dim) / <alpha-value>)',
          faint: 'rgb(var(--c-text-faint) / <alpha-value>)'
        },
        brand: {
          DEFAULT: 'rgb(var(--c-brand) / <alpha-value>)',
          soft: 'rgb(var(--c-brand-soft) / <alpha-value>)'
        },
        onbrand: 'rgb(var(--c-on-brand) / <alpha-value>)'
      },
      boxShadow: {
        card: '0 1px 3px rgb(0 0 0 / 0.08), 0 1px 2px rgb(0 0 0 / 0.04)',
        'card-hover': '0 8px 24px rgb(0 0 0 / 0.12), 0 2px 6px rgb(0 0 0 / 0.06)'
      },
      fontFamily: {
        sans: ['Inter', 'Segoe UI', 'system-ui', 'sans-serif']
      }
    }
  },
  plugins: []
}
