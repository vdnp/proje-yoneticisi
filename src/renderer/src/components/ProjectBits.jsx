import { Check, Link } from './Icons.jsx'
import { cn } from '../lib/utils.js'
import { useI18n } from '../lib/i18n.js'
import useStore from '../store/useStore.js'
import { linkedProjects } from '../../../shared/links.js'

// Small pieces shared by ProjectCard and ProjectRow.

// Bulk-selection checkbox. Hidden until hover unless something is selected.
export function SelectBox({ checked, visible, onToggle }) {
  const { t } = useI18n()
  return (
    <button
      role="checkbox"
      aria-checked={checked}
      title={t('card.select')}
      aria-label={t('card.select')}
      onClick={(e) => {
        e.stopPropagation()
        onToggle(e)
      }}
      className={cn(
        'grid h-[18px] w-[18px] shrink-0 place-items-center rounded-md border transition',
        checked
          ? 'border-brand bg-brand text-onbrand'
          : 'border-content-faint/60 text-transparent hover:border-brand',
        !checked && !visible && 'opacity-0 group-hover:opacity-100'
      )}
    >
      <Check size={12} strokeWidth={3} />
    </button>
  )
}

export function useLinked(project) {
  const projects = useStore((s) => s.projects)
  return linkedProjects(project, projects)
}

// "🔗 inventory-api +1"
export function LinkChip({ linked }) {
  const { t } = useI18n()
  if (!linked.length) return null
  const names = linked.map((p) => p.name)
  return (
    <span
      className="pm-chip inline-flex max-w-full items-center gap-1 rounded-md bg-brand/10 px-1.5 py-0.5 text-[11px] font-medium text-brand"
      title={t('card.linked', { names: names.join(', ') })}
    >
      <Link size={11} className="shrink-0" />
      <span className="truncate">{names[0]}</span>
      {names.length > 1 && <span className="shrink-0">+{names.length - 1}</span>}
    </span>
  )
}

// Tooltip for the Launch button: what will open and which scripts start.
export function launchTitle(t, project, linked) {
  const parts = [project, ...linked].map((p) => (p.startScript ? `${p.name} (${p.startScript})` : p.name))
  return t('card.launchTitle', { what: parts.join(' + ') })
}

// Highlights the edge a dragged card will land next to. An inset shadow,
// because cards clip their overflow (for the color accent).
export function dropStyle(side) {
  if (!side) return undefined
  const offset = { left: '5px 0', right: '-5px 0', top: '0 5px', bottom: '0 -5px' }[side]
  return { boxShadow: `inset ${offset} 0 0 rgb(var(--c-brand))` }
}
