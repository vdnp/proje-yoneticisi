import { describe, it, expect } from 'vitest'
import { fuzzyScore, fuzzyScoreAny } from '../src/renderer/src/lib/fuzzy.js'

describe('fuzzyScore', () => {
  it('matches a subsequence and rejects anything else', () => {
    expect(fuzzyScore('ad', 'acme-dashboard')).toBeGreaterThan(0)
    expect(fuzzyScore('da', 'ad')).toBe(-1)
    expect(fuzzyScore('xyz', 'acme-dashboard')).toBe(-1)
  })

  it('scores an empty query as 0 and an empty text as no match', () => {
    expect(fuzzyScore('', 'anything')).toBe(0)
    expect(fuzzyScore('a', '')).toBe(-1)
    expect(fuzzyScore('a', null)).toBe(-1)
  })

  it('is case-insensitive, Turkish dotted/dotless i included', () => {
    const exact = fuzzyScore('api', 'api')
    expect(fuzzyScore('API', 'api')).toBe(exact)
    expect(fuzzyScore('api', 'API')).toBe(exact)
    expect(fuzzyScore('ai', 'AI Chat')).toBeGreaterThan(0)
    expect(fuzzyScore('İzmir', 'izmir')).toBe(fuzzyScore('izmir', 'izmir'))
    expect(fuzzyScore('ışık', 'IŞIK')).toBeGreaterThan(0)
    expect(fuzzyScore('çğöşü', 'ÇĞÖŞÜ')).toBe(fuzzyScore('çğöşü', 'çğöşü'))
  })

  it('ranks an exact match over a prefix over a scattered match', () => {
    const exact = fuzzyScore('shop', 'shop')
    const prefix = fuzzyScore('shop', 'shop-admin')
    const scattered = fuzzyScore('shop', 'some-hobby-project')
    expect(exact).toBeGreaterThan(prefix)
    expect(prefix).toBeGreaterThan(scattered)
  })

  it('rewards word-boundary matches', () => {
    expect(fuzzyScore('d', 'acme-dashboard')).toBeGreaterThan(fuzzyScore('d', 'acmedashboard'))
  })

  it('prefers shorter texts for the same match', () => {
    const short = fuzzyScore('api', 'api-server')
    const long = fuzzyScore('api', 'api-server-with-a-really-long-name-for-no-reason')
    expect(short).toBeGreaterThan(long)
  })
})

describe('fuzzyScoreAny', () => {
  it('returns the best score across fields, skipping empty ones', () => {
    const best = fuzzyScoreAny('api', [null, 'web', 'api', ''])
    expect(best).toBe(fuzzyScore('api', 'api'))
  })

  it('returns -1 when no field matches', () => {
    expect(fuzzyScoreAny('zzz', ['web', 'api'])).toBe(-1)
    expect(fuzzyScoreAny('zzz', [])).toBe(-1)
  })
})
