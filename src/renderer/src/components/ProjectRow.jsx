import TagBadge from './TagBadge.jsx'
import PackageManagerBadge from './PackageManagerBadge.jsx'
import GitBadge from './GitBadge.jsx'
import { Star, Pin, Code, Folder, Terminal, Github, CheckSquare, AlertTriangle } from './Icons.jsx'
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

export default function ProjectRow({ project, onOpen, selected }) {
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
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('application/x-project-id', project.id)
        e.dataTransfer.effectAllowed = 'move'
      }}
      className={cn(
        'group relative flex cursor-pointer items-center gap-3 overflow-hidden rounded-xl border bg-surface-card px-3 py-2.5 transition',
        selected
          ? 'border-brand ring-2 ring-brand/30'
          : 'border-surface-border hover:border-brand/40 hover:bg-surface-hover'
      )}
    >
      {color && (
        <span
          className="absolute inset-y-0 left-0 w-1"
          style={{ backgroundColor: color }}
          aria-hidden="true"
        />
      )}

      <div className="flex shrink-0 items-center gap-0.5 pl-1">
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
