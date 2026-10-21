import { describe, it, expect, vi } from 'vitest'
import tr from '../src/renderer/src/locales/tr.js'
import en from '../src/renderer/src/locales/en.js'
import { translate, resolveLanguage, errorText } from '../src/renderer/src/lib/i18n.js'

// i18n.js imports the zustand store (and through it the Electron bridge) only
// for its React hook; translate() itself doesn't need it.
vi.mock('../src/renderer/src/store/useStore.js', () => ({ default: () => undefined }))

// Every leaf key of a dictionary, with `_one` / `_other` pairs folded into
// their base key.
function keysOf(dict, prefix = '') {
  const keys = new Set()
  for (const [k, v] of Object.entries(dict)) {
    const key = prefix + k
    if (v && typeof v === 'object') keysOf(v, key + '.').forEach((x) => keys.add(x))
    else keys.add(key.replace(/_(one|other)$/, ''))
  }
  return keys
}

describe('locales', () => {
  it('tr.js and en.js define the same keys', () => {
    const trKeys = keysOf(tr)
    const enKeys = keysOf(en)
    expect([...trKeys].filter((k) => !enKeys.has(k))).toEqual([])
    expect([...enKeys].filter((k) => !trKeys.has(k))).toEqual([])
  })

  it('every en.js plural has both _one and _other', () => {
    const missing = []
    const walk = (dict, prefix = '') => {
      for (const [k, v] of Object.entries(dict)) {
        if (v && typeof v === 'object') walk(v, `${prefix}${k}.`)
        const m = /^(.*)_(one|other)$/.exec(k)
        if (m && !(`${m[1]}_${m[2] === 'one' ? 'other' : 'one'}` in dict)) missing.push(prefix + k)
      }
    }
    walk(en)
    expect(missing).toEqual([])
  })

  it('uses the same {placeholders} in both languages', () => {
    const vars = (s) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort()
    const mismatched = []
    for (const key of keysOf(en)) {
      const a = translate('tr', key, { count: 2 })
      const b = translate('en', key, { count: 2 })
      // {count} is optional: Turkish often leaves it to the context.
      const strip = (list) => list.filter((v) => v !== 'count')
      if (strip(vars(a)).join() !== strip(vars(b)).join()) mismatched.push(key)
    }
    expect(mismatched).toEqual([])
  })
})

describe('translate', () => {
  it('looks up nested keys', () => {
    expect(translate('en', 'common.save')).toBe(en.common.save)
    expect(translate('tr', 'common.save')).toBe(tr.common.save)
  })

  it('picks the _one / _other variant from vars.count', () => {
    expect(translate('en', 'nav.projectCount', { count: 1 })).toBe('1 project')
    expect(translate('en', 'nav.projectCount', { count: 0 })).toBe('0 projects')
    expect(translate('en', 'nav.projectCount', { count: 5 })).toBe('5 projects')
  })

  it('uses the single Turkish form for any count', () => {
    const one = translate('tr', 'nav.projectCount', { count: 1 })
    const many = translate('tr', 'nav.projectCount', { count: 5 })
    expect(one).toBe(tr.nav.projectCount.replace('{count}', '1'))
    expect(many).toBe(tr.nav.projectCount.replace('{count}', '5'))
  })

  it('interpolates {vars} and leaves unknown ones in place', () => {
    expect(translate('en', 'scan.found', { count: 3, fresh: 2 })).toBe(
      en.scan.found_other.replace('{count}', '3').replace('{fresh}', '2')
    )
    expect(translate('en', 'scan.found', { count: 3 })).toContain('{fresh}')
  })

  it('falls back to English, then to the key itself', () => {
    expect(translate('xx', 'common.save')).toBe(en.common.save)
    expect(translate('en', 'no.such.key')).toBe('no.such.key')
    expect(translate('en', 'common')).toBe('common')
  })
})

describe('resolveLanguage', () => {
  it('keeps a known language and follows the system for anything else', () => {
    expect(resolveLanguage('tr')).toBe('tr')
    expect(resolveLanguage('en')).toBe('en')
    expect(['tr', 'en']).toContain(resolveLanguage('auto'))
  })
})

describe('errorText', () => {
  const t = (key, vars) => translate('en', key, vars)

  it('translates a known error code and falls back for unknown ones', () => {
    expect(errorText(t, 'unknown')).toBe(en.errors.unknown)
    expect(errorText(t, 'definitely_not_a_code')).toBe(en.errors.unknown)
    expect(errorText(t, '')).toBe(en.errors.unknown)
  })
})
