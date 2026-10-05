// Tiny className joiner (avoids a clsx dependency).
export function cn(...parts) {
  return parts.filter(Boolean).join(' ')
}

export function newId() {
  return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

const LOCALES = { tr: 'tr-TR', en: 'en-US' }
const UNITS = [
  ['year', 31536000],
  ['month', 2592000],
  ['week', 604800],
  ['day', 86400],
  ['hour', 3600],
  ['minute', 60]
]

// "3 gün önce" / "3 days ago", "dün" / "yesterday" — Intl handles both.
// Words like "dün" are only used for ±1; Intl's Turkish "evvelsi gün" (for 2)
// reads dated, so anything else stays numeric.
export function relativeTime(ms, lang = 'en', never = '—') {
  if (!ms) return never
  const locale = LOCALES[lang] || lang
  const seconds = Math.round((ms - Date.now()) / 1000)
  const abs = Math.abs(seconds)
  for (const [unit, size] of UNITS) {
    if (abs >= size) {
      const value = Math.round(seconds / size)
      const numeric = Math.abs(value) === 1 ? 'auto' : 'always'
      return new Intl.RelativeTimeFormat(locale, { numeric }).format(value, unit)
    }
  }
  return new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }).format(0, 'second')
}

export function formatDate(ms, lang = 'en') {
  if (!ms) return '—'
  try {
    return new Date(ms).toLocaleDateString(LOCALES[lang] || lang, {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  } catch {
    return '—'
  }
}

// { done, total, open } for a project's todo list.
export function todoProgress(project) {
  const todos = project.todos || []
  const done = todos.filter((t) => t.done).length
  return { done, total: todos.length, open: todos.length - done }
}

// Windows paths are case-insensitive, so compare them that way when checking
// whether a folder is already in the list.
export function samePath(a, b) {
  const norm = (p) => (p || '').replace(/[\\/]+$/, '').replace(/\//g, '\\').toLowerCase()
  return norm(a) === norm(b)
}
