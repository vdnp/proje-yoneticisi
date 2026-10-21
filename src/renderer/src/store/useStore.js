import { create } from 'zustand'
import api from '../lib/api.js'
import { newId, samePath } from '../lib/utils.js'
import { applyTheme } from '../lib/theme.js'
import { sanitizeLinks, linkAll, unlinkPair } from '../../../shared/links.js'

// Debounced persistence: any mutation calls persist(), which batches writes
// to the backend (JSON file in Electron, localStorage in the browser).
let saveTimer = null
function schedulePersist(get) {
  clearTimeout(saveTimer)
  saveTimer = setTimeout(() => {
    const { version, projects, groups, settings } = get()
    api.saveData({ version, projects, groups, settings })
  }, 300)
}

const useStore = create((set, get) => ({
  loaded: false,
  // Carried through from the file the main process hydrated (and migrated),
  // so persisting never rewinds the schema version.
  version: 1,
  projects: [],
  groups: [],
  settings: {},
  // path -> true for projects whose folder can't be found. Derived from the
  // disk on load / window focus, never persisted.
  missing: {},
  // Result of the last update check ({ ok, latest, newer, url, error,
  // checkedAt }) or null. Never persisted.
  update: null,
  // The last removal, for the undo toast: { kind: 'projects', items:
  // [{ project, index }] } or { kind: 'todo', projectId, todo, index }.
  // Only the newest one can be undone. Never persisted.
  lastRemoved: null,

  // ---- lifecycle ----
  init: async () => {
    const data = await api.loadData()
    set({
      version: data.version || 1,
      projects: data.projects || [],
      groups: data.groups || [],
      settings: data.settings || {},
      loaded: true
    })
    applyTheme(data.settings || {})
  },

  checkMissing: async () => {
    const paths = get()
      .projects.map((p) => p.path)
      .filter(Boolean)
    if (!paths.length) return set({ missing: {} })
    const exists = await api.checkPaths(paths)
    const missing = {}
    for (const p of paths) if (exists[p] === false) missing[p] = true
    set({ missing })
  },

  checkUpdate: async () => {
    const res = await api.checkUpdate()
    set({ update: { ...res, checkedAt: Date.now() } })
    return res
  },

  // ---- backup import ----
  // Replace everything with an imported backup (the main process keeps the
  // previous file as .bak on the next save).
  replaceAll: (data) => {
    set({
      projects: data.projects || [],
      groups: data.groups || [],
      settings: data.settings || {},
      version: data.version || get().version,
      lastRemoved: null
    })
    applyTheme(get().settings)
    schedulePersist(get)
  },

  // Add only what isn't here yet: projects by folder path, groups by id.
  // Returns how many projects were added.
  mergeData: (data) => {
    const { projects, groups } = get()
    const knownGroups = new Set(groups.map((g) => g.id))
    const newGroups = (data.groups || []).filter((g) => !knownGroups.has(g.id))
    const allGroups = new Set([...knownGroups, ...newGroups.map((g) => g.id)])
    const knownIds = new Set(projects.map((p) => p.id))

    // Imported ids can change (clash) or point at a project that is already
    // here under another id (same folder); links follow either way.
    const idMap = new Map()
    const added = []
    for (const p of data.projects || []) {
      if (!p.path) continue
      const existing = projects.find((q) => samePath(q.path, p.path))
      if (existing) {
        idMap.set(p.id, existing.id)
        continue
      }
      const id = knownIds.has(p.id) ? newId() : p.id
      idMap.set(p.id, id)
      added.push({ ...p, id, groupId: allGroups.has(p.groupId) ? p.groupId : null })
    }
    for (const p of added) p.links = (p.links || []).map((id) => idMap.get(id) || id)

    set({
      projects: sanitizeLinks([...added, ...projects]),
      groups: [...groups, ...newGroups]
    })
    schedulePersist(get)
    return added.length
  },

  // ---- settings ----
  updateSettings: (patch) => {
    set((s) => ({ settings: { ...s.settings, ...patch } }))
    if ('theme' in patch || 'accent' in patch || 'style' in patch) applyTheme(get().settings)
    schedulePersist(get)
  },

  // ---- groups ----
  addGroup: (name, color) => {
    const group = { id: newId(), name: name.trim() || 'group', color: color || 'indigo' }
    set((s) => ({ groups: [...s.groups, group] }))
    schedulePersist(get)
    return group
  },

  updateGroup: (id, patch) => {
    set((s) => ({ groups: s.groups.map((g) => (g.id === id ? { ...g, ...patch } : g)) }))
    schedulePersist(get)
  },

  // Deleting a group never deletes its projects — they just become ungrouped.
  removeGroup: (id) => {
    set((s) => ({
      groups: s.groups.filter((g) => g.id !== id),
      projects: s.projects.map((p) => (p.groupId === id ? { ...p, groupId: null } : p))
    }))
    schedulePersist(get)
  },

  setProjectGroup: (projectId, groupId) => {
    set((s) => ({
      projects: s.projects.map((p) => (p.id === projectId ? { ...p, groupId } : p))
    }))
    schedulePersist(get)
  },

  // ---- projects: CRUD ----
  addProject: (partial) => {
    const project = {
      id: newId(),
      name: partial.name || 'project',
      description: partial.description || '',
      path: partial.path || '',
      gitUrl: partial.gitUrl || '',
      tags: partial.tags || [],
      languages: partial.languages || [],
      frameworks: partial.frameworks || [],
      packageManager: partial.packageManager || '',
      favorite: false,
      pinned: false,
      groupId: partial.groupId ?? null,
      color: partial.color || '',
      editorCommand: '',
      links: [],
      startScript: '',
      order: null,
      notes: '',
      todos: [],
      lastModified: partial.lastModified || Date.now(),
      lastOpenedAt: null,
      openCount: 0,
      createdAt: Date.now()
    }
    set((s) => ({ projects: [project, ...s.projects] }))
    schedulePersist(get)
    return project
  },

  updateProject: (id, patch) => {
    set((s) => ({
      projects: s.projects.map((p) => (p.id === id ? { ...p, ...patch } : p))
    }))
    schedulePersist(get)
  },

  removeProject: (id) => get().removeProjects([id]),

  // The removed projects are kept as they were, links included, so undo()
  // can put them back in place and relink the other side.
  removeProjects: (ids) => {
    const gone = new Set(ids)
    const { projects } = get()
    const items = projects.flatMap((project, index) => (gone.has(project.id) ? [{ project, index }] : []))
    if (!items.length) return
    set({
      projects: sanitizeLinks(projects.filter((p) => !gone.has(p.id))),
      lastRemoved: { kind: 'projects', items }
    })
    schedulePersist(get)
  },

  // ---- several projects at once (bulk selection) ----
  updateProjects: (ids, patch) => {
    const set_ = new Set(ids)
    set((s) => ({ projects: s.projects.map((p) => (set_.has(p.id) ? { ...p, ...patch } : p)) }))
    schedulePersist(get)
  },

  addTag: (ids, tag) => {
    const clean = tag.trim()
    if (!clean) return
    const set_ = new Set(ids)
    set((s) => ({
      projects: s.projects.map((p) =>
        set_.has(p.id) && !(p.tags || []).includes(clean) ? { ...p, tags: [...(p.tags || []), clean] } : p
      )
    }))
    schedulePersist(get)
  },

  // ---- links ----
  linkProjects: (ids) => {
    if (ids.length < 2) return
    set((s) => ({ projects: linkAll(s.projects, ids) }))
    schedulePersist(get)
  },

  unlinkProjects: (a, b) => {
    set((s) => ({ projects: unlinkPair(s.projects, a, b) }))
    schedulePersist(get)
  },

  // ---- custom order ----
  // `orderedIds` is the full list in its new order.
  setOrder: (orderedIds) => {
    const pos = new Map(orderedIds.map((id, i) => [id, i]))
    set((s) => ({
      projects: s.projects.map((p) => (pos.has(p.id) ? { ...p, order: pos.get(p.id) } : p))
    }))
    schedulePersist(get)
  },

  toggleFavorite: (id) => {
    set((s) => ({
      projects: s.projects.map((p) => (p.id === id ? { ...p, favorite: !p.favorite } : p))
    }))
    schedulePersist(get)
  },

  togglePin: (id) => {
    set((s) => ({
      projects: s.projects.map((p) => (p.id === id ? { ...p, pinned: !p.pinned } : p))
    }))
    schedulePersist(get)
  },

  // Bump open stats (called by editor/explorer/github actions).
  markOpened: (id) => {
    set((s) => ({
      projects: s.projects.map((p) =>
        p.id === id
          ? { ...p, lastOpenedAt: Date.now(), openCount: (p.openCount || 0) + 1 }
          : p
      )
    }))
    schedulePersist(get)
  },

  // ---- todos ----
  addTodo: (projectId, text) => {
    if (!text.trim()) return
    const todo = { id: newId(), text: text.trim(), done: false }
    set((s) => ({
      projects: s.projects.map((p) =>
        p.id === projectId ? { ...p, todos: [...(p.todos || []), todo] } : p
      )
    }))
    schedulePersist(get)
  },

  toggleTodo: (projectId, todoId) => {
    set((s) => ({
      projects: s.projects.map((p) =>
        p.id === projectId
          ? {
              ...p,
              todos: p.todos.map((t) =>
                t.id === todoId ? { ...t, done: !t.done } : t
              )
            }
          : p
      )
    }))
    schedulePersist(get)
  },

  updateTodo: (projectId, todoId, text) => {
    set((s) => ({
      projects: s.projects.map((p) =>
        p.id === projectId
          ? { ...p, todos: p.todos.map((t) => (t.id === todoId ? { ...t, text } : t)) }
          : p
      )
    }))
    schedulePersist(get)
  },

  removeTodo: (projectId, todoId) => {
    const todos = get().projects.find((p) => p.id === projectId)?.todos || []
    const index = todos.findIndex((t) => t.id === todoId)
    if (index < 0) return
    set((s) => ({
      projects: s.projects.map((p) =>
        p.id === projectId
          ? { ...p, todos: p.todos.filter((t) => t.id !== todoId) }
          : p
      ),
      lastRemoved: { kind: 'todo', projectId, todo: todos[index], index }
    }))
    schedulePersist(get)
  },

  moveTodo: (projectId, todoId, dir) => {
    set((s) => ({
      projects: s.projects.map((p) => {
        if (p.id !== projectId) return p
        const todos = [...p.todos]
        const i = todos.findIndex((t) => t.id === todoId)
        const j = i + dir
        if (i < 0 || j < 0 || j >= todos.length) return p
        ;[todos[i], todos[j]] = [todos[j], todos[i]]
        return { ...p, todos }
      })
    }))
    schedulePersist(get)
  },

  // ---- undo ----
  // Puts back exactly what the last removal took, at its old position.
  // Anything that came back another way meanwhile (same id, or a project
  // re-added from the same folder) is not duplicated.
  undo: () => {
    const r = get().lastRemoved
    if (!r) return
    if (r.kind === 'projects') {
      const projects = [...get().projects]
      const groupIds = new Set(get().groups.map((g) => g.id))
      // Ascending indexes, so each insert lands where it was before.
      for (const { project, index } of r.items) {
        if (projects.some((p) => p.id === project.id || (project.path && samePath(p.path, project.path)))) continue
        const groupId = groupIds.has(project.groupId) ? project.groupId : null
        projects.splice(Math.min(index, projects.length), 0, { ...project, groupId })
      }
      // The restored projects still list their links; sanitizeLinks adds
      // them back on the other side.
      set({ projects: sanitizeLinks(projects), lastRemoved: null })
    } else {
      set((s) => ({
        projects: s.projects.map((p) => {
          const todos = p.todos || []
          if (p.id !== r.projectId || todos.some((t) => t.id === r.todo.id)) return p
          return { ...p, todos: [...todos.slice(0, r.index), r.todo, ...todos.slice(r.index)] }
        }),
        lastRemoved: null
      }))
    }
    schedulePersist(get)
  },

  // The toast timed out: the removal is final. Ignored if a newer removal
  // has taken its place.
  dismissUndo: (removed) => {
    if (get().lastRemoved === removed) set({ lastRemoved: null })
  }
}))

export default useStore
