import { useEffect, useMemo, useRef, useState } from 'react'
import ProjectCard from '../components/ProjectCard.jsx'
import ProjectRow from '../components/ProjectRow.jsx'
import { Search, Grid, List, Clock, Plus, Scan, Pin, Folder } from '../components/Icons.jsx'
import { cn } from '../lib/utils.js'
import { fuzzyScoreAny } from '../lib/fuzzy.js'
import { useI18n } from '../lib/i18n.js'
import useStore from '../store/useStore.js'

const SORTS = ['modified', 'opened', 'name', 'favorite']

function sortProjects(list, sort) {
  const arr = [...list]
  const by = {
    name: (a, b) => a.name.localeCompare(b.name),
    opened: (a, b) => (b.lastOpenedAt || 0) - (a.lastOpenedAt || 0),
    favorite: (a, b) =>
      Number(b.favorite) - Number(a.favorite) || (b.lastModified || 0) - (a.lastModified || 0),
    modified: (a, b) => (b.lastModified || 0) - (a.lastModified || 0)
  }
  // Pinned projects always float to the top, whatever the sort.
  return arr.sort(
    (a, b) => Number(!!b.pinned) - Number(!!a.pinned) || (by[sort] || by.modified)(a, b)
  )
}

export default function HomeView({ filter, onOpenProject, onAdd, onScan, keyboardActive }) {
  const projects = useStore((s) => s.projects)
  const groups = useStore((s) => s.groups)
  const settings = useStore((s) => s.settings)
  const updateSettings = useStore((s) => s.updateSettings)
  const { t } = useI18n()

  const [query, setQuery] = useState('')
  const [sort, setSort] = useState('modified')
  const [activeTag, setActiveTag] = useState(null)
  const [cursor, setCursor] = useState(-1)
  const searchRef = useRef(null)
  const gridRef = useRef(null)

  const viewMode = settings.viewMode || 'grid'
  const setViewMode = (m) => updateSettings({ viewMode: m })

  useEffect(() => {
    const focus = () => searchRef.current?.focus()
    window.addEventListener('pm:focus-search', focus)
    return () => window.removeEventListener('pm:focus-search', focus)
  }, [])

  const allTags = useMemo(() => {
    const set = new Set()
    projects.forEach((p) => (p.tags || []).forEach((tag) => set.add(tag)))
    return [...set].sort((a, b) => a.localeCompare(b))
  }, [projects])

  const recent = useMemo(
    () =>
      [...projects]
        .filter((p) => p.lastOpenedAt)
        .sort((a, b) => b.lastOpenedAt - a.lastOpenedAt)
        .slice(0, 4),
    [projects]
  )

  const groupFilterId = filter.startsWith('group:') ? filter.slice(6) : null
  const activeGroup = groups.find((g) => g.id === groupFilterId)

  const filtered = useMemo(() => {
    let list = projects
    if (filter === 'favorites') list = list.filter((p) => p.favorite)
    else if (groupFilterId) list = list.filter((p) => p.groupId === groupFilterId)
    if (activeTag) list = list.filter((p) => (p.tags || []).includes(activeTag))

    const q = query.trim()
    if (!q) return sortProjects(list, sort)

    // Fuzzy over name + tags, drop misses, best score first — pinned still
    // wins, matching the rest of the app's ordering.
    return list
      .map((p) => ({ p, score: fuzzyScoreAny(q, [p.name, ...(p.tags || [])]) }))
      .filter((x) => x.score >= 0)
      .sort((a, b) => Number(!!b.p.pinned) - Number(!!a.p.pinned) || b.score - a.score)
      .map((x) => x.p)
  }, [projects, filter, groupFilterId, activeTag, query, sort])

  // Reset the keyboard cursor whenever the list changes shape.
  useEffect(() => setCursor(-1), [query, filter, activeTag, sort])

  // ---- arrow-key navigation over the cards ----
  useEffect(() => {
    if (!keyboardActive) return

    const columnCount = () => {
      if (viewMode === 'list') return 1
      const kids = gridRef.current?.children
      if (!kids || kids.length === 0) return 1
      const top = kids[0].offsetTop
      let cols = 0
      for (const k of kids) {
        if (k.offsetTop !== top) break
        cols++
      }
      return Math.max(1, cols)
    }

    const onKey = (e) => {
      const tag = document.activeElement?.tagName
      const typing = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT'
      if (!['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight', 'Enter'].includes(e.key)) return
      // From the search box only ↓ jumps into the results.
      if (typing && e.key !== 'ArrowDown') return
      if (!filtered.length) return

      if (e.key === 'Enter') {
        if (cursor >= 0 && filtered[cursor]) {
          e.preventDefault()
          onOpenProject(filtered[cursor].id)
        }
        return
      }

      e.preventDefault()
      if (typing) searchRef.current?.blur()
      const cols = columnCount()
      const step = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -cols, ArrowDown: cols }[e.key]
      setCursor((c) => {
        const next = c < 0 ? 0 : c + step
        return Math.max(0, Math.min(filtered.length - 1, next))
      })
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [keyboardActive, filtered, cursor, viewMode, onOpenProject])

  // Keep the highlighted card in view.
  useEffect(() => {
    if (cursor < 0) return
    gridRef.current?.children[cursor]?.scrollIntoView({ block: 'nearest' })
  }, [cursor])

  const showRecent = filter === 'all' && !query && !activeTag && recent.length > 0
  const heading =
    filter === 'favorites' ? t('nav.favorites') : activeGroup ? activeGroup.name : t('nav.all')

  if (projects.length === 0) {
    return <Welcome onAdd={onAdd} onScan={onScan} />
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-wrap items-center gap-3 border-b border-surface-border px-6 py-4">
        <div className="relative min-w-[220px] flex-1">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-content-faint"
          />
          <input
            ref={searchRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('home.searchPlaceholder')}
            aria-label={t('home.searchPlaceholder')}
            className="w-full rounded-xl border border-surface-border bg-surface-card py-2 pl-9 pr-20 text-sm text-content-primary placeholder:text-content-faint focus:border-brand/50 focus:outline-none focus:ring-2 focus:ring-brand/20"
          />
          <span className="pointer-events-none absolute right-2.5 top-1/2 flex -translate-y-1/2 items-center gap-1">
            <kbd className="rounded border border-surface-border bg-surface-bg px-1.5 py-0.5 text-[10px] font-medium text-content-faint">
              Ctrl
            </kbd>
            <kbd className="rounded border border-surface-border bg-surface-bg px-1.5 py-0.5 text-[10px] font-medium text-content-faint">
              K
            </kbd>
          </span>
        </div>

        <button
          onClick={onScan}
          title={t('home.scanTitle')}
          className="flex items-center gap-2 rounded-xl border border-surface-border bg-surface-card px-3 py-2 text-sm font-medium text-content-secondary transition hover:border-brand/40 hover:text-content-primary"
        >
          <Scan size={16} /> {t('home.scan')}
        </button>

        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="rounded-xl border border-surface-border bg-surface-card px-3 py-2 text-sm text-content-secondary focus:border-brand/50 focus:outline-none"
        >
          {SORTS.map((id) => (
            <option key={id} value={id}>
              {t(`home.sort.${id}`)}
            </option>
          ))}
        </select>

        <div className="flex items-center rounded-xl border border-surface-border bg-surface-card p-0.5">
          {[
            { id: 'grid', icon: Grid, label: t('home.gridView') },
            { id: 'list', icon: List, label: t('home.listView') }
          ].map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              title={label}
              aria-label={label}
              aria-pressed={viewMode === id}
              onClick={() => setViewMode(id)}
              className={cn(
                'grid h-8 w-8 place-items-center rounded-lg transition',
                viewMode === id ? 'bg-brand/15 text-brand' : 'text-content-faint hover:text-content-primary'
              )}
            >
              <Icon size={16} />
            </button>
          ))}
        </div>
      </div>

      {allTags.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 border-b border-surface-border px-6 py-2.5">
          <button
            onClick={() => setActiveTag(null)}
            className={cn(
              'rounded-full px-2.5 py-1 text-xs font-medium transition',
              !activeTag ? 'bg-brand/15 text-brand' : 'text-content-faint hover:text-content-primary'
            )}
          >
            {t('common.all')}
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setActiveTag(activeTag === tag ? null : tag)}
              className={cn(
                'rounded-full px-2.5 py-1 text-xs font-medium transition',
                activeTag === tag ? 'bg-brand/15 text-brand' : 'text-content-secondary hover:bg-surface-hover'
              )}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-6 py-5">
        {showRecent && (
          <section className="mb-7">
            <h2 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-content-faint">
              <Clock size={14} /> {t('home.recent')}
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {recent.map((p) => (
                <ProjectCard key={p.id} project={p} onOpen={onOpenProject} />
              ))}
            </div>
          </section>
        )}

        <div className="mb-3 flex items-center gap-2">
          <h2 className="text-sm font-semibold text-content-primary">
            {heading} <span className="text-content-faint">({filtered.length})</span>
          </h2>
          {filtered.some((p) => p.pinned) && (
            <span className="inline-flex items-center gap-1 text-[11px] text-content-faint">
              <Pin size={11} /> {t('home.pinnedFirst')}
            </span>
          )}
        </div>

        {filtered.length === 0 ? (
          <div className="grid place-items-center rounded-2xl border border-dashed border-surface-border py-16 text-center">
            <div className="max-w-xs">
              <h3 className="text-sm font-semibold text-content-primary">{t('home.noResults')}</h3>
              <p className="mt-1 text-xs text-content-secondary">{t('home.noResultsBody')}</p>
            </div>
          </div>
        ) : viewMode === 'grid' ? (
          <div
            ref={gridRef}
            className="grid animate-fadein grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3"
          >
            {filtered.map((p, i) => (
              <ProjectCard key={p.id} project={p} onOpen={onOpenProject} selected={i === cursor} />
            ))}
          </div>
        ) : (
          <div ref={gridRef} className="flex animate-fadein flex-col gap-2">
            {filtered.map((p, i) => (
              <ProjectRow key={p.id} project={p} onOpen={onOpenProject} selected={i === cursor} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// First-run screen: no projects yet.
function Welcome({ onAdd, onScan }) {
  const { t } = useI18n()
  return (
    <div className="grid h-full place-items-center px-6">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-2xl bg-brand/15 text-brand">
          <Folder size={30} />
        </div>
        <h2 className="text-xl font-bold text-content-primary">{t('home.welcome.title')}</h2>
        <p className="mt-2 text-sm leading-relaxed text-content-secondary">{t('home.welcome.body')}</p>

        <div className="mt-6 flex flex-col gap-2.5">
          <button
            onClick={onScan}
            className="flex items-center justify-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-onbrand transition hover:brightness-110"
          >
            <Scan size={17} /> {t('home.welcome.scan')}
          </button>
          <button
            onClick={onAdd}
            className="flex items-center justify-center gap-2 rounded-xl border border-surface-border bg-surface-card px-4 py-2.5 text-sm font-medium text-content-primary transition hover:border-brand/40"
          >
            <Plus size={17} /> {t('home.welcome.pick')}
          </button>
        </div>

        <div className="mt-6 rounded-xl border border-dashed border-surface-border px-4 py-3 text-xs text-content-faint">
          {t('home.welcome.tip')}
        </div>
      </div>
    </div>
  )
}
