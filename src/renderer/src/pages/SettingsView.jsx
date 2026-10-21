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
import { cn, newId, relativeTime, formatDate } from '../lib/utils.js'
import { ACCENT_LIST, STYLES } from '../lib/theme.js'
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

// A tiny drawing of two project cards in each style, rendered with inline
// styles so every preview looks right whichever style is active.
const PREVIEW = {
  classic: {
    box: {},
    card: { borderRadius: 7, border: '1px solid rgb(var(--c-border))', background: 'rgb(var(--c-card))', boxShadow: '0 1px 3px rgb(0 0 0 / 0.15)' },
    strip: true,
    chip: { borderRadius: 3 }
  },
  minimal: {
    box: {},
    card: { borderRadius: 3, border: '1px solid rgb(var(--c-border))', background: 'rgb(var(--c-card))' },
    chip: { borderRadius: 2, background: 'transparent', boxShadow: 'inset 0 0 0 1px rgb(var(--c-border))' }
  },
  glass: {
    box: {
      background:
        'radial-gradient(120px 60px at 10% 0%, rgb(var(--c-brand) / 0.45), transparent 70%), radial-gradient(100px 70px at 100% 100%, rgb(var(--c-brand) / 0.25), transparent 70%), rgb(var(--c-bg))'
    },
    card: { borderRadius: 9, border: '1px solid rgb(255 255 255 / 0.12)', background: 'rgb(var(--c-card) / 0.45)', boxShadow: '0 6px 14px rgb(0 0 0 / 0.25)' },
    chip: { borderRadius: 4 }
  },
  soft: {
    box: {},
    card: { borderRadius: 12, background: 'color-mix(in srgb, rgb(var(--c-brand)) 16%, rgb(var(--c-card)))', boxShadow: '0 3px 10px rgb(0 0 0 / 0.12)' },
    second: { background: 'color-mix(in srgb, #86efac 16%, rgb(var(--c-card)))' },
    chip: { borderRadius: 9999 }
  }
}

function StylePreview({ id }) {
  const p = PREVIEW[id]
  const chip = {
    height: 5,
    width: 16,
    background: 'rgb(var(--c-brand) / 0.35)',
    ...p.chip
  }
  return (
    <div className="flex h-16 items-center gap-1.5 rounded-lg bg-surface-bg px-2" style={p.box}>
      {[0, 1].map((i) => (
        <div
          key={i}
          className="relative flex h-11 flex-1 flex-col justify-center gap-1 overflow-hidden px-2"
          style={{ ...p.card, ...(i === 1 ? p.second : null) }}
        >
          {p.strip && (
            <span className="absolute inset-y-0 left-0 w-[3px]" style={{ background: i ? '#86efac' : 'rgb(var(--c-brand))' }} />
          )}
          <span className="h-1.5 w-3/4 rounded-full bg-content-secondary/60" />
          <span className="flex gap-1">
            <span style={chip} />
            <span style={{ ...chip, background: 'rgb(134 239 172 / 0.4)' }} />
          </span>
        </div>
      ))}
    </div>
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
  const update = useStore((s) => s.update)
  const checkUpdate = useStore((s) => s.checkUpdate)
  const { t, lang } = useI18n()
  const [checking, setChecking] = useState(false)

  const [dataPath, setDataPath] = useState('')
  const [version, setVersion] = useState('')
  const [isStore, setIsStore] = useState(false)
  const [shortcut, setShortcut] = useState(settings.globalShortcut || '')
  const [newEditor, setNewEditor] = useState({ label: '', command: '' })
  const [shortcutMsg, setShortcutMsg] = useState('')
  const [redetecting, setRedetecting] = useState(null) // null | { done, total }
  const [maintenanceMsg, setMaintenanceMsg] = useState('')
  const [backupMsg, setBackupMsg] = useState('')
  const [pendingImport, setPendingImport] = useState(null)
  const [snapshots, setSnapshots] = useState([])

  useEffect(() => {
    api.getDataPath().then(setDataPath)
    api.listBackups().then(setSnapshots)
    api.getAppInfo().then((info) => {
      setVersion(info.version)
      setIsStore(info.store)
    })
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

  const restoreSnapshot = async (name) => {
    setBackupMsg('')
    const res = await api.readBackup(name)
    if (res?.ok) setPendingImport(res.data)
    else setBackupMsg(errorText(t, res?.error))
  }

  // "2026-10-21" -> local midnight, so the shown day never shifts by timezone.
  const snapshotDay = (date) => {
    const [y, m, d] = date.split('-').map(Number)
    return formatDate(new Date(y, m - 1, d).getTime(), lang)
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
                {t('settings.style')}
              </label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {STYLES.map((id) => {
                  const active = (settings.style || 'classic') === id
                  return (
                    <button
                      key={id}
                      onClick={() => updateSettings({ style: id })}
                      aria-pressed={active}
                      className={cn(
                        'flex flex-col gap-2 rounded-xl border p-2 text-left transition',
                        active
                          ? 'border-brand/60 bg-brand/10 ring-1 ring-brand/30'
                          : 'border-surface-border hover:bg-surface-hover'
                      )}
                    >
                      <StylePreview id={id} />
                      <span className="px-0.5">
                        <span className="block text-sm font-medium text-content-primary">
                          {t(`settings.styles.${id}.name`)}
                        </span>
                        <span className="block text-[11px] leading-snug text-content-faint">
                          {t(`settings.styles.${id}.desc`)}
                        </span>
                      </span>
                    </button>
                  )
                })}
              </div>
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
            {isStore ? (
              <Row title={t('settings.autoLaunch')} desc={t('settings.autoLaunchStoreDesc')}>
                <button onClick={() => api.openStartupSettings()} className={secondaryBtn}>
                  {t('settings.openStartupSettings')}
                </button>
              </Row>
            ) : (
              <Row title={t('settings.autoLaunch')} desc={t('settings.autoLaunchDesc')}>
                <Toggle checked={!!settings.autoLaunch} onChange={toggleAutoLaunch} label={t('settings.autoLaunch')} />
              </Row>
            )}

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
            <Row title={t('settings.snapshots')} desc={t('settings.snapshotsDesc')} />
            {snapshots.length === 0 ? (
              <p className="mt-2 text-xs text-content-faint">{t('settings.snapshotsNone')}</p>
            ) : (
              <div className="mt-2 flex flex-col gap-1.5">
                {snapshots.map((s) => (
                  <div
                    key={s.name}
                    className="flex items-center gap-3 rounded-xl border border-surface-border bg-surface-bg px-3 py-2"
                  >
                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-content-primary">
                      {snapshotDay(s.date)}
                    </span>
                    <span className="shrink-0 text-xs text-content-faint">
                      {t('nav.projectCount', { count: s.projects })}
                    </span>
                    <button
                      onClick={() => restoreSnapshot(s.name)}
                      className="shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-medium text-brand transition hover:bg-brand/10"
                    >
                      {t('settings.snapshotRestore')}
                    </button>
                  </div>
                ))}
              </div>
            )}
            {backupMsg && (
              <p className="mt-3 break-all text-xs text-content-secondary" role="status">
                {backupMsg}
              </p>
            )}
          </Section>

          {/* Updates */}
          <Section title={t('settings.updates')}>
            {isStore ? (
              <p className="text-sm text-content-secondary">{t('settings.updatesStore')}</p>
            ) : (
              <>
                <Row
                  first
                  title={
                    checking
                      ? t('settings.updateChecking')
                      : !update
                        ? t('settings.updateNever')
                        : !update.ok
                          ? t('settings.updateFailed')
                          : update.newer
                            ? t('settings.updateAvailable', { latest: update.latest, current: update.current })
                            : t('settings.updateUpToDate', { version: update.current })
                  }
                  desc={
                    update && !checking
                      ? t('settings.updateLastChecked', { time: relativeTime(update.checkedAt, lang) })
                      : null
                  }
                >
                  <div className="flex shrink-0 gap-2">
                    {update?.newer && !checking && (
                      <button
                        onClick={() => api.openExternal(update.url)}
                        className="flex shrink-0 items-center gap-2 rounded-xl bg-brand px-3 py-2 text-sm font-semibold text-onbrand hover:brightness-110"
                      >
                        <Download size={15} /> {t('settings.updateDownload')}
                      </button>
                    )}
                    <button
                      onClick={async () => {
                        setChecking(true)
                        await checkUpdate()
                        setChecking(false)
                      }}
                      disabled={checking}
                      className={secondaryBtn}
                    >
                      <RefreshCw size={15} className={checking ? 'animate-spin' : ''} />
                      {t('settings.updateCheck')}
                    </button>
                  </div>
                </Row>
                <Row title={t('settings.updateAuto')} desc={t('settings.updateAutoDesc')}>
                  <Toggle
                    checked={!!settings.checkUpdates}
                    onChange={(v) => updateSettings({ checkUpdates: v })}
                    label={t('settings.updateAuto')}
                  />
                </Row>
              </>
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
