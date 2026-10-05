import { useState } from 'react'
import Modal from './Modal.jsx'
import PackageManagerBadge from './PackageManagerBadge.jsx'
import { Folder, Github, Plus } from './Icons.jsx'
import { samePath } from '../lib/utils.js'
import { useI18n } from '../lib/i18n.js'
import api from '../lib/api.js'
import useStore from '../store/useStore.js'

const inputCls =
  'w-full rounded-xl border border-surface-border bg-surface-bg px-3 py-2 text-sm text-content-primary placeholder:text-content-faint focus:border-brand/50 focus:outline-none focus:ring-2 focus:ring-brand/20'
const labelCls = 'mb-1 block text-xs font-medium text-content-secondary'

export default function AddProjectModal({ onClose, onCreated }) {
  const addProject = useStore((s) => s.addProject)
  const projects = useStore((s) => s.projects)
  const settings = useStore((s) => s.settings)
  const { t } = useI18n()

  const [form, setForm] = useState({
    path: '',
    name: '',
    description: '',
    gitUrl: '',
    tags: '',
    languages: [],
    frameworks: [],
    packageManager: '',
    lastModified: Date.now()
  })
  const [busy, setBusy] = useState(false)
  const [inspected, setInspected] = useState(false)

  const set = (patch) => setForm((f) => ({ ...f, ...patch }))

  const pickFolder = async () => {
    setBusy(true)
    try {
      const res = await api.selectFolder(settings.defaultRoot || '')
      if (!res.ok) return
      const inspect = await api.inspectFolder(res.path)
      const folderName = res.path.split(/[\\/]/).pop()
      if (inspect.ok) {
        const d = inspect.data
        set({
          path: res.path,
          name: d.name || folderName,
          description: d.description || '',
          gitUrl: d.gitUrl || '',
          tags: (d.tags || []).join(', '),
          languages: d.languages || [],
          frameworks: d.frameworks || [],
          packageManager: d.packageManager || '',
          lastModified: d.lastModified || Date.now()
        })
      } else {
        set({ path: res.path, name: folderName })
      }
      setInspected(true)
    } finally {
      setBusy(false)
    }
  }

  const save = () => {
    if (!form.path) return alert(t('addModal.chooseFirst'))
    if (projects.some((p) => samePath(p.path, form.path))) return alert(t('addModal.alreadyAdded'))
    const tags = form.tags
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean)
    const project = addProject({ ...form, tags })
    onCreated?.(project)
    onClose()
  }

  return (
    <Modal title={t('addModal.title')} onClose={onClose}>
      <div className="space-y-4">
        <div>
          <label className={labelCls}>{t('addModal.folder')}</label>
          <div className="flex gap-2">
            <input
              value={form.path}
              onChange={(e) => set({ path: e.target.value })}
              placeholder={t('addModal.folderPlaceholder')}
              className={inputCls}
            />
            <button
              onClick={pickFolder}
              disabled={busy}
              className="flex shrink-0 items-center gap-2 rounded-xl border border-surface-border bg-surface-hover px-3 py-2 text-sm font-medium text-content-primary transition hover:border-brand/40 disabled:opacity-50"
            >
              <Folder size={16} /> {busy ? '…' : t('common.browse')}
            </button>
          </div>
          {inspected && (
            <div className="mt-1.5 flex items-center gap-2">
              <p className="text-[11px] text-emerald-400">{t('addModal.inspected')}</p>
              <PackageManagerBadge pm={form.packageManager} />
            </div>
          )}
        </div>

        <div>
          <label className={labelCls}>{t('addModal.name')}</label>
          <input value={form.name} onChange={(e) => set({ name: e.target.value })} className={inputCls} />
        </div>

        <div>
          <label className={labelCls}>{t('addModal.description')}</label>
          <textarea
            value={form.description}
            onChange={(e) => set({ description: e.target.value })}
            rows={2}
            className={inputCls + ' resize-none'}
          />
        </div>

        <div>
          <label className={labelCls}>
            <span className="inline-flex items-center gap-1.5">
              <Github size={13} /> {t('addModal.remote')}
            </span>
          </label>
          <input
            value={form.gitUrl}
            onChange={(e) => set({ gitUrl: e.target.value })}
            placeholder={t('addModal.remotePlaceholder')}
            className={inputCls}
          />
        </div>

        <div>
          <label className={labelCls}>{t('addModal.tags')}</label>
          <input
            value={form.tags}
            onChange={(e) => set({ tags: e.target.value })}
            placeholder="React, TypeScript, CLI"
            className={inputCls}
          />
        </div>
      </div>

      <div className="mt-6 flex justify-end gap-2">
        <button
          onClick={onClose}
          className="rounded-xl px-4 py-2 text-sm font-medium text-content-secondary transition hover:bg-surface-hover"
        >
          {t('common.cancel')}
        </button>
        <button
          onClick={save}
          className="flex items-center gap-2 rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-onbrand transition hover:brightness-110"
        >
          <Plus size={16} /> {t('common.add')}
        </button>
      </div>
    </Modal>
  )
}
