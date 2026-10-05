// Accent presets — soft / pastel palette. Each provides the brand color as an
// "R G B" triple for both modes (applied to the --c-brand CSS variable, which
// every brand-* utility and focus ring reads through rgb(var(--c-brand)/<a>)).
// Display names live in the locale files under `colors.<id>`.
//
// Dark mode uses light pastel tints (~300 level) → filled brand buttons need
// DARK ink; light mode uses vivid tones (~500 level) → filled buttons need
// WHITE ink. applyTheme() sets --c-on-brand accordingly.
export const ACCENTS = {
  indigo: { swatch: '#a5b4fc', dark: '165 180 252', light: '99 102 241' },
  violet: { swatch: '#c4b5fd', dark: '196 181 253', light: '139 92 246' },
  sky: { swatch: '#7dd3fc', dark: '125 211 252', light: '14 165 233' },
  teal: { swatch: '#5eead4', dark: '94 234 212', light: '20 184 166' },
  emerald: { swatch: '#86efac', dark: '134 239 172', light: '34 197 94' },
  amber: { swatch: '#fcd34d', dark: '252 211 77', light: '245 158 11' },
  rose: { swatch: '#fda4af', dark: '253 164 175', light: '244 63 94' },
  pink: { swatch: '#f9a8d4', dark: '249 168 212', light: '236 72 153' }
}

export const ACCENT_LIST = Object.entries(ACCENTS).map(([id, v]) => ({ id, ...v }))

// Apply theme (dark/light) and accent color to the document root.
export function applyTheme(settings = {}) {
  const root = document.documentElement
  const isLight = settings.theme === 'light'
  root.classList.toggle('light', isLight)

  const accent = ACCENTS[settings.accent] || ACCENTS.indigo
  root.style.setProperty('--c-brand', isLight ? accent.light : accent.dark)
  // Ink color for text/icons sitting on a solid brand fill.
  root.style.setProperty('--c-on-brand', isLight ? '255 255 255' : '21 26 35')
}
