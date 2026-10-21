import { useEffect, useMemo, useRef, useState } from 'react'
import { Search, Play, Code, Pin, Maximize, Link } from './components/Icons.jsx'
import WindowControls from './components/WindowControls.jsx'
import { cn, todoProgress } from './lib/utils.js'
import { fuzzyScoreAny } from './lib/fuzzy.js'
import { projectColorHex } from './lib/groups.js'
import { applyTheme } from './lib/theme.js'
import { useI18n, errorText } from './lib/i18n.js'
import { isLaunchable, launchPlan, linkedProjects } from '../../shared/links.js'
import api from './lib/api.js'
import useStore from './store/useStore.js'

// The mini window (#mini): search plus favorites / recently opened, with each
// project's linked projects indented under it. It only READS the store — the
// main window is the single writer — so opens are reported back to it
// (api.notifyOpened) instead of calling markOpened here.
const drag = { WebkitAppRegion: 'drag' }
const noDrag = { WebkitAppRegion: 'no-drag' }

function hydrateStore(data) {
  useStore.setState({
    version: data.version || 1,
    projects: data.projects || [],
    groups: data.groups || [],
    settings: data.settings || {},
    loaded: true
  })
  applyTheme(data.settings || {})
}

function Row({ item, active, onRun, onHover }) {
  const { project: p, depth, parent } = item
  const groups = useStore((s) => s.groups)
  const { t } = useI18n()
  const color = projectColorHex(p, groups)
  const launchable = isLaunchable(p)
  const { open } = todoProgress(p)

  return (
    <div
      role="option"
      aria-selected={active}
      onMouseEnter={onHover}
      onClick={(e) => onRun(item, e.shiftKey)}
      title={parent ? t('mini.linkedTo', { name: parent.name }) : p.path}
      className={cn(
        'group/row relative flex cursor-pointer items-center gap-2.5 rounded-lg py-1.5 pr-1.5 transition-colors',
        depth ? 'pl-8' : 'pl-2.5',
        active ? 'bg-surface-hover' : ''
      )}
    >
      {depth > 0 && (
        // Tree elbow from the parent row down to this linked project.
        <span
          aria-hidden="true"
          className="absolute left-[15px] top-0 h-1/2 w-3 rounded-bl-md border-b border-l border-surface-border"
        />
      )}
      {depth > 0 ? (
        <Link size={12} className="shrink-0 text-content-faint" />
      ) : (
        <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: color || 'rgb(var(--c-text-faint))' }} />
      )}
      <span className={cn('min-w-0 flex-1 truncate', depth ? 'text-[13px] text-content-secondary' : 'text-sm text-content-primary')}>
        {p.name}
      </span>
      {open > 0 && !depth && (
        <span className="shrink-0 text-[11px] text-content-faint" title={t('mini.openTasks', { count: open })}>
          ☐ {open}
        </span>
      )}
      <button
        title={launchable ? t('mini.launch') : t('mini.openEditor')}
        aria-label={launchable ? t('mini.launch') : t('mini.openEditor')}
        onClick={(e) => {
          e.stopPropagation()
          onRun(item, false)
        }}
        className={cn(
          'grid h-6 w-6 shrink-0 place-items-center rounded-md transition',
          launchable ? 'text-brand hover:bg-brand/15' : 'text-content-faint hover:bg-surface-card hover:text-content-primary',
          !active && 'opacity-60 group-hover/row:opacity-100'
        )}
      >
        {launchable ? <Play size={13} /> : <Code size={14} />}
      </button>
    </div>
  )
}

export default function MiniApp() {
  const loaded = useStore((s) => s.loaded)
  const projects = useStore((s) => s.projects)
  const settings = useStore((s) => s.settings)
  const { t } = useI18n()
  const [query, setQuery] = useState('')
  const [cursor, setCursor] = useState(0)
  const [onTop, setOnTop] = useState(true)
  const [error, setError] = useState('')
  const listRef = useRef(null)

  useEffect(() => {
    api.loadData().then(hydrateStore)
    api.isAlwaysOnTop?.().then(setOnTop)
    return api.onDataChanged?.(hydrateStore)
  }, [])

  useEffect(() => {
    document.title = t('titlebar.mini')
  }, [t])

  // Sections → flat list of rows (parents with their linked projects below).
  const sections = useMemo(() => {
    const withLinks = (list) =>
      list.flatMap((p) => [
        { key: p.id, project: p, depth: 0 },
        ...linkedProjects(p, projects).map((lp) => ({ key: `${p.id}>${lp.id}`, project: lp, depth: 1, parent: p }))
      ])
    const q = query.trim()
    if (q) {
      const hits = projects
        .map((p) => ({ p, score: fuzzyScoreAny(q, [p.name, ...(p.tags || [])]) }))
        .filter((x) => x.score >= 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 12)
        .map((x) => x.p)
      return [{ key: 'results', title: t('mini.results'), rows: withLinks(hits) }]
    }
    const favorites = projects
      .filter((p) => p.favorite)
      .sort((a, b) => Number(!!b.pinned) - Number(!!a.pinned) || (b.lastOpenedAt || 0) - (a.lastOpenedAt || 0))
    const recent = projects
      .filter((p) => p.lastOpenedAt && !p.favorite)
      .sort((a, b) => b.lastOpenedAt - a.lastOpenedAt)
      .slice(0, 6)
    return [
      { key: 'fav', title: t('mini.favorites'), rows: withLinks(favorites) },
      { key: 'recent', title: t('mini.recent'), rows: withLinks(recent) }
    ].filter((s) => s.rows.length)
  }, [projects, query, t])

  const rows = useMemo(() => sections.flatMap((s) => s.rows), [sections])
  useEffect(() => setCursor(0), [query])
  useEffect(() => {
    listRef.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' })
  }, [cursor])

  // Launch (linked projects + dev scripts) when there's something to launch,
  // otherwise just the editor; Shift = editor only.
  const run = async (item, editorOnly) => {
    const p = item.project
    setError('')
    const editor = settings.defaultEditor
    if (!editorOnly && isLaunchable(p)) {
      const results = (await api.launch(launchPlan(p, projects, editor))) || []
      api.notifyOpened(results.filter((r) => r.ok).map((r) => r.id))
      const failed = results.find((r) => !r.ok || r.scriptError)
      if (failed) setError(`${failed.name}: ${errorText(t, failed.error || failed.scriptError)}`)
      return
    }
    const res = await api.openInEditor(p.editorCommand || editor || 'code', p.path)
    if (res?.ok) api.notifyOpened([p.id])
    else setError(`${p.name}: ${errorText(t, res?.error)}`)
  }

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') setCursor((c) => Math.min(rows.length - 1, c + 1))
    else if (e.key === 'ArrowUp') setCursor((c) => Math.max(0, c - 1))
    else if (e.key === 'Enter' && rows[cursor]) run(rows[cursor], e.shiftKey)
    else if (e.key === 'Escape' && query) setQuery('')
    else return
    e.preventDefault()
  }

  if (!loaded) return null
  let index = -1

  return (
    <div className="flex h-full flex-col overflow-hidden bg-surface-bg">
      <div style={drag} className="pm-glass flex h-11 shrink-0 items-center gap-2 border-b border-surface-border pl-3">
        <Search size={15} className="shrink-0 text-content-faint" />
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={t('mini.search')}
          aria-label={t('mini.search')}
          style={noDrag}
          className="min-w-0 flex-1 bg-transparent text-sm text-content-primary placeholder:text-content-faint focus:outline-none"
        />
        <div className="flex items-center gap-0.5">
          <button
            title={t('titlebar.alwaysOnTop')}
            aria-label={t('titlebar.alwaysOnTop')}
            aria-pressed={onTop}
            onClick={async () => setOnTop(await api.setAlwaysOnTop(!onTop))}
            style={noDrag}
            className={cn(
              'grid h-7 w-7 place-items-center rounded-lg transition',
              onTop ? 'bg-brand/15 text-brand' : 'text-content-faint hover:bg-surface-hover hover:text-content-primary'
            )}
          >
            <Pin size={14} fill={onTop ? 'currentColor' : 'none'} />
          </button>
          <button
            title={t('mini.expand')}
            aria-label={t('mini.expand')}
            onClick={() => api.expandMini()}
            style={noDrag}
            className="grid h-7 w-7 place-items-center rounded-lg text-content-faint transition hover:bg-surface-hover hover:text-content-primary"
          >
            <Maximize size={14} />
          </button>
        </div>
        <WindowControls closeOnly onClose={() => api.closeMini()} />
      </div>

      <div ref={listRef} role="listbox" className="flex-1 overflow-y-auto p-1.5">
        {rows.length === 0 && (
          <p className="px-3 py-8 text-center text-xs text-content-faint">{query ? t('mini.none') : t('mini.empty')}</p>
        )}
        {sections.map((s) => (
          <div key={s.key} className="mb-1">
            <div className="px-2.5 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-content-faint">
              {s.title}
            </div>
            {s.rows.map((item) => {
              index += 1
              const i = index
              return (
                <Row
                  key={item.key}
                  item={item}
                  active={i === cursor}
                  onHover={() => setCursor(i)}
                  onRun={run}
                />
              )
            })}
          </div>
        ))}
      </div>

      {error && (
        <p role="alert" className="shrink-0 truncate border-t border-surface-border px-3 py-1.5 text-[11px] text-rose-400">
          {error}
        </p>
      )}
      <div className="flex shrink-0 items-center gap-3 border-t border-surface-border px-3 py-1.5 text-[11px] text-content-faint">
        <span>⏎ {t('mini.launch').toLowerCase()}</span>
        <span>⇧⏎ {t('mini.openEditor').toLowerCase()}</span>
      </div>
    </div>
  )
}
