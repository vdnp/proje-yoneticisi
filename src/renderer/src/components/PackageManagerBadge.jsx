import { useI18n } from '../lib/i18n.js'

// Small colored chip for the detected package manager. Unknown managers still
// get a neutral chip, so a new one from the detector never silently vanishes.
const COLORS = {
  npm: '#f87171',
  yarn: '#7dd3fc',
  pnpm: '#fcd34d',
  bun: '#f9a8d4',
  deno: '#86efac',
  cargo: '#fdba74',
  go: '#67e8f9',
  pip: '#93c5fd',
  poetry: '#93c5fd',
  pipenv: '#93c5fd',
  conda: '#86efac',
  composer: '#a5b4fc',
  bundler: '#fda4af',
  maven: '#fca5a5',
  gradle: '#5eead4',
  sbt: '#fca5a5',
  nuget: '#c4b5fd',
  pub: '#7dd3fc',
  swiftpm: '#fdba74',
  hex: '#c4b5fd',
  cmake: '#cbd5e1',
  make: '#cbd5e1'
}
const NEUTRAL = '#94a3b8'

// Pass the project's `tags` to skip the chip when it would just repeat a tag
// (the `go` package manager next to the `Go` language tag).
export default function PackageManagerBadge({ pm, tags, className = '' }) {
  const { t } = useI18n()
  if (!pm) return null
  if (tags?.some((tag) => tag.toLowerCase() === pm.toLowerCase())) return null
  const color = COLORS[pm] || NEUTRAL
  return (
    <span
      title={t('pm.title', { pm })}
      className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium ${className}`}
      style={{ color, backgroundColor: color + '1a' }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
      {pm}
    </span>
  )
}
