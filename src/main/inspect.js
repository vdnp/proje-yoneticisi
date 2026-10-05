import { join, basename } from 'path'
import { readFileSync, existsSync, statSync, readdirSync, openSync, readSync, closeSync } from 'fs'
import {
  detectProject,
  detectTags,
  detectPackageManager,
  isProjectRoot,
  mergeDetectedTags,
  SKIP_DIRS
} from './detect.js'

// Errors are returned as codes ('not_found', ...) and translated in the
// renderer, so the main process never hard-codes a UI language.

// Convert any git remote URL into a browsable https URL.
//   git@github.com:user/repo.git      -> https://github.com/user/repo
//   https://github.com/user/repo.git  -> https://github.com/user/repo
export function normalizeRemoteUrl(url) {
  if (!url) return ''
  let u = url.trim().replace(/\.git$/, '')
  const scp = u.match(/^git@([^:]+):(.+)$/)
  if (scp) return `https://${scp[1]}/${scp[2]}`
  u = u.replace(/^ssh:\/\/git@/, 'https://').replace(/^git:\/\//, 'https://')
  return u
}

// Parse .git/config for [remote "origin"] url — no git binary required.
function readGitRemote(folderPath) {
  const cfg = join(folderPath, '.git', 'config')
  if (!existsSync(cfg)) return ''
  try {
    let inOrigin = false
    for (const line of readFileSync(cfg, 'utf-8').split(/\r?\n/)) {
      const section = line.match(/^\s*\[(.+?)\]\s*$/)
      if (section) {
        inOrigin = /^remote\s+"origin"$/.test(section[1].trim())
        continue
      }
      if (inOrigin) {
        const m = line.match(/^\s*url\s*=\s*(.+?)\s*$/)
        if (m) return m[1]
      }
    }
  } catch {
    /* ignore */
  }
  return ''
}

// Name / description / scripts come from package.json when present; other
// ecosystems don't carry a portable equivalent, so we fall back to the folder.
function readPackageJson(folderPath) {
  const pkgPath = join(folderPath, 'package.json')
  if (!existsSync(pkgPath)) return null
  try {
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'))
    return {
      name: pkg.name || '',
      description: pkg.description || '',
      scripts: pkg.scripts && typeof pkg.scripts === 'object' ? pkg.scripts : {}
    }
  } catch {
    return null
  }
}

function checkFolder(folderPath) {
  if (!folderPath || !existsSync(folderPath)) return 'not_found'
  try {
    if (!statSync(folderPath).isDirectory()) return 'not_a_folder'
  } catch {
    return 'unreadable'
  }
  return null
}

// Full metadata for one folder.
export function inspectFolder(folderPath) {
  const error = checkFolder(folderPath)
  if (error) return { ok: false, error }

  const pkg = readPackageJson(folderPath)
  const detected = detectProject(folderPath)
  let lastModified = null
  try {
    lastModified = statSync(folderPath).mtimeMs
  } catch {
    /* ignore */
  }

  return {
    ok: true,
    data: {
      name: (pkg && pkg.name) || basename(folderPath),
      description: (pkg && pkg.description) || '',
      gitUrl: normalizeRemoteUrl(readGitRemote(folderPath)),
      hasGit: existsSync(join(folderPath, '.git')),
      languages: detected.languages,
      frameworks: detected.frameworks,
      packageManager: detected.packageManager,
      tags: detectTags(folderPath, detected),
      lastModified
    }
  }
}

// Re-run detection for an existing project, keeping the user's own tags.
export function redetect(folderPath, currentTags) {
  const error = checkFolder(folderPath)
  if (error) return { ok: false, error }
  const detected = detectProject(folderPath)
  return {
    ok: true,
    data: {
      languages: detected.languages,
      frameworks: detected.frameworks,
      packageManager: detected.packageManager,
      tags: mergeDetectedTags(currentTags, detected)
    }
  }
}

// Live-read package.json scripts (not persisted, so they never go stale).
export function getScripts(folderPath) {
  const pkg = readPackageJson(folderPath)
  if (!pkg) return { ok: false, scripts: {} }
  return { ok: true, scripts: pkg.scripts, packageManager: detectPackageManager(folderPath) }
}

// Which of these folders still exist? Used to flag projects whose folder was
// moved or deleted.
export function checkPaths(paths) {
  const result = {}
  for (const p of paths || []) result[p] = checkFolder(p) === null
  return result
}

const README_MAX = 512 * 1024

// Find and read the project's README. Prefers Markdown; capped so a huge file
// can't stall the UI.
export function getReadme(folderPath) {
  if (checkFolder(folderPath)) return { ok: false }
  let names = []
  try {
    names = readdirSync(folderPath, { withFileTypes: true })
      .filter((e) => e.isFile())
      .map((e) => e.name)
  } catch {
    return { ok: false }
  }

  const rank = (n) => (/\.(md|markdown|mdown|mkd)$/i.test(n) ? 0 : /\.txt$/i.test(n) ? 2 : 1)
  const name = names
    .filter((n) => /^readme(\.(md|markdown|mdown|mkd|txt))?$/i.test(n))
    .sort((a, b) => rank(a) - rank(b))[0]
  if (!name) return { ok: false }

  const full = join(folderPath, name)
  try {
    const size = statSync(full).size
    const length = Math.min(size, README_MAX)
    const buf = Buffer.alloc(length)
    const fd = openSync(full, 'r')
    try {
      readSync(fd, buf, 0, length, 0)
    } finally {
      closeSync(fd)
    }
    return {
      ok: true,
      name,
      content: buf.toString('utf-8'),
      truncated: size > README_MAX,
      markdown: !/\.txt$/i.test(name)
    }
  } catch {
    return { ok: false }
  }
}

// Walk a root folder looking for project roots (a VCS folder or any recognised
// manifest). A match is not descended into — a repo is one project, not one
// per nested package.
export function scanRoot(rootPath, maxDepth = 3) {
  if (!rootPath || !existsSync(rootPath)) {
    return { ok: false, error: 'root_not_found' }
  }

  const found = []

  const walk = (dir, depth) => {
    if (depth > maxDepth || found.length >= 500) return

    if (depth > 0 && isProjectRoot(dir)) {
      const res = inspectFolder(dir)
      if (res.ok) found.push({ path: dir, ...res.data })
      return // don't descend into a project
    }

    let entries = []
    try {
      entries = readdirSync(dir, { withFileTypes: true })
    } catch {
      return
    }
    for (const e of entries) {
      if (!e.isDirectory()) continue
      if (SKIP_DIRS.has(e.name) || e.name.startsWith('.')) continue
      walk(join(dir, e.name), depth + 1)
    }
  }

  walk(rootPath, 0)
  found.sort((a, b) => a.name.localeCompare(b.name))
  return { ok: true, projects: found }
}
