import { describe, it, expect } from 'vitest'
import {
  sanitizeLinks,
  linkAll,
  unlinkPair,
  linkedProjects,
  isLaunchable,
  launchPlan
} from '../src/shared/links.js'

const linksOf = (projects) =>
  Object.fromEntries(projects.map((p) => [p.id, [...(p.links || [])].sort()]))

describe('sanitizeLinks', () => {
  it('makes one-way links two-way', () => {
    const out = sanitizeLinks([{ id: 'a', links: ['b'] }, { id: 'b' }])
    expect(linksOf(out)).toEqual({ a: ['b'], b: ['a'] })
  })

  it('drops links to missing projects and to the project itself', () => {
    const out = sanitizeLinks([{ id: 'a', links: ['a', 'ghost'] }])
    expect(out[0].links).toEqual([])
  })

  it('dedupes repeated links', () => {
    const out = sanitizeLinks([{ id: 'a', links: ['b', 'b'] }, { id: 'b', links: ['a'] }])
    expect(linksOf(out)).toEqual({ a: ['b'], b: ['a'] })
  })

  it('creates no links from a missing or non-array links field', () => {
    const out = sanitizeLinks([{ id: 'a', links: 'b' }, { id: 'b' }, { id: 'c', links: ['b'] }])
    expect(out[1].links).toEqual(['c'])
    expect(out[2].links).toEqual(['b'])
  })

  it('passes projects whose links did not change through untouched', () => {
    const a = { id: 'a', links: ['b'] }
    const b = { id: 'b', links: ['a'] }
    const c = { id: 'c', links: [] }
    const out = sanitizeLinks([a, b, c])
    expect(out[0]).toBe(a)
    expect(out[1]).toBe(b)
    expect(out[2]).toBe(c)
  })

  it('does not modify its input', () => {
    const input = [{ id: 'a', links: ['b', 'ghost'] }, { id: 'b' }]
    sanitizeLinks(input)
    expect(input).toEqual([{ id: 'a', links: ['b', 'ghost'] }, { id: 'b' }])
  })
})

describe('linkAll', () => {
  it('connects every listed project to every other one', () => {
    const out = linkAll([{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }], ['a', 'b', 'c'])
    expect(linksOf(out)).toEqual({ a: ['b', 'c'], b: ['a', 'c'], c: ['a', 'b'], d: [] })
  })

  it('keeps existing links', () => {
    const out = linkAll([{ id: 'a', links: ['d'] }, { id: 'b' }, { id: 'd', links: ['a'] }], ['a', 'b'])
    expect(linksOf(out)).toEqual({ a: ['b', 'd'], b: ['a'], d: ['a'] })
  })
})

describe('unlinkPair', () => {
  it('removes the link from both sides only', () => {
    const projects = [
      { id: 'a', links: ['b', 'c'] },
      { id: 'b', links: ['a'] },
      { id: 'c', links: ['a'] }
    ]
    expect(linksOf(unlinkPair(projects, 'a', 'b'))).toEqual({ a: ['c'], b: [], c: ['a'] })
  })

  it('copes with projects without links', () => {
    expect(linksOf(unlinkPair([{ id: 'a' }, { id: 'b' }], 'a', 'b'))).toEqual({ a: [], b: [] })
  })
})

describe('linkedProjects', () => {
  const projects = [{ id: 'a', links: ['c'] }, { id: 'b' }, { id: 'c', links: ['a'] }]

  it('returns the linked projects', () => {
    expect(linkedProjects(projects[0], projects).map((p) => p.id)).toEqual(['c'])
  })

  it('returns nothing for a project without links', () => {
    expect(linkedProjects(projects[1], projects)).toEqual([])
  })
})

describe('isLaunchable', () => {
  it('is true with links or a start script, false otherwise', () => {
    expect(isLaunchable({ links: ['b'] })).toBe(true)
    expect(isLaunchable({ startScript: 'dev' })).toBe(true)
    expect(isLaunchable({ links: [], startScript: '' })).toBe(false)
    expect(isLaunchable({})).toBe(false)
  })
})

describe('launchPlan', () => {
  const projects = [
    { id: 'a', name: 'Web', path: 'C:\\web', links: ['b', 'c', 'd'], startScript: 'dev' },
    { id: 'b', name: 'Api', path: 'C:\\api', links: ['a'], editorCommand: 'cursor' },
    { id: 'c', name: 'No folder', path: '', links: ['a'] },
    { id: 'd', name: 'Docs', path: 'C:\\docs', links: ['a'], startScript: 'serve' }
  ]

  it('opens the project first, then its linked projects, skipping ones without a path', () => {
    expect(launchPlan(projects[0], projects, 'code-insiders')).toEqual([
      { id: 'a', name: 'Web', path: 'C:\\web', command: 'code-insiders', script: 'dev' },
      { id: 'b', name: 'Api', path: 'C:\\api', command: 'cursor', script: '' },
      { id: 'd', name: 'Docs', path: 'C:\\docs', command: 'code-insiders', script: 'serve' }
    ])
  })

  it("falls back to 'code' without a default editor", () => {
    expect(launchPlan(projects[3], [], '')[0].command).toBe('code')
  })

  it('is empty when the project itself has no path and no links', () => {
    expect(launchPlan(projects[2], [], 'code')).toEqual([])
  })
})
