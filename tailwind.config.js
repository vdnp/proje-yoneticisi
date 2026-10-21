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
      // Radii and shadows come from CSS variables so the selectable styles
      // (classic / minimal / glass / soft, see index.css) can reshape every
      // component without touching its classes. Fallbacks = Tailwind defaults.
      borderRadius: {
        md: 'var(--r-md, 0.375rem)',
        lg: 'var(--r-lg, 0.5rem)',
        xl: 'var(--r-xl, 0.75rem)',
        '2xl': 'var(--r-2xl, 1rem)'
      },
      boxShadow: {
        card: 'var(--sh-card)',
        'card-hover': 'var(--sh-card-hover)'
      },
      fontFamily: {
        sans: ['Inter', 'Segoe UI', 'system-ui', 'sans-serif']
      }
    }
  },
  plugins: []
}
