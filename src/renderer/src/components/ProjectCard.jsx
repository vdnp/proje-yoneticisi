import TagBadge from './TagBadge.jsx'
import PackageManagerBadge from './PackageManagerBadge.jsx'
import GitBadge from './GitBadge.jsx'
import {
  Star,
  Pin,
  Code,
  Folder,
  Terminal,
  Github,
  Clock,
  CheckSquare,
  AlertTriangle
} from './Icons.jsx'
import { cn, relativeTime, todoProgress } from '../lib/utils.js'
import { projectColorHex } from '../lib/groups.js'
import { useProjectActions } from '../lib/useProjectActions.js'
import { useI18n } from '../lib/i18n.js'
import useStore from '../store/useStore.js'

function ActionButton({ title, onClick, children, disabled }) {
  return (
    <button
      title={title}
      aria-label={title}
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      className={cn(
        'grid h-8 w-8 place-items-center rounded-lg text-content-secondary transition',
        'hover:bg-surface-hover hover:text-content-primary',
        disabled && 'cursor-not-allowed opacity-30 hover:bg-transparent hover:text-content-secondary'
      )}
    >
      {children}
    </button>
  )
}

export default function ProjectCard({ project, onOpen, selected }) {
  const toggleFavorite = useStore((s) => s.toggleFavorite)
  const togglePin = useStore((s) => s.togglePin)
  const groups = useStore((s) => s.groups)
  const missing = useStore((s) => !!s.missing[project.path])
  const actions = useProjectActions()
  const { t, lang } = useI18n()
  const { done, total, open } = todoProgress(project)
  const color = projectColorHex(project, groups)

  return (
    <div
      onClick={() => onOpen(project.id)}
      // Dragging a card onto a sidebar group assigns it to that group.
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('application/x-project-id', project.id)
        e.dataTransfer.effectAllowed = 'move'
      }}
      className={cn(
        'group relative flex cursor-pointer flex-col overflow-hidden rounded-2xl border bg-surface-card p-4',
        'shadow-card transition hover:-translate-y-0.5 hover:shadow-card-hover',
        selected ? 'border-brand ring-2 ring-brand/30' : 'border-surface-border hover:border-brand/40'
      )}
    >
      {/* group color accent */}
      {color && (
        <span
          className="absolute inset-y-0 left-0 w-1"
          style={{ backgroundColor: color }}
          aria-hidden="true"
        />
      )}

      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="truncate text-[15px] font-semibold text-content-primary">{project.name}</h3>
          <p className="mt-0.5 truncate text-xs text-content-faint">{project.path || '—'}</p>
        </div>

        <div className="flex shrink-0 items-center gap-0.5">
          <button
            title={project.pinned ? t('card.unpin') : t('card.pin')}
            aria-label={project.pinned ? t('card.unpin') : t('card.pin')}
            onClick={(e) => {
              e.stopPropagation()
              togglePin(project.id)
            }}
            className={cn(
              'rounded-lg p-1 transition',
              project.pinned
                ? 'text-brand'
                : 'text-content-faint opacity-0 hover:text-brand group-hover:opacity-100'
            )}
          >
            <Pin size={16} fill={project.pinned ? 'currentColor' : 'none'} />
          </button>
          <button
            title={project.favorite ? t('card.unfavorite') : t('card.favorite')}
            aria-label={project.favorite ? t('card.unfavorite') : t('card.favorite')}
            onClick={(e) => {
              e.stopPropagation()
              toggleFavorite(project.id)
            }}
            className={cn(
              'rounded-lg p-1 transition',
              project.favorite
                ? 'text-amber-400'
                : 'text-content-faint opacity-0 hover:text-amber-400 group-hover:opacity-100'
            )}
          >
            <Star size={16} fill={project.favorite ? 'currentColor' : 'none'} />
          </button>
        </div>
      </div>

      {missing ? (
        <p className="mt-2 flex min-h-[2.5rem] items-start gap-1.5 text-[13px] leading-relaxed text-rose-400">
          <AlertTriangle size={15} className="mt-0.5 shrink-0" /> {t('card.missing')}
        </p>
      ) : (
        <p className="mt-2 line-clamp-2 min-h-[2.5rem] text-[13px] leading-relaxed text-content-secondary">
          {project.description || t('card.noDescription')}
        </p>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <PackageManagerBadge pm={project.packageManager} tags={project.tags} />
        {(project.tags || []).slice(0, 3).map((tag) => (
          <TagBadge key={tag} label={tag} />
        ))}
        {(project.tags || []).length > 3 && (
          <span className="text-[11px] text-content-faint">+{project.tags.length - 3}</span>
        )}
      </div>

      <div className="mt-3 flex min-w-0 items-center gap-3 text-[11px] text-content-faint">
        <span className="inline-flex shrink-0 items-center gap-1">
          <Clock size={13} /> {relativeTime(project.lastModified, lang, t('common.never'))}
        </span>
        {total > 0 && (
          <span
            className={cn(
              'inline-flex shrink-0 items-center gap-1',
              open > 0 ? 'text-content-secondary' : 'text-emerald-400'
            )}
            title={t('card.tasksDone', { done, total })}
          >
            <CheckSquare size={13} /> {done}/{total}
          </span>
        )}
        {!missing && <GitBadge path={project.path} />}
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-surface-border pt-3">
        <div className="flex items-center gap-0.5">
          <ActionButton title={t('card.openEditor')} onClick={() => actions.openInEditor(project)}>
            <Code size={16} />
          </ActionButton>
          <ActionButton title={t('card.openTerminal')} onClick={() => actions.openInTerminal(project)}>
            <Terminal size={16} />
          </ActionButton>
          <ActionButton title={t('card.showFolder')} onClick={() => actions.openInExplorer(project)}>
            <Folder size={16} />
          </ActionButton>
          <ActionButton
            title={project.gitUrl ? t('card.openGithub') : t('card.noGithub')}
            disabled={!project.gitUrl}
            onClick={() => actions.openGithub(project)}
          >
            <Github size={16} />
          </ActionButton>
        </div>
        {open > 0 && (
          <span
            className="rounded-md bg-surface-hover px-1.5 py-0.5 text-[11px] font-medium text-content-secondary"
            title={t('card.openTasks', { count: open })}
          >
            🔲 {open}
          </span>
        )}
      </div>
    </div>
  )
}
