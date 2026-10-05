import { useMemo, useState } from 'react'
import { Check, Search, ListChecks } from '../components/Icons.jsx'
import { cn, todoProgress } from '../lib/utils.js'
import { fuzzyScore } from '../lib/fuzzy.js'
import { projectColorHex } from '../lib/groups.js'
import { useI18n } from '../lib/i18n.js'
import useStore from '../store/useStore.js'

// Every project's todos in one list, grouped by project. Ticking a task here
// is the same action as ticking it on the project page.
export default function TasksView({ onOpenProject }) {
  const projects = useStore((s) => s.projects)
  const groups = useStore((s) => s.groups)
  const toggleTodo = useStore((s) => s.toggleTodo)
  const { t } = useI18n()

  const [filter, setFilter] = useState('open') // 'open' | 'all'
  const [query, setQuery] = useState('')

  const totalOpen = useMemo(
    () => projects.reduce((sum, p) => sum + todoProgress(p).open, 0),
    [projects]
  )
  const totalAll = useMemo(
    () => projects.reduce((sum, p) => sum + (p.todos || []).length, 0),
    [projects]
  )

  const sections = useMemo(() => {
    const q = query.trim()
    return projects
      .map((p) => {
        let todos = p.todos || []
        if (filter === 'open') todos = todos.filter((todo) => !todo.done)
        if (q) todos = todos.filter((todo) => fuzzyScore(q, todo.text) >= 0)
        return { project: p, todos, progress: todoProgress(p) }
      })
      .filter((s) => s.todos.length > 0)
      .sort(
        (a, b) =>
          Number(!!b.project.pinned) - Number(!!a.project.pinned) ||
          b.progress.open - a.progress.open ||
          a.project.name.localeCompare(b.project.name)
      )
  }, [projects, filter, query])

  const emptyMessage =
    totalAll === 0
      ? t('tasks.emptyAll')
      : query.trim()
        ? t('tasks.noMatch')
        : filter === 'open'
          ? t('tasks.emptyOpen')
          : t('tasks.emptyAll')

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-3xl px-6 py-6">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-content-primary">{t('tasks.title')}</h1>
            <p className="mt-0.5 text-sm text-content-secondary">{t('tasks.subtitle')}</p>
          </div>
          <div className="flex items-center rounded-xl border border-surface-border bg-surface-card p-0.5">
            {[
              { id: 'open', label: `${t('tasks.filterOpen')} (${totalOpen})` },
              { id: 'all', label: `${t('tasks.filterAll')} (${totalAll})` }
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                aria-pressed={filter === f.id}
                className={cn(
                  'rounded-lg px-3 py-1.5 text-sm font-medium transition',
                  filter === f.id ? 'bg-brand/15 text-brand' : 'text-content-secondary hover:text-content-primary'
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {totalAll > 0 && (
          <div className="relative mb-5">
            <Search
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-content-faint"
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('tasks.searchPlaceholder')}
              aria-label={t('tasks.searchPlaceholder')}
              className="w-full rounded-xl border border-surface-border bg-surface-card py-2 pl-9 pr-3 text-sm text-content-primary placeholder:text-content-faint focus:border-brand/50 focus:outline-none focus:ring-2 focus:ring-brand/20"
            />
          </div>
        )}

        {sections.length === 0 ? (
          <div className="grid place-items-center rounded-2xl border border-dashed border-surface-border px-6 py-16 text-center">
            <ListChecks size={28} className="mb-3 text-content-faint" />
            <p className="max-w-sm text-sm text-content-secondary">{emptyMessage}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sections.map(({ project, todos, progress }) => {
              const color = projectColorHex(project, groups)
              return (
                <section
                  key={project.id}
                  className="overflow-hidden rounded-2xl border border-surface-border bg-surface-card"
                >
                  <button
                    onClick={() => onOpenProject(project.id)}
                    className="flex w-full items-center gap-2.5 border-b border-surface-border px-4 py-3 text-left transition hover:bg-surface-hover"
                  >
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: color || 'rgb(var(--c-border))' }}
                      aria-hidden="true"
                    />
                    <span className="min-w-0 flex-1 truncate text-sm font-semibold text-content-primary">
                      {project.name}
                    </span>
                    <span className="shrink-0 text-xs text-content-faint">
                      {t('tasks.progress', { done: progress.done, total: progress.total })}
                    </span>
                  </button>
                  <ul className="divide-y divide-surface-border">
                    {todos.map((todo) => (
                      <li key={todo.id} className="flex items-center gap-3 px-4 py-2.5">
                        <button
                          onClick={() => toggleTodo(project.id, todo.id)}
                          role="checkbox"
                          aria-checked={todo.done}
                          aria-label={todo.text}
                          className={cn(
                            'grid h-5 w-5 shrink-0 place-items-center rounded-md border transition',
                            todo.done
                              ? 'border-emerald-500 bg-emerald-500 text-white'
                              : 'border-surface-border hover:border-brand'
                          )}
                        >
                          {todo.done && <Check size={13} />}
                        </button>
                        <span
                          className={cn(
                            'flex-1 text-sm',
                            todo.done ? 'text-content-faint line-through' : 'text-content-primary'
                          )}
                        >
                          {todo.text}
                        </span>
                      </li>
                    ))}
                  </ul>
                </section>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
