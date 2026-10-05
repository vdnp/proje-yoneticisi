import { join } from 'path'
import { existsSync } from 'fs'
import { execFile } from 'child_process'

// `.git` can be a folder or, for worktrees and submodules, a file — both count.
function isRepo(folderPath) {
  return !!folderPath && existsSync(join(folderPath, '.git'))
}

function git(folderPath, args, timeout = 5000) {
  return new Promise((resolve) => {
    execFile(
      'git',
      ['-C', folderPath, ...args],
      { timeout, windowsHide: true, maxBuffer: 4 * 1024 * 1024 },
      (err, stdout) => resolve(err ? null : stdout)
    )
  })
}

// Last commit. Resolves to null if git is missing or this isn't a repo.
export async function getLastCommit(folderPath) {
  if (!isRepo(folderPath)) return null
  const out = await git(folderPath, ['log', '-1', '--pretty=format:%h%x1f%s%x1f%an%x1f%cI'], 4000)
  if (!out) return null
  const [hash, subject, author, date] = out.split('\x1f')
  return { hash, subject, author, date }
}

// Branch, ahead/behind and working-tree changes from a single
// `git status --porcelain=v2 --branch`, which is stable across git versions.
// Resolves to null if git is missing or this isn't a repo.
export async function getGitStatus(folderPath) {
  if (!isRepo(folderPath)) return null
  const out = await git(folderPath, ['status', '--porcelain=v2', '--branch'])
  if (out === null) return null

  const status = {
    branch: '',
    detached: false,
    upstream: '',
    ahead: 0,
    behind: 0,
    changed: 0,
    untracked: 0
  }

  for (const line of out.split(/\r?\n/)) {
    if (line.startsWith('# branch.head ')) {
      const head = line.slice('# branch.head '.length)
      status.detached = head === '(detached)'
      status.branch = status.detached ? '' : head
    } else if (line.startsWith('# branch.upstream ')) {
      status.upstream = line.slice('# branch.upstream '.length)
    } else if (line.startsWith('# branch.ab ')) {
      const m = line.match(/\+(\d+) -(\d+)/)
      if (m) {
        status.ahead = Number(m[1])
        status.behind = Number(m[2])
      }
    } else if (/^[12u] /.test(line)) {
      status.changed++
    } else if (line.startsWith('? ')) {
      status.untracked++
    }
  }

  return status
}
