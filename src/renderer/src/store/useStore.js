import { create } from 'zustand'
import api from '../lib/api.js'
import { newId, samePath } from '../lib/utils.js'
import { applyTheme } from '../lib/theme.js'

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

  // ---- backup import ----
  // Replace everything with an imported backup (the main process keeps the
  // previous file as .bak on the next save).
  replaceAll: (data) => {
    set({
      projects: data.projects || [],
      groups: data.groups || [],
      settings: data.settings || {},
      version: data.version || get().version
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

    const added = (data.projects || [])
      .filter((p) => p.path && !projects.some((q) => samePath(q.path, p.path)))
      .map((p) => ({
        ...p,
        id: knownIds.has(p.id) ? newId() : p.id,
        groupId: allGroups.has(p.groupId) ? p.groupId : null
      }))

    set({ projects: [...added, ...projects], groups: [...groups, ...newGroups] })
    schedulePersist(get)
    return added.length
  },

  // ---- settings ----
  updateSettings: (patch) => {
    set((s) => ({ settings: { ...s.settings, ...patch } }))
    if ('theme' in patch || 'accent' in patch) applyTheme(get().settings)
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

  removeProject: (id) => {
    set((s) => ({ projects: s.projects.filter((p) => p.id !== id) }))
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
    set((s) => ({
      projects: s.projects.map((p) =>
        p.id === projectId
          ? { ...p, todos: p.todos.filter((t) => t.id !== todoId) }
          : p
      )
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
  }
}))

export default useStore
