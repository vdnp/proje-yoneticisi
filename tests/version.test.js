import { describe, it, expect } from 'vitest'
import { parseVersion, isNewer } from '../src/main/version.js'

describe('parseVersion', () => {
  it('parses plain and v-prefixed versions', () => {
    expect(parseVersion('1.4.0')).toEqual([1, 4, 0])
    expect(parseVersion('v12.0.31')).toEqual([12, 0, 31])
    expect(parseVersion('  v2.3.4\n')).toEqual([2, 3, 4])
  })

  it('rejects pre-releases and garbage', () => {
    for (const bad of ['1.4.0-beta.1', '1.4', '1.4.0.1', 'version 1.4.0', '', null, undefined, 42]) {
      expect(parseVersion(bad)).toBeNull()
    }
  })
})

describe('isNewer', () => {
  it('compares major, minor and patch numerically', () => {
    expect(isNewer('1.4.1', '1.4.0')).toBe(true)
    expect(isNewer('1.10.0', '1.9.9')).toBe(true)
    expect(isNewer('v2.0.0', '1.99.99')).toBe(true)
    expect(isNewer('1.4.0', '1.4.0')).toBe(false)
    expect(isNewer('1.3.9', '1.4.0')).toBe(false)
  })

  it('never reports a pre-release or garbage as newer', () => {
    expect(isNewer('2.0.0-rc.1', '1.4.0')).toBe(false)
    expect(isNewer('latest', '1.4.0')).toBe(false)
    expect(isNewer('2.0.0', 'dev')).toBe(false)
    expect(isNewer(undefined, '1.4.0')).toBe(false)
  })
})
