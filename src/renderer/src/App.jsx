import { useCallback, useEffect, useMemo, useState } from 'react'
import Sidebar from './components/Sidebar.jsx'
import TitleBar from './components/TitleBar.jsx'
import HomeView from './pages/HomeView.jsx'
import ProjectDetail from './pages/ProjectDetail.jsx'
import SettingsView from './pages/SettingsView.jsx'
import TasksView from './pages/TasksView.jsx'
import AddProjectModal from './components/AddProjectModal.jsx'
import CommandPalette from './components/CommandPalette.jsx'
import ScanModal from './components/ScanModal.jsx'
import GroupModal from './components/GroupModal.jsx'
import DialogHost from './components/DialogHost.jsx'
import UndoToast from './components/UndoToast.jsx'
import { Folder } from './components/Icons.jsx'
import { todoProgress, samePath } from './lib/utils.js'
import { projectColorHex, groupColorHex } from './lib/groups.js'
import { useI18n } from './lib/i18n.js'
import { refreshGitStatuses } from './lib/useGitStatus.js'
import api from './lib/api.js'
import useStore from './store/useStore.js'

export default function App() {
  const init = useStore((s) => s.init)
  const loaded = useStore((s) => s.loaded)
  const projects = useStore((s) => s.projects)
  const addProject = useStore((s) => s.addProject)
  const checkMissing = useStore((s) => s.checkMissing)
  const { t, lang } = useI18n()

  // Simple in-memory router: { name: 'home'|'detail'|'tasks'|'settings', projectId }
  // Simple in-memory router with back/forward history (title bar arrows,
  // Alt+←/→, mouse back/forward buttons).
  const [hist, setHist] = useState({ stack: [{ name: 'home' }], index: 0 })
  const route = hist.stack[hist.index]
  const setRoute = useCallback((next) => {
    setHist((h) => {
      const cur = h.stack[h.index]
      if (cur.name === next.name && cur.projectId === next.projectId) return h
      const stack = [...h.stack.slice(0, h.index + 1), next].slice(-50)
      return { stack, index: stack.length - 1 }
    })
  }, [])
  const goBack = useCallback(() => setHist((h) => (h.index > 0 ? { ...h, index: h.index - 1 } : h)), [])
  const goForward = useCallback(
    () => setHist((h) => (h.index < h.stack.length - 1 ? { ...h, index: h.index + 1 } : h)),
    []
  )
  const [filter, setFilter] = useState('all') // 'all' | 'favorites' | 'group:<id>'
  const [adding, setAdding] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [groupModal, setGroupModal] = useState(null) // null | { group } | { group: null }
  const [dropping, setDropping] = useState(false)

  const modalOpen = adding || scanning || paletteOpen || !!groupModal
  const openProject = useCallback((id) => setRoute({ name: 'detail', projectId: id }), [])

  useEffect(() => {
    init().then(() => useStore.getState().checkMissing())
  }, [init])

  // Window title (taskbar) and <html lang> follow the UI language.
  useEffect(() => {
    document.title = t('app.name')
    document.documentElement.lang = lang
  }, [t, lang])

  // Coming back to the window is the natural moment something changed on disk:
  // a commit made in the editor, a folder moved in Explorer.
  useEffect(() => {
    const onFocus = () => {
      refreshGitStatuses()
      checkMissing()
    }
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [checkMissing])

  // Opt-in automatic update check: shortly after start, then once a day
  // (the app can sit in the tray for days).
  const checkUpdates = useStore((s) => !!s.settings.checkUpdates)
  useEffect(() => {
    if (!loaded || !checkUpdates) return
    const check = () => useStore.getState().checkUpdate()
    const first = setTimeout(check, 5000)
    const daily = setInterval(check, 24 * 60 * 60 * 1000)
    return () => {
      clearTimeout(first)
      clearInterval(daily)
    }
  }, [loaded, checkUpdates])

  // The tray can launch a project directly; mirror that into open stats.
  useEffect(() => {
    if (!api.onProjectOpened) return
    return api.onProjectOpened((id) => useStore.getState().markOpened(id))
  }, [])

  // The global shortcut opens the palette, even when the app was in the tray.
  useEffect(() => {
    if (!api.onOpenPalette) return
    return api.onOpenPalette(() => setPaletteOpen(true))
  }, [])

  // Mouse back / forward buttons.
  useEffect(() => {
    const onMouse = (e) => {
      if (e.button === 3) goBack()
      else if (e.button === 4) goForward()
    }
    window.addEventListener('mouseup', onMouse)
    return () => window.removeEventListener('mouseup', onMouse)
  }, [goBack, goForward])

  // ---- global shortcuts ----
  useEffect(() => {
    const onKey = (e) => {
      const mod = e.ctrlKey || e.metaKey
      const key = e.key.toLowerCase()

      if (e.altKey && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
        e.preventDefault()
        return e.key === 'ArrowLeft' ? goBack() : goForward()
      }

      if (mod && key === 'k') {
        e.preventDefault()
        setPaletteOpen((v) => !v)
      } else if (mod && key === 'n') {
        e.preventDefault()
        setAdding(true)
      } else if (mod && key === 'f') {
        e.preventDefault()
        setRoute({ name: 'home' })
        setTimeout(() => window.dispatchEvent(new CustomEvent('pm:focus-search')), 0)
      } else if (e.key === 'Escape' && route.name !== 'home') {
        // Any open dialog (including ones owned by a page) handles Esc itself.
        if (modalOpen || document.querySelector('[role="dialog"]')) return
        setRoute({ name: 'home' })
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [modalOpen, route.name, setRoute, goBack, goForward])

  // ---- drag & drop folders onto the window ----
  const addFromPath = useCallback(
    async (path) => {
      if (useStore.getState().projects.some((p) => samePath(p.path, path))) return
      const res = await api.inspectFolder(path)
      if (!res.ok) return
      const d = res.data
      addProject({
        path,
        name: d.name,
        description: d.description,
        gitUrl: d.gitUrl,
        tags: d.tags,
        languages: d.languages,
        frameworks: d.frameworks,
        packageManager: d.packageManager,
        lastModified: d.lastModified
      })
    },
    [addProject]
  )

  useEffect(() => {
    if (!api.isElectron) return

    // Only react to real file drags — dragging a project card between groups
    // must not raise the folder-drop overlay.
    const isFileDrag = (e) => [...(e.dataTransfer?.types || [])].includes('Files')

    const onDragOver = (e) => {
      if (!isFileDrag(e)) return
      e.preventDefault()
      setDropping(true)
    }
    const onDragLeave = (e) => {
      if (e.relatedTarget === null) setDropping(false)
    }
    const onDrop = async (e) => {
      if (!isFileDrag(e)) return
      e.preventDefault()
      setDropping(false)
      const paths = [...(e.dataTransfer?.files || [])]
        .map((f) => api.getPathForFile(f))
        .filter(Boolean)
      for (const p of paths) await addFromPath(p)
      if (paths.length) setRoute({ name: 'home' })
    }

    window.addEventListener('dragover', onDragOver)
    window.addEventListener('dragleave', onDragLeave)
    window.addEventListener('drop', onDrop)
    return () => {
      window.removeEventListener('dragover', onDragOver)
      window.removeEventListener('dragleave', onDragLeave)
      window.removeEventListener('drop', onDrop)
    }
  }, [addFromPath])

  // Title bar location, e.g. "All projects › acme-dashboard".
  const groups = useStore((s) => s.groups)
  const crumbs = useMemo(() => {
    const goHome = () => setRoute({ name: 'home' })
    const group = filter.startsWith('group:') ? groups.find((g) => g.id === filter.slice(6)) : null
    const homeCrumb = {
      key: 'home',
      label: group ? group.name : filter === 'favorites' ? t('nav.favorites') : t('nav.all'),
      color: group ? groupColorHex(group.color) : null,
      onClick: goHome
    }
    if (route.name === 'tasks') return [{ key: 'tasks', label: t('nav.tasks') }]
    if (route.name === 'settings') return [{ key: 'settings', label: t('nav.settings') }]
    if (route.name === 'detail') {
      const p = projects.find((x) => x.id === route.projectId)
      return p ? [homeCrumb, { key: p.id, label: p.name, color: projectColorHex(p, groups) || null }] : [homeCrumb]
    }
    return [homeCrumb]
  }, [route, filter, groups, projects, t, setRoute])

  const counts = useMemo(
    () => ({
      all: projects.length,
      favorites: projects.filter((p) => p.favorite).length,
      openTodos: projects.reduce((sum, p) => sum + todoProgress(p).open, 0)
    }),
    [projects]
  )

  if (!loaded) {
    return (
      <div className="grid h-full place-items-center text-content-faint">
        <div className="animate-pulse text-sm">{t('common.loading')}</div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <TitleBar
        crumbs={crumbs}
        canBack={hist.index > 0}
        canForward={hist.index < hist.stack.length - 1}
        onBack={goBack}
        onForward={goForward}
      />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          view={route.name}
          filter={filter}
          setFilter={setFilter}
          goHome={() => setRoute({ name: 'home' })}
          goTasks={() => setRoute({ name: 'tasks' })}
          goSettings={() => setRoute({ name: 'settings' })}
          onAdd={() => setAdding(true)}
          onNewGroup={() => setGroupModal({ group: null })}
          onEditGroup={(g) => setGroupModal({ group: g })}
          counts={counts}
        />

        <main className="flex-1 overflow-hidden bg-surface-bg">
          {route.name === 'home' && (
            <HomeView
              filter={filter}
              onOpenProject={openProject}
              onAdd={() => setAdding(true)}
              onScan={() => setScanning(true)}
              keyboardActive={!modalOpen}
            />
          )}
          {route.name === 'detail' && (
            <ProjectDetail
              projectId={route.projectId}
              onBack={() => setRoute({ name: 'home' })}
              onOpenProject={openProject}
            />
          )}
          {route.name === 'tasks' && <TasksView onOpenProject={openProject} />}
          {route.name === 'settings' && <SettingsView onOpenProject={openProject} />}
        </main>
      </div>

      {adding && <AddProjectModal onClose={() => setAdding(false)} onCreated={(p) => openProject(p.id)} />}

      {scanning && (
        <ScanModal onClose={() => setScanning(false)} onImported={() => setRoute({ name: 'home' })} />
      )}

      {groupModal && <GroupModal group={groupModal.group} onClose={() => setGroupModal(null)} />}

      <UndoToast />
      <DialogHost />

      {paletteOpen && (
        <CommandPalette
          onClose={() => setPaletteOpen(false)}
          onOpenProject={openProject}
          onGoSettings={() => setRoute({ name: 'settings' })}
          onGoTasks={() => setRoute({ name: 'tasks' })}
          onAdd={() => setAdding(true)}
          onScan={() => setScanning(true)}
        />
      )}

      {dropping && (
        <div className="pointer-events-none fixed inset-0 z-[60] grid place-items-center bg-black/50 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-brand/60 bg-surface-card px-10 py-8">
            <Folder size={32} className="text-brand" />
            <p className="text-sm font-semibold text-content-primary">{t('drop.title')}</p>
            <p className="text-xs text-content-faint">{t('drop.body')}</p>
          </div>
        </div>
      )}
    </div>
  )
}
