import TagBadge from './TagBadge.jsx'
import PackageManagerBadge from './PackageManagerBadge.jsx'
import GitBadge from './GitBadge.jsx'
import { Star, Pin, Code, Folder, Terminal, Github, CheckSquare, AlertTriangle, Play } from './Icons.jsx'
import { SelectBox, LinkChip, useLinked, launchTitle, dropStyle } from './ProjectBits.jsx'
import { isLaunchable } from '../../../shared/links.js'
import { cn, relativeTime, todoProgress } from '../lib/utils.js'
import { projectColorHex } from '../lib/groups.js'
import { useProjectActions } from '../lib/useProjectActions.js'
import { useI18n } from '../lib/i18n.js'
import useStore from '../store/useStore.js'

function IconBtn({ title, onClick, children, disabled }) {
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
        disabled && 'cursor-not-allowed opacity-30 hover:bg-transparent'
      )}
    >
      {children}
    </button>
  )
}

// Same props as ProjectCard.
export default function ProjectRow({
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
  const missing = useStore((s) => !!s.missing[project.path])
  const actions = useProjectActions()
  const { t, lang } = useI18n()
  const { done, total, open } = todoProgress(project)
  const color = projectColorHex(project, groups)
  const linked = useLinked(project)

  return (
    <div
      onClick={(e) => (onCardClick ? onCardClick(e, project) : onOpen(project.id))}
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
      style={{ '--pc': color || undefined, ...dropStyle(dnd?.side) }}
      className={cn(
        'pm-card group relative flex cursor-pointer items-center gap-3 overflow-hidden rounded-xl border bg-surface-card px-3 py-2.5 transition',
        selected || checked
          ? 'border-brand ring-2 ring-brand/30'
          : 'border-surface-border hover:border-brand/40 hover:bg-surface-hover',
        checked && 'bg-brand/5'
      )}
    >
      {color && (
        <span
          className="pm-accent absolute inset-y-0 left-0 w-1"
          style={{ backgroundColor: color }}
          aria-hidden="true"
        />
      )}

      <div className="flex shrink-0 items-center gap-0.5 pl-1">
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
            project.pinned ? 'text-brand' : 'text-content-faint hover:text-brand'
          )}
        >
          <Pin size={15} fill={project.pinned ? 'currentColor' : 'none'} />
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
            project.favorite ? 'text-amber-400' : 'text-content-faint hover:text-amber-400'
          )}
        >
          <Star size={15} fill={project.favorite ? 'currentColor' : 'none'} />
        </button>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-semibold text-content-primary">{project.name}</span>
          {project.gitUrl && <Github size={13} className="shrink-0 text-content-faint" />}
          <span className="min-w-0 shrink">
            <LinkChip linked={linked} />
          </span>
        </div>
        {missing ? (
          <p className="flex items-center gap-1 truncate text-xs text-rose-400">
            <AlertTriangle size={12} className="shrink-0" /> {t('card.missing')}
          </p>
        ) : (
          <p className="truncate text-xs text-content-faint">
            {project.description || project.path || '—'}
          </p>
        )}
      </div>

      <span className="hidden shrink-0 text-[11px] text-content-faint xl:inline-flex">
        {!missing && <GitBadge path={project.path} />}
      </span>

      <PackageManagerBadge
        pm={project.packageManager}
        tags={project.tags}
        className="hidden shrink-0 sm:inline-flex"
      />

      <div className="hidden max-w-[200px] flex-wrap gap-1 md:flex">
        {(project.tags || []).slice(0, 3).map((tag) => (
          <TagBadge key={tag} label={tag} />
        ))}
      </div>

      {total > 0 && (
        <span
          className={cn(
            'hidden shrink-0 items-center gap-1 text-xs sm:inline-flex',
            open > 0 ? 'text-content-secondary' : 'text-emerald-400'
          )}
          title={t('card.tasksDone', { done, total })}
        >
          <CheckSquare size={13} /> {done}/{total}
        </span>
      )}

      <span className="hidden w-24 shrink-0 text-right text-xs text-content-faint lg:block">
        {relativeTime(project.lastModified, lang, t('common.never'))}
      </span>

      <div className="flex shrink-0 items-center gap-0.5">
        {isLaunchable(project) ? (
          <IconBtn title={launchTitle(t, project, linked)} onClick={() => actions.launch(project)}>
            <Play size={15} className="text-brand" />
          </IconBtn>
        ) : (
          // Keeps the action columns aligned across rows.
          <span className="h-8 w-8" aria-hidden="true" />
        )}
        <IconBtn title={t('card.openEditor')} onClick={() => actions.openInEditor(project)}>
          <Code size={16} />
        </IconBtn>
        <IconBtn title={t('card.openTerminal')} onClick={() => actions.openInTerminal(project)}>
          <Terminal size={16} />
        </IconBtn>
        <IconBtn title={t('card.showFolder')} onClick={() => actions.openInExplorer(project)}>
          <Folder size={16} />
        </IconBtn>
        <IconBtn
          title={project.gitUrl ? t('card.openGithub') : t('card.noGithub')}
          disabled={!project.gitUrl}
          onClick={() => actions.openGithub(project)}
        >
          <Github size={16} />
        </IconBtn>
      </div>
    </div>
  )
}
