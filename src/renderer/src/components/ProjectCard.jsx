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
  AlertTriangle,
  Play,
  GitBranch
} from './Icons.jsx'
import { SelectBox, LinkChip, useLinked, launchTitle, dropStyle, ProjectMark } from './ProjectBits.jsx'
import { isLaunchable } from '../../../shared/links.js'
import { cn, relativeTime, todoProgress } from '../lib/utils.js'
import { projectColorHex } from '../lib/groups.js'
import { useProjectActions } from '../lib/useProjectActions.js'
import { useGitStatus } from '../lib/useGitStatus.js'
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

// "main · 3 changes · 2 days ago" (the status-focused layout's subtitle).
function StatusLine({ project, missing }) {
  const status = useGitStatus(missing ? '' : project.path)
  const { t, lang } = useI18n()
  const dirty = status ? status.changed + status.untracked : 0
  return (
    <p className="mt-0.5 flex min-w-0 items-center gap-1.5 truncate text-xs text-content-faint">
      {status && (
        <>
          <GitBranch size={12} className="shrink-0" />
          <span className="max-w-[45%] truncate">{status.branch || t('git.detached')}</span>
          <span
            className={cn('shrink-0 font-medium', dirty ? 'text-amber-400' : 'text-emerald-400')}
            title={dirty ? t('git.changes', { count: dirty }) : t('git.clean')}
          >
            {dirty ? `●${dirty}` : '✓'}
          </span>
          <span aria-hidden="true">·</span>
        </>
      )}
      <span className="truncate">{relativeTime(project.lastModified, lang, t('common.never'))}</span>
    </p>
  )
}

function TaskBar({ done, total, color }) {
  return (
    <div className="h-1.5 overflow-hidden rounded-full bg-surface-hover">
      <div
        className="h-full rounded-full transition-[width]"
        style={{ width: total ? `${(done / total) * 100}%` : 0, backgroundColor: color || 'rgb(var(--c-brand))' }}
      />
    </div>
  )
}

// One card, three layouts (settings.cardLayout) and three ways to show the
// project's color (settings.cardColor):
//   layout  standard — description, chips, meta row
//           status   — git + age subtitle, task progress and the next task
//           side     — description and chips, facts in a right-hand column
//   color   strip    — accent strip on the left edge
//           border   — tinted border and a monogram tile before the name
//           progress — a bottom bar in the project color showing task progress
// `onCardClick`, `checked`/`onToggleCheck` and `dnd` come from the main list
// (bulk selection, reordering); the "recently opened" strip leaves them out
// and a click simply opens the project.
export default function ProjectCard({
  project,
  onOpen,
  selected,
  checked = false,
  selectionActive = false,
  onCardClick,
  onToggleCheck,
  dnd
}) {
  const toggleFavorite = useStore((s) => s.toggleFavorite)
  const togglePin = useStore((s) => s.togglePin)
  const groups = useStore((s) => s.groups)
  const cardColor = useStore((s) => s.settings.cardColor || 'strip')
  const layout = useStore((s) => s.settings.cardLayout || 'standard')
  const missing = useStore((s) => !!s.missing[project.path])
  const actions = useProjectActions()
  const { t, lang } = useI18n()
  const { done, total, open } = todoProgress(project)
  const color = projectColorHex(project, groups)
  const linked = useLinked(project)
  const highlighted = selected || checked
  const nextTask = (project.todos || []).find((td) => !td.done)

  const chips = (
    <div className="flex flex-wrap items-center gap-1.5">
      <LinkChip linked={linked} />
      <PackageManagerBadge pm={project.packageManager} tags={project.tags} />
      {(project.tags || []).slice(0, 3).map((tag) => (
        <TagBadge key={tag} label={tag} />
      ))}
      {(project.tags || []).length > 3 && (
        <span className="text-[11px] text-content-faint">+{project.tags.length - 3}</span>
      )}
    </div>
  )

  const description = missing ? (
    <p className="flex items-start gap-1.5 text-[13px] leading-relaxed text-rose-400">
      <AlertTriangle size={15} className="mt-0.5 shrink-0" /> {t('card.missing')}
    </p>
  ) : (
    <p className="line-clamp-2 text-[13px] leading-relaxed text-content-secondary">
      {project.description || t('card.noDescription')}
    </p>
  )

  const tasksMeta = total > 0 && (
    <span
      className={cn('inline-flex shrink-0 items-center gap-1', open > 0 ? 'text-content-secondary' : 'text-emerald-400')}
      title={t('card.tasksDone', { done, total })}
    >
      <CheckSquare size={13} /> {done}/{total}
    </span>
  )

  return (
    <div
      onClick={(e) => (onCardClick ? onCardClick(e, project) : onOpen(project.id))}
      // Dragging a card onto a sidebar group assigns it to that group; in the
      // custom order it also reorders the list.
      draggable
      onDragStart={(e) => {
        if (dnd) return dnd.onDragStart(e)
        e.dataTransfer.setData('application/x-project-id', project.id)
        e.dataTransfer.effectAllowed = 'move'
      }}
      onDragOver={dnd?.onDragOver}
      onDragLeave={dnd?.onDragLeave}
      onDrop={dnd?.onDrop}
      onDragEnd={dnd?.onDragEnd}
      // --pc feeds the "soft" style's project-colored tint (index.css).
      style={{
        '--pc': color || undefined,
        ...(cardColor === 'border' && color && !highlighted
          ? { borderColor: `color-mix(in srgb, ${color} 55%, rgb(var(--c-border)))` }
          : null),
        ...dropStyle(dnd?.side)
      }}
      className={cn(
        'pm-card group relative flex cursor-pointer flex-col overflow-hidden rounded-2xl border bg-surface-card p-4',
        'shadow-card transition hover:-translate-y-0.5 hover:shadow-card-hover',
        highlighted ? 'border-brand ring-2 ring-brand/30' : 'border-surface-border hover:border-brand/40',
        checked && 'bg-brand/5'
      )}
    >
      {cardColor === 'strip' && color && (
        <span
          className="pm-accent absolute inset-y-0 left-0 w-1"
          style={{ backgroundColor: color }}
          aria-hidden="true"
        />
      )}

      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2.5">
          {cardColor === 'border' && <ProjectMark name={project.name} color={color} />}
          <div className="min-w-0">
            <h3 className="truncate text-[15px] font-semibold text-content-primary">{project.name}</h3>
            {layout === 'status' ? (
              <StatusLine project={project} missing={missing} />
            ) : (
              <p className="mt-0.5 truncate text-xs text-content-faint">{project.path || '—'}</p>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-0.5">
          {onToggleCheck && (
            <span className="mr-1 flex items-center">
              <SelectBox checked={checked} visible={selectionActive} onToggle={() => onToggleCheck(project)} />
            </span>
          )}
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

      {layout === 'standard' && (
        <>
          <div className="mt-2 min-h-[2.5rem]">{description}</div>
          <div className="mt-3">{chips}</div>
          <div className="mt-3 flex min-w-0 items-center gap-3 text-[11px] text-content-faint">
            <span className="inline-flex shrink-0 items-center gap-1">
              <Clock size={13} /> {relativeTime(project.lastModified, lang, t('common.never'))}
            </span>
            {tasksMeta}
            {!missing && <GitBadge path={project.path} />}
          </div>
        </>
      )}

      {layout === 'status' && (
        <div className="mt-3 flex flex-1 flex-col gap-2">
          {missing && description}
          {total > 0 ? (
            <>
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-content-secondary">{t('card.tasks')}</span>
                <span className={open ? 'text-content-secondary' : 'text-emerald-400'}>
                  {done}/{total}
                </span>
              </div>
              <TaskBar done={done} total={total} color={color} />
              <p className="truncate text-xs text-content-faint">
                {nextTask ? t('card.nextTask', { task: nextTask.text }) : t('card.allTasksDone')}
              </p>
            </>
          ) : (
            <p className="line-clamp-2 text-xs text-content-faint">{project.description || t('card.noTasks')}</p>
          )}
          {linked.length > 0 && (
            <div>
              <LinkChip linked={linked} />
            </div>
          )}
        </div>
      )}

      {layout === 'side' && (
        <div className="pm-side mt-2 flex flex-1 gap-3">
          <div className="flex min-w-0 flex-1 flex-col gap-2.5">
            {description}
            {chips}
          </div>
          <div className="pm-side-col flex w-24 shrink-0 flex-col justify-center gap-1.5 border-l border-surface-border pl-3 text-[11px] text-content-faint">
            {!missing && <GitBadge path={project.path} />}
            {tasksMeta || (
              <span className="inline-flex items-center gap-1">
                <CheckSquare size={13} /> —
              </span>
            )}
            <span className="inline-flex items-center gap-1 truncate">
              <Clock size={13} className="shrink-0" />
              <span className="truncate">{relativeTime(project.lastModified, lang, t('common.never'))}</span>
            </span>
          </div>
        </div>
      )}

      {/* Pushes the actions to the bottom so cards in a row line up. */}
      <div className="min-h-3 flex-1" aria-hidden="true" />
      <div className="flex items-center justify-between border-t border-surface-border pt-3">
        <div className="flex items-center gap-0.5">
          {isLaunchable(project) && (
            <ActionButton title={launchTitle(t, project, linked)} onClick={() => actions.launch(project)}>
              <Play size={15} className="text-brand" />
            </ActionButton>
          )}
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
        {open > 0 && layout !== 'status' && (
          <span
            className="shrink-0 whitespace-nowrap rounded-md bg-surface-hover px-1.5 py-0.5 text-[11px] font-medium text-content-secondary"
            title={t('card.openTasks', { count: open })}
          >
            🔲 {open}
          </span>
        )}
      </div>

      {cardColor === 'progress' && (
        <span
          className="pm-progress absolute inset-x-0 bottom-0 h-1"
          style={{ backgroundColor: `color-mix(in srgb, ${color || 'rgb(var(--c-brand))'} 22%, transparent)` }}
          title={t('card.tasksDone', { done, total })}
          aria-hidden="true"
        >
          <span
            className="block h-full"
            style={{ width: total ? `${(done / total) * 100}%` : 0, backgroundColor: color || 'rgb(var(--c-brand))' }}
          />
        </span>
      )}
    </div>
  )
}
