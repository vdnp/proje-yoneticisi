import { useState } from 'react'
import { Grid, Star, Settings, Plus, Layers, Edit, ListChecks } from './Icons.jsx'
import { cn } from '../lib/utils.js'
import { groupColorHex } from '../lib/groups.js'
import { useI18n } from '../lib/i18n.js'
import useStore from '../store/useStore.js'

function NavItem({ active, onClick, icon: Icon, label, count, dot, onDropProject, onEdit, editLabel }) {
  const [over, setOver] = useState(false)

  return (
    <div
      onDragOver={(e) => {
        if (!onDropProject) return
        if (!e.dataTransfer.types.includes('application/x-project-id')) return
        e.preventDefault()
        setOver(true)
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        if (!onDropProject) return
        const id = e.dataTransfer.getData('application/x-project-id')
        setOver(false)
        if (id) {
          e.preventDefault()
          onDropProject(id)
        }
      }}
      className={cn(
        'group/nav flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition',
        active
          ? 'bg-brand/15 text-content-primary ring-1 ring-inset ring-brand/30'
          : 'text-content-secondary hover:bg-surface-hover hover:text-content-primary',
        over && 'ring-2 ring-brand'
      )}
    >
      <button onClick={onClick} className="flex min-w-0 flex-1 items-center gap-3 text-left">
        {dot ? (
          <span
            className="h-2.5 w-2.5 shrink-0 rounded-full"
            style={{ backgroundColor: dot }}
            aria-hidden="true"
          />
        ) : (
          <Icon size={18} className={active ? 'text-brand' : ''} />
        )}
        <span className="truncate">{label}</span>
      </button>

      {onEdit && (
        <button
          onClick={onEdit}
          title={editLabel}
          aria-label={editLabel}
          className="shrink-0 rounded p-0.5 text-content-faint opacity-0 transition hover:text-content-primary group-hover/nav:opacity-100"
        >
          <Edit size={13} />
        </button>
      )}

      {count != null && (
        <span className="shrink-0 rounded-md bg-surface-hover px-1.5 py-0.5 text-[11px] text-content-faint">
          {count}
        </span>
      )}
    </div>
  )
}

export default function Sidebar({
  view,
  filter,
  setFilter,
  goHome,
  goTasks,
  goSettings,
  onAdd,
  onEditGroup,
  onNewGroup,
  counts
}) {
  const projects = useStore((s) => s.projects)
  const groups = useStore((s) => s.groups)
  const setProjectGroup = useStore((s) => s.setProjectGroup)
  const { t } = useI18n()
  const onHome = view === 'home'

  const select = (f) => {
    goHome()
    setFilter(f)
  }

  return (
    <aside className="flex w-60 shrink-0 flex-col gap-4 overflow-y-auto border-r border-surface-border bg-surface-bg p-4">
      <button
        onClick={onAdd}
        className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-brand px-3 py-2.5 text-sm font-semibold text-onbrand shadow-sm transition hover:brightness-110 active:scale-[0.98]"
      >
        <Plus size={18} /> {t('nav.addProject')}
      </button>

      <nav className="flex flex-col gap-1">
        <NavItem
          active={onHome && filter === 'all'}
          onClick={() => select('all')}
          icon={Grid}
          label={t('nav.all')}
          count={counts.all}
          // Dropping here removes a project from its group.
          onDropProject={(id) => setProjectGroup(id, null)}
        />
        <NavItem
          active={onHome && filter === 'favorites'}
          onClick={() => select('favorites')}
          icon={Star}
          label={t('nav.favorites')}
          count={counts.favorites}
        />
        <NavItem
          active={view === 'tasks'}
          onClick={goTasks}
          icon={ListChecks}
          label={t('nav.tasks')}
          count={counts.openTodos}
        />
      </nav>

      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between px-3 pb-1">
          <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-content-faint">
            <Layers size={13} /> {t('nav.groups')}
          </span>
          <button
            onClick={onNewGroup}
            title={t('nav.newGroup')}
            aria-label={t('nav.newGroup')}
            className="rounded p-0.5 text-content-faint transition hover:text-content-primary"
          >
            <Plus size={14} />
          </button>
        </div>

        {groups.length === 0 ? (
          <p className="px-3 pb-1 text-[11px] leading-relaxed text-content-faint">{t('nav.noGroups')}</p>
        ) : (
          groups.map((g) => (
            <NavItem
              key={g.id}
              active={onHome && filter === `group:${g.id}`}
              onClick={() => select(`group:${g.id}`)}
              label={g.name}
              dot={groupColorHex(g.color)}
              count={projects.filter((p) => p.groupId === g.id).length}
              onDropProject={(id) => setProjectGroup(id, g.id)}
              onEdit={() => onEditGroup(g)}
              editLabel={t('nav.editGroup')}
            />
          ))
        )}
      </div>

      <nav className="mt-auto flex flex-col gap-1">
        <NavItem
          active={view === 'settings'}
          onClick={goSettings}
          icon={Settings}
          label={t('nav.settings')}
        />
        <div className="px-3 pt-1 text-[11px] leading-relaxed text-content-faint">
          {t('nav.projectCount', { count: counts.all })} ·{' '}
          {t('nav.openTaskCount', { count: counts.openTodos })}
        </div>
      </nav>
    </aside>
  )
}
