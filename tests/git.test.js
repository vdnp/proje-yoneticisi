import { describe, it, expect } from 'vitest'
import { parseGitStatus } from '../src/main/git.js'

const lines = (...l) => l.join('\n') + '\n'

describe('parseGitStatus', () => {
  it('reads a clean branch with an upstream', () => {
    const out = lines(
      '# branch.oid 4b825dc642cb6eb9a060e54bf8d69288fbee4904',
      '# branch.head main',
      '# branch.upstream origin/main',
      '# branch.ab +0 -0'
    )
    expect(parseGitStatus(out)).toEqual({
      branch: 'main',
      detached: false,
      upstream: 'origin/main',
      ahead: 0,
      behind: 0,
      changed: 0,
      untracked: 0
    })
  })

  it('counts ahead/behind, changed, renamed, conflicted and untracked entries', () => {
    const out = lines(
      '# branch.oid 4b825dc642cb6eb9a060e54bf8d69288fbee4904',
      '# branch.head feat/links',
      '# branch.upstream origin/feat/links',
      '# branch.ab +3 -12',
      '1 .M N... 100644 100644 100644 aaaa bbbb src/a.js',
      '1 A. N... 000000 100644 100644 0000 cccc src/new.js',
      '2 R. N... 100644 100644 100644 dddd dddd R100 src/b.js\tsrc/old-b.js',
      'u UU N... 100644 100644 100644 100644 eeee ffff 0000 src/c.js',
      '? notes.txt',
      '? tmp/',
      '! ignored.log'
    )
    expect(parseGitStatus(out)).toMatchObject({
      branch: 'feat/links',
      upstream: 'origin/feat/links',
      ahead: 3,
      behind: 12,
      changed: 4,
      untracked: 2
    })
  })

  it('reads a branch without an upstream', () => {
    const out = lines('# branch.oid abc', '# branch.head local-only', '? a')
    expect(parseGitStatus(out)).toMatchObject({
      branch: 'local-only',
      upstream: '',
      ahead: 0,
      behind: 0,
      untracked: 1
    })
  })

  it('reads a detached HEAD', () => {
    const out = lines('# branch.oid abc', '# branch.head (detached)')
    expect(parseGitStatus(out)).toMatchObject({ branch: '', detached: true })
  })

  it('reads a fresh repository with no commits', () => {
    const out = lines('# branch.oid (initial)', '# branch.head main', '? README.md')
    expect(parseGitStatus(out)).toMatchObject({ branch: 'main', detached: false, untracked: 1 })
  })

  it('handles CRLF output and empty output', () => {
    const out = '# branch.head main\r\n# branch.ab +1 -2\r\n1 .M N... 1 1 1 a b f\r\n'
    expect(parseGitStatus(out)).toMatchObject({ branch: 'main', ahead: 1, behind: 2, changed: 1 })
    expect(parseGitStatus('')).toMatchObject({ branch: '', changed: 0, untracked: 0 })
  })
})
