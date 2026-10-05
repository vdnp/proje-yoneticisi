// Data schema, defaults and migrations. Deliberately free of any Electron
// imports so it stays a pure, testable module.

export const DATA_VERSION = 3

export const DEFAULT_DATA = {
  version: DATA_VERSION,
  projects: [],
  groups: [], // { id, name, color }
  settings: {
    theme: 'dark', // 'dark' | 'light'
    language: 'auto', // 'auto' (follow the OS) | 'tr' | 'en'
    accent: 'indigo',
    minimizeToTray: true,
    defaultEditor: 'code-insiders',
    editors: [
      { id: 'code-insiders', label: 'VS Code Insiders', command: 'code-insiders' },
      { id: 'code', label: 'VS Code', command: 'code' },
      { id: 'cursor', label: 'Cursor', command: 'cursor' }
    ],
    defaultRoot: '',
    autoLaunch: false,
    globalShortcut: 'CommandOrControl+Shift+P',
    viewMode: 'grid'
  }
}

const str = (v, fallback = '') => (typeof v === 'string' ? v : fallback)
const arr = (v) => (Array.isArray(v) ? v : [])
const num = (v, fallback = null) => (typeof v === 'number' && Number.isFinite(v) ? v : fallback)

let seq = 0
const freshId = () => `${Date.now().toString(36)}_${(seq++).toString(36)}`

// Fill in anything a hand-edited file or an imported backup might be missing,
// so the UI never trips over `undefined.map`. Valid fields pass through as-is.
function normalizeProject(p) {
  return {
    ...p,
    id: str(p.id) || freshId(),
    name: str(p.name) || 'project',
    description: str(p.description),
    path: str(p.path),
    gitUrl: str(p.gitUrl),
    tags: arr(p.tags).filter((t) => typeof t === 'string'),
    languages: arr(p.languages).filter((t) => typeof t === 'string'),
    frameworks: arr(p.frameworks).filter((t) => typeof t === 'string'),
    packageManager: str(p.packageManager),
    favorite: !!p.favorite,
    pinned: !!p.pinned,
    groupId: str(p.groupId) || null,
    color: str(p.color),
    editorCommand: str(p.editorCommand),
    notes: str(p.notes),
    todos: arr(p.todos)
      .filter((t) => t && typeof t.text === 'string')
      .map((t) => ({ id: str(t.id) || freshId(), text: t.text, done: !!t.done })),
    lastModified: num(p.lastModified),
    lastOpenedAt: num(p.lastOpenedAt),
    openCount: num(p.openCount, 0),
    createdAt: num(p.createdAt, Date.now())
  }
}

function normalizeGroup(g) {
  return { id: str(g.id) || freshId(), name: str(g.name) || 'group', color: str(g.color, 'indigo') }
}

// Merge a file read off disk onto the current defaults, then run migrations.
// Existing keys always win over defaults, so the user's own choices survive;
// migrations only touch what they explicitly must.
export function hydrate(parsed) {
  const data = {
    ...DEFAULT_DATA,
    ...parsed,
    projects: arr(parsed.projects).filter((p) => p && typeof p === 'object').map(normalizeProject),
    groups: arr(parsed.groups).filter((g) => g && typeof g === 'object').map(normalizeGroup),
    settings: { ...DEFAULT_DATA.settings, ...(parsed.settings || {}) }
  }

  // v3: VS Code Insiders became the default editor. Older files already carry
  // an `editors` list (so the new entry cannot arrive via the defaults merge)
  // and their defaultEditor is the previous default, 'code'.
  if ((parsed.version || 1) < 3) {
    const s = data.settings
    if (!arr(s.editors).some((e) => e.command === 'code-insiders')) {
      s.editors = [
        { id: 'code-insiders', label: 'VS Code Insiders', command: 'code-insiders' },
        ...arr(s.editors)
      ]
    }
    if (s.defaultEditor === 'code') s.defaultEditor = 'code-insiders'
  }

  data.version = DATA_VERSION
  return data
}
