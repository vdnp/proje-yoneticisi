import { useState } from 'react'
import Modal from './Modal.jsx'
import TagBadge from './TagBadge.jsx'
import PackageManagerBadge from './PackageManagerBadge.jsx'
import { Folder, Scan, Check, Github } from './Icons.jsx'
import { cn, samePath } from '../lib/utils.js'
import { useI18n, errorText } from '../lib/i18n.js'
import api from '../lib/api.js'
import useStore from '../store/useStore.js'

export default function ScanModal({ onClose, onImported }) {
  const projects = useStore((s) => s.projects)
  const addProject = useStore((s) => s.addProject)
  const settings = useStore((s) => s.settings)
  const { t } = useI18n()

  const [root, setRoot] = useState(settings.defaultRoot || '')
  const [busy, setBusy] = useState(false)
  const [scanned, setScanned] = useState(false)
  const [candidates, setCandidates] = useState([])
  const [selected, setSelected] = useState(() => new Set())

  const isAdded = (path) => projects.some((p) => samePath(p.path, path))
  const fresh = candidates.filter((c) => !isAdded(c.path))
  const selectedFresh = fresh.filter((c) => selected.has(c.path))

  const pickRoot = async () => {
    const res = await api.selectFolder(root || '')
    if (res.ok) setRoot(res.path)
  }

  const scan = async () => {
    if (!root) return
    setBusy(true)
    try {
      const res = await api.scanRoot(root)
      if (!res.ok) {
        alert(res.error ? errorText(t, res.error) : t('scan.failed'))
        return
      }
      const list = res.projects || []
      setCandidates(list)
      // Preselect everything that isn't already in the list.
      setSelected(new Set(list.filter((c) => !isAdded(c.path)).map((c) => c.path)))
      setScanned(true)
    } finally {
      setBusy(false)
    }
  }

  const toggle = (path) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(path)) next.delete(path)
      else next.add(path)
      return next
    })
  }

  const importSelected = () => {
    selectedFresh.forEach((c) =>
      addProject({
        path: c.path,
        name: c.name,
        description: c.description,
        gitUrl: c.gitUrl,
        tags: c.tags,
        languages: c.languages,
        frameworks: c.frameworks,
        packageManager: c.packageManager,
        lastModified: c.lastModified
      })
    )
    onImported?.(selectedFresh.length)
    onClose()
  }

  const allSelected = fresh.length > 0 && selectedFresh.length === fresh.length

  return (
    <Modal title={t('scan.title')} onClose={onClose} width="max-w-2xl">
      <div className="flex gap-2">
        <input
          value={root}
          onChange={(e) => setRoot(e.target.value)}
          placeholder="C:\Projects"
          className="w-full rounded-xl border border-surface-border bg-surface-bg px-3 py-2 text-sm text-content-primary placeholder:text-content-faint focus:border-brand/50 focus:outline-none focus:ring-2 focus:ring-brand/20"
        />
        <button
          onClick={pickRoot}
          className="flex shrink-0 items-center gap-2 rounded-xl border border-surface-border bg-surface-hover px-3 py-2 text-sm font-medium text-content-primary transition hover:border-brand/40"
        >
          <Folder size={16} /> {t('common.browse')}
        </button>
        <button
          onClick={scan}
          disabled={!root || busy}
          className="flex shrink-0 items-center gap-2 rounded-xl bg-brand px-3 py-2 text-sm font-semibold text-onbrand transition hover:brightness-110 disabled:opacity-50"
        >
          <Scan size={16} /> {busy ? t('scan.scanning') : t('scan.scan')}
        </button>
      </div>

      <p className="mt-2 text-[11px] text-content-faint">{t('scan.hint')}</p>

      {scanned && (
        <div className="mt-4">
          <div className="mb-2 flex items-center justify-between text-xs">
            <span className="text-content-secondary">
              {t('scan.found', { count: candidates.length, fresh: fresh.length })}
            </span>
            {fresh.length > 0 && (
              <button
                onClick={() =>
                  setSelected(allSelected ? new Set() : new Set(fresh.map((c) => c.path)))
                }
                className="text-brand hover:underline"
              >
                {allSelected ? t('scan.clearSelection') : t('scan.selectAll')}
              </button>
            )}
          </div>

          {candidates.length === 0 ? (
            <p className="rounded-xl border border-dashed border-surface-border py-8 text-center text-sm text-content-faint">
              {t('scan.none')}
            </p>
          ) : (
            <div className="flex max-h-72 flex-col gap-1.5 overflow-y-auto">
              {candidates.map((c) => {
                const already = isAdded(c.path)
                const isSel = selected.has(c.path) && !already
                return (
                  <button
                    key={c.path}
                    disabled={already}
                    onClick={() => toggle(c.path)}
                    className={cn(
                      'flex items-center gap-3 rounded-xl border px-3 py-2 text-left transition',
                      already
                        ? 'cursor-not-allowed border-surface-border bg-surface-bg opacity-50'
                        : isSel
                          ? 'border-brand/50 bg-brand/10'
                          : 'border-surface-border bg-surface-bg hover:bg-surface-hover'
                    )}
                  >
                    <span
                      className={cn(
                        'grid h-5 w-5 shrink-0 place-items-center rounded-md border',
                        isSel ? 'border-brand bg-brand text-onbrand' : 'border-surface-border'
                      )}
                    >
                      {isSel && <Check size={13} />}
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="truncate text-sm font-medium text-content-primary">
                          {c.name}
                        </span>
                        {c.gitUrl && <Github size={12} className="shrink-0 text-content-faint" />}
                        {already && (
                          <span className="shrink-0 text-[10px] text-content-faint">{t('scan.already')}</span>
                        )}
                      </span>
                      <span className="block truncate text-[11px] text-content-faint">{c.path}</span>
                    </span>

                    <span className="flex shrink-0 items-center gap-1.5">
                      <PackageManagerBadge pm={c.packageManager} tags={c.tags} />
                      {(c.tags || []).slice(0, 2).map((tag) => (
                        <TagBadge key={tag} label={tag} />
                      ))}
                    </span>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}

      <div className="mt-6 flex justify-end gap-2">
        <button
          onClick={onClose}
          className="rounded-xl px-4 py-2 text-sm font-medium text-content-secondary transition hover:bg-surface-hover"
        >
          {t('common.cancel')}
        </button>
        <button
          onClick={importSelected}
          disabled={selectedFresh.length === 0}
          className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-onbrand transition hover:brightness-110 disabled:opacity-50"
        >
          {selectedFresh.length > 0 ? t('scan.importN', { count: selectedFresh.length }) : t('common.add')}
        </button>
      </div>
    </Modal>
  )
}
