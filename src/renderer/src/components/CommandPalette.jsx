import { useEffect, useMemo, useRef, useState } from 'react'
import { Search, Code, Plus, Settings, Star, Scan, ListChecks } from './Icons.jsx'
import { cn } from '../lib/utils.js'
import { fuzzyScore, fuzzyScoreAny } from '../lib/fuzzy.js'
import { useProjectActions } from '../lib/useProjectActions.js'
import { useI18n } from '../lib/i18n.js'
import useStore from '../store/useStore.js'

function Kbd({ children }) {
  return (
    <kbd className="rounded border border-surface-border bg-surface-bg px-1.5 py-0.5 font-sans text-[10px] font-medium text-content-faint">
      {children}
    </kbd>
  )
}

export default function CommandPalette({ onClose, onOpenProject, onGoSettings, onGoTasks, onAdd, onScan }) {
  const projects = useStore((s) => s.projects)
  const actions = useProjectActions()
  const { t } = useI18n()
  const [query, setQuery] = useState('')
  const [index, setIndex] = useState(0)
  const listRef = useRef(null)

  const items = useMemo(() => {
    const q = query.trim()
    const command = (key, icon, run) => ({
      key: `cmd:${key}`,
      icon,
      label: t(`palette.cmd.${key}.label`),
      hint: t(`palette.cmd.${key}.hint`),
      run: () => {
        run()
        onClose()
      }
    })

    const commands = [
      command('add', Plus, onAdd),
      command('scan', Scan, onScan),
      command('tasks', ListChecks, onGoTasks),
      command('settings', Settings, onGoSettings)
    ]

    const toProjectItem = (p) => ({
      key: 'p:' + p.id,
      icon: p.favorite ? Star : Code,
      label: p.name,
      hint: p.path,
      project: p,
      // Enter → open in editor (the fast path). Ctrl+Enter → open detail page.
      run: () => {
        actions.openInEditor(p)
        onClose()
      },
      runAlt: () => {
        onOpenProject(p.id)
        onClose()
      }
    })

    if (!q) {
      const recent = [...projects]
        .sort(
          (a, b) =>
            Number(!!b.pinned) - Number(!!a.pinned) ||
            Number(b.favorite) - Number(a.favorite) ||
            (b.lastOpenedAt || 0) - (a.lastOpenedAt || 0)
        )
        .slice(0, 7)
        .map(toProjectItem)
      return [...recent, ...commands]
    }

    // Fuzzy over projects and commands, best score first.
    const scored = [
      ...projects.map((p) => ({
        item: toProjectItem(p),
        score: fuzzyScoreAny(q, [p.name, ...(p.tags || [])])
      })),
      ...commands.map((c) => ({ item: c, score: fuzzyScore(q, c.label) }))
    ]
    return scored
      .filter((x) => x.score >= 0)
      .sort((a, b) => b.score - a.score)
      .map((x) => x.item)
  }, [projects, query, t])

  useEffect(() => setIndex(0), [query])

  // Keep the highlighted row in view while arrowing through the list.
  useEffect(() => {
    const el = listRef.current?.children[index]
    if (el) el.scrollIntoView({ block: 'nearest' })
  }, [index])

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setIndex((i) => Math.min(i + 1, items.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const item = items[index]
      if (!item) return
      if ((e.ctrlKey || e.metaKey) && item.runAlt) item.runAlt()
      else item.run()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      onClose()
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4 pt-[12vh] backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl animate-fadein overflow-hidden rounded-2xl border border-surface-border bg-surface-card shadow-card-hover"
      >
        <div className="flex items-center gap-3 border-b border-surface-border px-4">
          <Search size={17} className="shrink-0 text-content-faint" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={t('palette.placeholder')}
            className="w-full bg-transparent py-3.5 text-sm text-content-primary placeholder:text-content-faint focus:outline-none"
          />
        </div>

        {items.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-content-faint">{t('palette.noResults')}</p>
        ) : (
          <div ref={listRef} className="max-h-80 overflow-y-auto p-1.5">
            {items.map((item, i) => {
              const Icon = item.icon
              return (
                <button
                  key={item.key}
                  onMouseEnter={() => setIndex(i)}
                  onClick={() => item.run()}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition',
                    i === index ? 'bg-brand/15' : 'hover:bg-surface-hover'
                  )}
                >
                  <Icon
                    size={16}
                    className={cn('shrink-0', i === index ? 'text-brand' : 'text-content-faint')}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-content-primary">
                      {item.label}
                    </span>
                    <span className="block truncate text-xs text-content-faint">{item.hint}</span>
                  </span>
                  {item.project && i === index && (
                    <span className="shrink-0 text-[10px] text-content-faint">{t('palette.openEditor')}</span>
                  )}
                </button>
              )
            })}
          </div>
        )}

        <div className="flex items-center gap-3 border-t border-surface-border px-4 py-2 text-[11px] text-content-faint">
          <span className="flex items-center gap-1">
            <Kbd>↑</Kbd>
            <Kbd>↓</Kbd> {t('palette.navigate')}
          </span>
          <span className="flex items-center gap-1">
            <Kbd>⏎</Kbd> {t('palette.openEditor')}
          </span>
          <span className="flex items-center gap-1">
            <Kbd>Ctrl</Kbd>
            <Kbd>⏎</Kbd> {t('palette.details')}
          </span>
          <span className="ml-auto flex items-center gap-1">
            <Kbd>Esc</Kbd> {t('palette.close')}
          </span>
        </div>
      </div>
    </div>
  )
}
