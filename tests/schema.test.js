import { describe, it, expect } from 'vitest'
import { hydrate, DEFAULT_DATA, DATA_VERSION } from '../src/main/schema.js'

const clone = (v) => JSON.parse(JSON.stringify(v))

// What a 1.0-era data.json looked like: no version, no links/order/startScript,
// VS Code as the default editor and no Insiders entry.
const V1_FILE = {
  projects: [
    {
      id: 'a',
      name: 'Shop',
      path: 'C:\\code\\shop',
      tags: ['React', 'Client work'],
      favorite: true,
      notes: 'remember the staging url',
      todos: [{ id: 't1', text: 'Fix login', done: false }],
      lastModified: 1700000000000,
      createdAt: 1690000000000
    },
    { id: 'b', name: 'Api', path: 'C:\\code\\api', createdAt: 1690000001000 }
  ],
  groups: [{ id: 'g1', name: 'Work', color: 'emerald' }],
  settings: {
    theme: 'light',
    defaultEditor: 'code',
    editors: [
      { id: 'code', label: 'VS Code', command: 'code' },
      { id: 'zed', label: 'Zed', command: 'zed' }
    ],
    defaultRoot: 'C:\\code'
  }
}

describe('hydrate: defaults', () => {
  it('turns an empty object into the full default data', () => {
    const data = hydrate({})
    expect(data.version).toBe(DATA_VERSION)
    expect(data.projects).toEqual([])
    expect(data.groups).toEqual([])
    expect(data.settings).toEqual(DEFAULT_DATA.settings)
  })

  it('copes with missing or null settings', () => {
    expect(hydrate({ version: 3, settings: null }).settings).toEqual(DEFAULT_DATA.settings)
  })

  it('fills every project field a partial entry is missing', () => {
    const [p] = hydrate({ version: 3, projects: [{ path: 'C:\\x' }] }).projects
    expect(p).toMatchObject({
      name: 'project',
      description: '',
      path: 'C:\\x',
      gitUrl: '',
      tags: [],
      languages: [],
      frameworks: [],
      packageManager: '',
      favorite: false,
      pinned: false,
      groupId: null,
      color: '',
      editorCommand: '',
      links: [],
      startScript: '',
      order: null,
      notes: '',
      todos: [],
      lastModified: null,
      lastOpenedAt: null,
      openCount: 0
    })
    expect(typeof p.id).toBe('string')
    expect(p.id).not.toBe('')
    expect(typeof p.createdAt).toBe('number')
  })

  it('gives every generated id a distinct value', () => {
    const data = hydrate({ projects: [{}, {}, {}], groups: [{}, {}] })
    const ids = [...data.projects, ...data.groups].map((x) => x.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('defaults the newer settings (sort, checkUpdates) on an old file', () => {
    const { settings } = hydrate(clone(V1_FILE))
    expect(settings.sort).toBe('modified')
    expect(settings.checkUpdates).toBe(false)
    expect(settings.viewMode).toBe('grid')
  })
})

describe('hydrate: keeps user data', () => {
  it('keeps every project, group and value from an old file', () => {
    const data = hydrate(clone(V1_FILE))
    expect(data.projects.map((p) => p.id)).toEqual(['a', 'b'])
    expect(data.projects[0]).toMatchObject({
      name: 'Shop',
      path: 'C:\\code\\shop',
      tags: ['React', 'Client work'],
      favorite: true,
      notes: 'remember the staging url',
      todos: [{ id: 't1', text: 'Fix login', done: false }],
      lastModified: 1700000000000,
      createdAt: 1690000000000
    })
    expect(data.groups).toEqual([{ id: 'g1', name: 'Work', color: 'emerald' }])
    expect(data.settings.theme).toBe('light')
    expect(data.settings.defaultRoot).toBe('C:\\code')
  })

  it('keeps user choices over defaults in a current file', () => {
    const settings = {
      theme: 'light',
      language: 'tr',
      accent: 'rose',
      minimizeToTray: false,
      defaultEditor: 'cursor',
      autoLaunch: true,
      viewMode: 'list',
      sort: 'custom',
      checkUpdates: true
    }
    const data = hydrate({ version: 3, settings })
    expect(data.settings).toMatchObject(settings)
  })

  it('passes unknown project fields through untouched', () => {
    const [p] = hydrate({ version: 3, projects: [{ id: 'a', futureField: { x: 1 } }] }).projects
    expect(p.futureField).toEqual({ x: 1 })
  })

  it('keeps valid new fields', () => {
    const [a] = hydrate({
      version: 3,
      projects: [
        { id: 'a', links: ['b'], startScript: 'dev', order: 2, pinned: true },
        { id: 'b', links: ['a'] }
      ]
    }).projects
    expect(a).toMatchObject({ links: ['b'], startScript: 'dev', order: 2, pinned: true })
  })

  it('does not modify its input', () => {
    const input = clone(V1_FILE)
    hydrate(input)
    expect(input).toEqual(V1_FILE)
  })

  it('does not leak changes into DEFAULT_DATA', () => {
    const before = clone(DEFAULT_DATA)
    hydrate({})
    hydrate(clone(V1_FILE))
    hydrate({ version: 2, settings: { editors: [] } })
    expect(DEFAULT_DATA).toEqual(before)
  })
})

describe('hydrate: migrations', () => {
  it.each([1, 2, undefined])('adds VS Code Insiders as the default editor (version %s)', (version) => {
    const { settings } = hydrate({ ...clone(V1_FILE), version })
    expect(settings.editors.map((e) => e.id)).toEqual(['code-insiders', 'code', 'zed'])
    expect(settings.defaultEditor).toBe('code-insiders')
  })

  it('does not add Insiders twice when the list already has it', () => {
    const editors = [
      { id: 'code', label: 'VS Code', command: 'code' },
      { id: 'mine', label: 'Insiders', command: 'code-insiders' }
    ]
    const { settings } = hydrate({ version: 2, settings: { editors } })
    expect(settings.editors).toEqual(editors)
  })

  it('leaves a non-VS Code default editor alone', () => {
    const { settings } = hydrate({ version: 2, settings: { defaultEditor: 'zed', editors: [] } })
    expect(settings.defaultEditor).toBe('zed')
  })

  it('does not migrate a current (v3) file', () => {
    const editors = [{ id: 'code', label: 'VS Code', command: 'code' }]
    const { settings } = hydrate({ version: 3, settings: { defaultEditor: 'code', editors } })
    expect(settings.editors).toEqual(editors)
    expect(settings.defaultEditor).toBe('code')
  })

  it('stamps the current version', () => {
    expect(hydrate({ version: 1 }).version).toBe(DATA_VERSION)
  })

  it('survives junk entries in an old editors list', () => {
    const { settings } = hydrate({ version: 2, settings: { editors: [null, 'zed'] } })
    expect(settings.editors[0].id).toBe('code-insiders')
  })
})

describe('hydrate: hand-edited and broken files', () => {
  it('drops entries that are not objects', () => {
    const data = hydrate({
      version: 3,
      projects: [null, 'x', 42, { id: 'a', name: 'Ok' }],
      groups: [false, { id: 'g', name: 'G' }]
    })
    expect(data.projects.map((p) => p.id)).toEqual(['a'])
    expect(data.groups.map((g) => g.id)).toEqual(['g'])
  })

  it('treats non-array lists as empty', () => {
    const data = hydrate({ projects: { a: 1 }, groups: 'nope' })
    expect(data.projects).toEqual([])
    expect(data.groups).toEqual([])
  })

  it('fixes wrongly typed project fields', () => {
    const [p] = hydrate({
      version: 3,
      projects: [
        {
          id: 7,
          name: '',
          tags: ['ok', 3, null],
          languages: 'Go',
          favorite: 'yes',
          order: 'first',
          openCount: NaN,
          lastModified: Infinity,
          links: [1, 'ghost'],
          todos: [null, { text: 5 }, { text: 'Keep', done: 1 }]
        }
      ]
    }).projects
    expect(typeof p.id).toBe('string')
    expect(p.name).toBe('project')
    expect(p.tags).toEqual(['ok'])
    expect(p.languages).toEqual([])
    expect(p.favorite).toBe(true)
    expect(p.order).toBeNull()
    expect(p.openCount).toBe(0)
    expect(p.lastModified).toBeNull()
    expect(p.links).toEqual([])
    expect(p.todos).toHaveLength(1)
    expect(p.todos[0]).toMatchObject({ text: 'Keep', done: true })
    expect(typeof p.todos[0].id).toBe('string')
  })

  it('defaults a group with no name or color', () => {
    const [g] = hydrate({ groups: [{ id: 'g' }] }).groups
    expect(g).toEqual({ id: 'g', name: 'group', color: 'indigo' })
  })

  it('repairs one-way, unknown and self links', () => {
    const data = hydrate({
      version: 3,
      projects: [
        { id: 'a', links: ['b', 'ghost', 'a'] },
        { id: 'b' },
        { id: 'c', links: ['a'] }
      ]
    })
    const links = Object.fromEntries(data.projects.map((p) => [p.id, [...p.links].sort()]))
    expect(links).toEqual({ a: ['b', 'c'], b: ['a'], c: ['a'] })
  })
})

describe('hydrate: round trip', () => {
  const samples = {
    empty: {},
    v1: V1_FILE,
    partial: { projects: [{ path: 'C:\\x' }, { id: 'b', links: ['ghost', 'c'] }, { id: 'c' }] },
    current: {
      version: 3,
      projects: [{ id: 'a', name: 'A', order: 0, links: [] }],
      settings: { sort: 'custom', checkUpdates: true }
    }
  }

  it.each(Object.keys(samples))('hydrate(hydrate(x)) equals hydrate(x): %s', (name) => {
    const once = hydrate(clone(samples[name]))
    // Through JSON, as it is when the file is saved and loaded again.
    const twice = hydrate(clone(once))
    expect(twice).toEqual(once)
  })
})
