import { describe, it, expect } from 'vitest'
import { SORTS, sortProjects, customOrderIds, moveIds } from '../src/renderer/src/lib/sort.js'

const projects = [
  { id: 'old', name: 'Beta', lastModified: 100, lastOpenedAt: 900, favorite: false, order: 2, createdAt: 1 },
  { id: 'new', name: 'alpha', lastModified: 300, lastOpenedAt: 100, favorite: false, order: 0, createdAt: 2 },
  { id: 'fav', name: 'Gamma', lastModified: 200, lastOpenedAt: null, favorite: true, order: 1, createdAt: 3 },
  { id: 'pin', name: 'Zeta', lastModified: 0, lastOpenedAt: 0, favorite: false, pinned: true, order: 3, createdAt: 4 }
]

const ids = (list) => list.map((p) => p.id)

describe('sortProjects', () => {
  it('sorts by each mode with pinned projects first', () => {
    expect(ids(sortProjects(projects, 'modified'))).toEqual(['pin', 'new', 'fav', 'old'])
    expect(ids(sortProjects(projects, 'opened'))).toEqual(['pin', 'old', 'new', 'fav'])
    expect(ids(sortProjects(projects, 'name'))).toEqual(['pin', 'new', 'old', 'fav'])
    expect(ids(sortProjects(projects, 'favorite'))).toEqual(['pin', 'fav', 'new', 'old'])
    expect(ids(sortProjects(projects, 'custom'))).toEqual(['pin', 'new', 'fav', 'old'])
  })

  it.each(SORTS)('puts every pinned project first for %s', (sort) => {
    const list = [
      ...projects,
      { id: 'pin2', name: 'Aaa', lastModified: 999, lastOpenedAt: 999, favorite: true, pinned: true, order: 9 }
    ]
    const sorted = ids(sortProjects(list, sort))
    expect(sorted.slice(0, 2).sort()).toEqual(['pin', 'pin2'])
  })

  it('falls back to modified for an unknown sort', () => {
    expect(ids(sortProjects(projects, 'bogus'))).toEqual(ids(sortProjects(projects, 'modified')))
  })

  it('does not modify its input', () => {
    const copy = [...projects]
    sortProjects(projects, 'name')
    expect(projects).toEqual(copy)
  })
})

describe('customOrderIds', () => {
  it('lists unplaced projects first (newest first), then by saved position, ignoring pins', () => {
    const list = [
      { id: 'b', order: 1 },
      { id: 'new1', order: null, createdAt: 10 },
      { id: 'a', order: 0, pinned: true },
      { id: 'new2', createdAt: 20 }
    ]
    expect(customOrderIds(list)).toEqual(['new2', 'new1', 'a', 'b'])
  })
})

describe('moveIds', () => {
  const order = ['a', 'b', 'c', 'd', 'e']

  it('moves an id before the target', () => {
    expect(moveIds(order, ['e'], 'b', false)).toEqual(['a', 'e', 'b', 'c', 'd'])
  })

  it('moves an id after the target', () => {
    expect(moveIds(order, ['a'], 'c', true)).toEqual(['b', 'c', 'a', 'd', 'e'])
    expect(moveIds(order, ['a'], 'e', true)).toEqual(['b', 'c', 'd', 'e', 'a'])
  })

  it('moves several ids as a block, keeping their current relative order', () => {
    expect(moveIds(order, ['d', 'a'], 'c', false)).toEqual(['b', 'a', 'd', 'c', 'e'])
  })

  it('does nothing when the target is one of the moving ids', () => {
    expect(moveIds(order, ['b', 'c'], 'c', true)).toBe(order)
  })
})
