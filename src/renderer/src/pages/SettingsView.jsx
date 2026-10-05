import { useEffect, useState } from 'react'
import ImportModal from '../components/ImportModal.jsx'
import {
  Sun,
  Moon,
  Folder,
  Plus,
  Trash,
  Check,
  RefreshCw,
  Download,
  Upload,
  AlertTriangle
} from '../components/Icons.jsx'
import { cn, newId } from '../lib/utils.js'
import { ACCENT_LIST } from '../lib/theme.js'
import { LANGUAGES, useI18n, errorText } from '../lib/i18n.js'
import api from '../lib/api.js'
import useStore from '../store/useStore.js'

const inputCls =
  'w-full rounded-xl border border-surface-border bg-surface-bg px-3 py-2 text-sm text-content-primary placeholder:text-content-faint focus:border-brand/50 focus:outline-none focus:ring-2 focus:ring-brand/20'
const secondaryBtn =
  'flex shrink-0 items-center gap-2 rounded-xl border border-surface-border bg-surface-hover px-3 py-2 text-sm font-medium text-content-primary transition hover:border-brand/40 disabled:opacity-50'

function Section({ title, desc, children }) {
  return (
    <section className="rounded-2xl border border-surface-border bg-surface-card p-5">
      <h2 className="text-sm font-semibold text-content-primary">{title}</h2>
      {desc && <p className="mt-0.5 text-xs text-content-faint">{desc}</p>}
      <div className="mt-4">{children}</div>
    </section>
  )
}

function Toggle({ checked, onChange, label }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative h-6 w-11 shrink-0 rounded-full transition',
        checked ? 'bg-brand' : 'bg-surface-hover'
      )}
    >
      <span
        className={cn(
          'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all',
          checked ? 'left-[22px]' : 'left-0.5'
        )}
      />
    </button>
  )
}

function Row({ title, desc, children, first }) {
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-4',
        first ? 'py-1' : 'mt-3 border-t border-surface-border pt-3'
      )}
    >
      <div className="min-w-0">
        <div className="text-sm font-medium text-content-primary">{title}</div>
        {desc && <div className="text-xs text-content-faint">{desc}</div>}
      </div>
      {children}
    </div>
  )
}

export default function SettingsView({ onOpenProject }) {
  const settings = useStore((s) => s.settings)
  const projects = useStore((s) => s.projects)
  const missing = useStore((s) => s.missing)
  const updateSettings = useStore((s) => s.updateSettings)
  const updateProject = useStore((s) => s.updateProject)
  const removeProject = useStore((s) => s.removeProject)
  const replaceAll = useStore((s) => s.replaceAll)
  const mergeData = useStore((s) => s.mergeData)
  const checkMissing = useStore((s) => s.checkMissing)
  const { t } = useI18n()

  const [dataPath, setDataPath] = useState('')
  const [version, setVersion] = useState('')
  const [shortcut, setShortcut] = useState(settings.globalShortcut || '')
  const [newEditor, setNewEditor] = useState({ label: '', command: '' })
  const [shortcutMsg, setShortcutMsg] = useState('')
  const [redetecting, setRedetecting] = useState(null) // null | { done, total }
  const [maintenanceMsg, setMaintenanceMsg] = useState('')
  const [backupMsg, setBackupMsg] = useState('')
  const [pendingImport, setPendingImport] = useState(null)

  useEffect(() => {
    api.getDataPath().then(setDataPath)
    api.getAppVersion?.().then(setVersion)
    checkMissing()
  }, [checkMissing])

  const editors = settings.editors || []
  const missingProjects = projects.filter((p) => missing[p.path])

  const pickRoot = async () => {
    const res = await api.selectFolder(settings.defaultRoot || '')
    if (res.ok) updateSettings({ defaultRoot: res.path })
  }

  const addEditor = () => {
    if (!newEditor.label.trim() || !newEditor.command.trim()) return
    updateSettings({
      editors: [...editors, { id: newId(), label: newEditor.label.trim(), command: newEditor.command.trim() }]
    })
    setNewEditor({ label: '', command: '' })
  }

  const removeEditor = (id) => {
    updateSettings({ editors: editors.filter((e) => e.id !== id) })
  }

  const applyShortcut = async () => {
    const res = await api.setGlobalShortcut(shortcut)
    if (res.ok) {
      updateSettings({ globalShortcut: shortcut })
      setShortcutMsg(shortcut ? t('settings.shortcutSaved') : t('settings.shortcutRemoved'))
    } else {
      setShortcutMsg(t('settings.shortcutFailed'))
    }
    setTimeout(() => setShortcutMsg(''), 3000)
  }

  const toggleAutoLaunch = async (val) => {
    updateSettings({ autoLaunch: val })
    await api.setAutoLaunch(val)
  }

  const toggleTray = async (val) => {
    updateSettings({ minimizeToTray: val })
    await api.setMinimizeToTray(val)
  }

  // Sequential on purpose: each re-detect walks a project tree, and running
  // them all at once would hammer the disk on a big list.
  const redetectAll = async () => {
    const targets = projects.filter((p) => p.path && !missing[p.path])
    setMaintenanceMsg('')
    setRedetecting({ done: 0, total: targets.length })
    let updated = 0
    for (const [i, p] of targets.entries()) {
      const res = await api.redetect(p.path, p.tags)
      if (res?.ok) {
        updateProject(p.id, res.data)
        updated++
      }
      setRedetecting({ done: i + 1, total: targets.length })
    }
    setRedetecting(null)
    setMaintenanceMsg(t('settings.redetectDone', { count: updated }))
  }

  const exportData = async () => {
    const { version: v, projects: ps, groups, settings: st } = useStore.getState()
    const res = await api.exportData({ version: v, projects: ps, groups, settings: st })
    if (res?.ok) setBackupMsg(t('settings.exported', { path: res.path }))
    else if (!res?.canceled) setBackupMsg(errorText(t, res?.error))
  }

  const importData = async () => {
    setBackupMsg('')
    const res = await api.importData()
    if (res?.ok) setPendingImport(res.data)
    else if (!res?.canceled) setBackupMsg(errorText(t, res?.error))
  }

  // After "replace everything", OS-level settings must follow the new data.
  const applyOsSettings = async (s) => {
    await api.setGlobalShortcut(s.globalShortcut || '')
    await api.setAutoLaunch(!!s.autoLaunch)
    await api.setMinimizeToTray(s.minimizeToTray !== false)
    setShortcut(s.globalShortcut || '')
  }

  const doMerge = async () => {
    const added = mergeData(pendingImport)
    setPendingImport(null)
    setBackupMsg(t('importModal.merged', { count: added }))
    checkMissing()
  }

  const doReplace = async () => {
    const data = pendingImport
    replaceAll(data)
    setPendingImport(null)
    await applyOsSettings(data.settings || {})
    setBackupMsg(t('importModal.replaced'))
    checkMissing()
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-3xl px-6 py-6">
        <h1 className="mb-5 text-2xl font-bold text-content-primary">{t('settings.title')}</h1>
        <div className="space-y-4">
          {/* Appearance */}
          <Section title={t('settings.appearance')} desc={t('settings.appearanceDesc')}>
            <div className="flex gap-2">
              {[
                { id: 'dark', label: t('settings.dark'), icon: Moon },
                { id: 'light', label: t('settings.light'), icon: Sun }
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => updateSettings({ theme: id })}
                  aria-pressed={settings.theme === id}
                  className={cn(
                    'flex flex-1 items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition',
                    settings.theme === id
                      ? 'border-brand/50 bg-brand/10 text-content-primary'
                      : 'border-surface-border text-content-secondary hover:bg-surface-hover'
                  )}
                >
                  <Icon size={16} /> {label}
                </button>
              ))}
            </div>

            <div className="mt-4">
              <label className="mb-2 block text-xs font-medium text-content-secondary">
                {t('settings.language')}
              </label>
              <div className="flex flex-wrap gap-2">
                {[{ id: 'auto', label: t('settings.languageAuto') }, ...LANGUAGES].map((l) => {
                  const active = (settings.language || 'auto') === l.id
                  return (
                    <button
                      key={l.id}
                      onClick={() => updateSettings({ language: l.id })}
                      aria-pressed={active}
                      className={cn(
                        'rounded-xl border px-3 py-2 text-sm font-medium transition',
                        active
                          ? 'border-brand/50 bg-brand/10 text-content-primary'
                          : 'border-surface-border text-content-secondary hover:bg-surface-hover'
                      )}
                    >
                      {l.label}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="mt-4">
              <label className="mb-2 block text-xs font-medium text-content-secondary">
                {t('settings.accent')}
              </label>
              <div className="flex flex-wrap gap-2.5">
                {ACCENT_LIST.map((a) => {
                  const active = (settings.accent || 'indigo') === a.id
                  return (
                    <button
                      key={a.id}
                      title={t(`colors.${a.id}`)}
                      aria-label={t(`colors.${a.id}`)}
                      aria-pressed={active}
                      onClick={() => updateSettings({ accent: a.id })}
                      className={cn(
                        'grid h-8 w-8 place-items-center rounded-full ring-2 ring-offset-2 ring-offset-surface-card transition',
                        active ? 'ring-content-secondary' : 'ring-transparent hover:ring-surface-border'
                      )}
                      style={{ backgroundColor: a.swatch }}
                    >
                      {active && <Check size={16} className="text-[#151a23]" />}
                    </button>
                  )
                })}
              </div>
            </div>
          </Section>

          {/* Default root */}
          <Section title={t('settings.root')} desc={t('settings.rootDesc')}>
            <div className="flex gap-2">
              <input
                value={settings.defaultRoot || ''}
                onChange={(e) => updateSettings({ defaultRoot: e.target.value })}
                placeholder="C:\Projects"
                className={inputCls}
              />
              <button onClick={pickRoot} className={secondaryBtn}>
                <Folder size={16} /> {t('common.browse')}
              </button>
            </div>
          </Section>

          {/* Editors */}
          <Section title={t('settings.editors')} desc={t('settings.editorsDesc')}>
            <div className="mb-3">
              <label className="mb-1 block text-xs font-medium text-content-secondary">
                {t('settings.defaultEditor')}
              </label>
              <select
                value={settings.defaultEditor || ''}
                onChange={(e) => updateSettings({ defaultEditor: e.target.value })}
                className="w-full rounded-xl border border-surface-border bg-surface-bg px-3 py-2 text-sm text-content-primary focus:outline-none"
              >
                {editors.map((ed) => (
                  <option key={ed.id} value={ed.command}>
                    {ed.label} ({ed.command})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-2">
              {editors.map((ed) => (
                <div
                  key={ed.id}
                  className="flex items-center gap-3 rounded-xl border border-surface-border bg-surface-bg px-3 py-2 text-sm"
                >
                  <span className="font-medium text-content-primary">{ed.label}</span>
                  <span className="rounded-md bg-surface-hover px-1.5 py-0.5 font-mono text-xs text-content-secondary">
                    {ed.command}
                  </span>
                  <button
                    onClick={() => removeEditor(ed.id)}
                    title={t('settings.removeEditor')}
                    aria-label={t('settings.removeEditor')}
                    className="ml-auto grid h-7 w-7 place-items-center rounded-lg text-content-faint hover:text-rose-400"
                  >
                    <Trash size={14} />
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-3 flex gap-2">
              <input
                value={newEditor.label}
                onChange={(e) => setNewEditor((n) => ({ ...n, label: e.target.value }))}
                placeholder={t('settings.editorName')}
                className={inputCls}
              />
              <input
                value={newEditor.command}
                onChange={(e) => setNewEditor((n) => ({ ...n, command: e.target.value }))}
                placeholder={t('settings.editorCommand')}
                className={inputCls}
              />
              <button
                onClick={addEditor}
                title={t('common.add')}
                aria-label={t('common.add')}
                className="grid h-9 w-10 shrink-0 place-items-center rounded-xl bg-brand text-onbrand hover:brightness-110"
              >
                <Plus size={18} />
              </button>
            </div>
          </Section>

          {/* Startup + shortcut */}
          <Section title={t('settings.startup')}>
            <Row title={t('settings.tray')} desc={t('settings.trayDesc')} first>
              <Toggle
                checked={settings.minimizeToTray !== false}
                onChange={toggleTray}
                label={t('settings.tray')}
              />
            </Row>
            <Row title={t('settings.autoLaunch')} desc={t('settings.autoLaunchDesc')}>
              <Toggle checked={!!settings.autoLaunch} onChange={toggleAutoLaunch} label={t('settings.autoLaunch')} />
            </Row>

            <div className="mt-4 border-t border-surface-border pt-4">
              <label className="mb-1 block text-sm font-medium text-content-primary">
                {t('settings.shortcut')}
              </label>
              <p className="mb-2 text-xs text-content-faint">{t('settings.shortcutDesc')}</p>
              <div className="flex gap-2">
                <input
                  value={shortcut}
                  onChange={(e) => setShortcut(e.target.value)}
                  placeholder="CommandOrControl+Shift+P"
                  className={inputCls + ' font-mono'}
                />
                <button
                  onClick={applyShortcut}
                  className="flex shrink-0 items-center gap-2 rounded-xl bg-brand px-3 py-2 text-sm font-semibold text-onbrand hover:brightness-110"
                >
                  <Check size={16} /> {t('common.apply')}
                </button>
              </div>
              {shortcutMsg && <p className="mt-2 text-xs text-content-secondary">{shortcutMsg}</p>}
            </div>
          </Section>

          {/* Maintenance */}
          <Section title={t('settings.maintenance')} desc={t('settings.maintenanceDesc')}>
            {missingProjects.length === 0 ? (
              <p className="flex items-center gap-2 text-sm text-emerald-400">
                <Check size={16} /> {t('settings.missingNone')}
              </p>
            ) : (
              <div>
                <p className="mb-2 flex items-center gap-2 text-sm font-medium text-rose-400">
                  <AlertTriangle size={16} /> {t('settings.missingCount', { count: missingProjects.length })}
                </p>
                <div className="flex flex-col gap-1.5">
                  {missingProjects.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center gap-3 rounded-xl border border-surface-border bg-surface-bg px-3 py-2"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-content-primary">{p.name}</span>
                        <span className="block truncate text-[11px] text-content-faint">{p.path}</span>
                      </span>
                      <button
                        onClick={() => onOpenProject(p.id)}
                        className="shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-medium text-brand transition hover:bg-brand/10"
                      >
                        {t('detail.relocate')}
                      </button>
                      <button
                        onClick={() => removeProject(p.id)}
                        className="shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-medium text-content-secondary transition hover:bg-surface-hover hover:text-rose-400"
                      >
                        {t('common.remove')}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Row title={t('settings.redetectAll')} desc={t('settings.redetectAllDesc')}>
              <button onClick={redetectAll} disabled={!!redetecting} className={secondaryBtn}>
                <RefreshCw size={15} className={redetecting ? 'animate-spin' : ''} />
                {redetecting
                  ? t('settings.redetectProgress', redetecting)
                  : t('settings.redetectRun')}
              </button>
            </Row>
            {maintenanceMsg && (
              <p className="mt-2 text-xs text-content-secondary" role="status">
                {maintenanceMsg}
              </p>
            )}
          </Section>

          {/* Backup */}
          <Section title={t('settings.backup')}>
            <Row title={t('settings.export')} desc={t('settings.exportDesc')} first>
              <button onClick={exportData} className={secondaryBtn}>
                <Download size={15} /> {t('settings.export')}
              </button>
            </Row>
            <Row title={t('settings.import')} desc={t('settings.importDesc')}>
              <button onClick={importData} className={secondaryBtn}>
                <Upload size={15} /> {t('settings.import')}
              </button>
            </Row>
            {backupMsg && (
              <p className="mt-3 break-all text-xs text-content-secondary" role="status">
                {backupMsg}
              </p>
            )}
          </Section>

          {/* About */}
          <Section title={t('settings.about')} desc={t('settings.aboutDesc')}>
            <div className="flex items-center justify-between rounded-xl border border-surface-border bg-surface-bg px-3 py-2">
              <span className="text-sm text-content-secondary">{t('settings.version')}</span>
              <span className="font-mono text-sm font-medium text-content-primary">v{version || '…'}</span>
            </div>

            <div className="mt-2">
              <div className="mb-1 text-xs font-medium text-content-secondary">{t('settings.dataFile')}</div>
              <div className="break-all rounded-xl border border-surface-border bg-surface-bg px-3 py-2 font-mono text-xs text-content-secondary">
                {dataPath || '…'}
              </div>
              <p className="mt-1.5 text-[11px] text-content-faint">{t('settings.backupNote')}</p>
            </div>
          </Section>
        </div>
      </div>

      {pendingImport && (
        <ImportModal
          data={pendingImport}
          onMerge={doMerge}
          onReplace={doReplace}
          onClose={() => setPendingImport(null)}
        />
      )}
    </div>
  )
}
