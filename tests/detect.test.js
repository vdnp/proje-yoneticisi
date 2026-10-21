import { describe, it, expect, afterEach } from 'vitest'
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'fs'
import { tmpdir } from 'os'
import { join, dirname } from 'path'
import {
  detectProject,
  detectPackageManager,
  detectTags,
  isProjectRoot,
  mergeDetectedTags,
  KNOWN_TAGS
} from '../src/main/detect.js'

const made = []

// A temp folder holding `files` ({ 'relative/path': 'contents' }).
function folder(files = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'pm-detect-'))
  made.push(dir)
  for (const [rel, text] of Object.entries(files)) {
    mkdirSync(dirname(join(dir, rel)), { recursive: true })
    writeFileSync(join(dir, rel), text)
  }
  return dir
}

afterEach(() => {
  while (made.length) rmSync(made.pop(), { recursive: true, force: true })
})

const pkg = (deps) => JSON.stringify({ name: 'x', dependencies: deps }, null, 2)

describe('detectPackageManager', () => {
  it('picks the JS package manager from the lockfile', () => {
    expect(detectPackageManager(folder({ 'package.json': '{}', 'pnpm-lock.yaml': '' }))).toBe('pnpm')
    expect(detectPackageManager(folder({ 'package.json': '{}', 'yarn.lock': '' }))).toBe('yarn')
    expect(detectPackageManager(folder({ 'package.json': '{}', 'bun.lockb': '' }))).toBe('bun')
    expect(detectPackageManager(folder({ 'package.json': '{}', 'package-lock.json': '{}' }))).toBe('npm')
  })

  it('prefers the most specific lockfile', () => {
    const dir = folder({ 'package.json': '{}', 'package-lock.json': '{}', 'pnpm-lock.yaml': '' })
    expect(detectPackageManager(dir)).toBe('pnpm')
  })

  it('defaults to npm for a package.json without a lockfile', () => {
    expect(detectPackageManager(folder({ 'package.json': '{}' }))).toBe('npm')
  })

  it('reads other ecosystems from their marker files', () => {
    expect(detectPackageManager(folder({ 'Cargo.toml': '' }))).toBe('cargo')
    expect(detectPackageManager(folder({ 'go.mod': '' }))).toBe('go')
    expect(detectPackageManager(folder({ 'requirements.txt': '' }))).toBe('pip')
    expect(detectPackageManager(folder({ 'App.csproj': '' }))).toBe('nuget')
  })

  it('returns an empty string when nothing is recognised, or the folder is missing', () => {
    expect(detectPackageManager(folder({ 'notes.txt': 'hi' }))).toBe('')
    expect(detectPackageManager(join(tmpdir(), 'pm-detect-does-not-exist'))).toBe('')
  })
})

describe('detectProject', () => {
  it('detects a React + Vite TypeScript project', () => {
    const dir = folder({
      'package.json': pkg({ react: '^18.0.0', vite: '^7.0.0' }),
      'tsconfig.json': '{}',
      'yarn.lock': '',
      'src/main.tsx': '',
      'src/App.tsx': '',
      'vite.config.js': ''
    })
    const d = detectProject(dir)
    expect(d.languages).toEqual(['TypeScript'])
    expect(d.frameworks).toEqual(expect.arrayContaining(['React', 'Vite']))
    expect(d.packageManager).toBe('yarn')
    expect(d.fileCounts).toEqual({ TypeScript: 2, JavaScript: 1 })
  })

  it('detects plain JavaScript without a tsconfig', () => {
    const d = detectProject(folder({ 'package.json': pkg({ express: '^4.0.0' }), 'index.js': '' }))
    expect(d.languages).toEqual(['JavaScript'])
    expect(d.frameworks).toEqual(['Express'])
  })

  it('does not flag a framework mentioned outside the dependency list', () => {
    const d = detectProject(
      folder({ 'package.json': JSON.stringify({ description: 'not a react app' }), 'README.md': 'react' })
    )
    expect(d.frameworks).toEqual([])
  })

  it('detects Python frameworks from requirements.txt', () => {
    const d = detectProject(folder({ 'requirements.txt': 'Django==5.0\npandas\n', 'manage.py': '' }))
    expect(d.languages).toEqual(['Python'])
    expect(d.frameworks).toEqual(expect.arrayContaining(['Django', 'Pandas']))
    expect(d.packageManager).toBe('pip')
  })

  it('detects Rust crates and Tauri', () => {
    const d = detectProject(folder({ 'Cargo.toml': '[dependencies]\naxum = "0.7"\ntauri = "2"\n' }))
    expect(d.languages).toEqual(['Rust'])
    expect(d.frameworks).toEqual(expect.arrayContaining(['Axum', 'Tauri']))
    expect(d.packageManager).toBe('cargo')
  })

  it('detects tools and engines', () => {
    expect(detectProject(folder({ Dockerfile: '' })).frameworks).toEqual(['Docker'])
    expect(detectProject(folder({ 'project.godot': '' })).frameworks).toEqual(['Godot'])
    const unity = folder({ 'ProjectSettings/x.asset': '', 'Assets/Player.cs': '' })
    expect(detectProject(unity).frameworks).toEqual(['Unity'])
    expect(detectProject(folder({ 'ProjectSettings/x.asset': '' })).frameworks).toEqual([])
  })

  it('falls back to counting files when there is no manifest', () => {
    const d = detectProject(
      folder({ 'mods/a.lua': '', 'mods/b.lua': '', 'mods/c.lua': '', 'run.sh': '' })
    )
    expect(d.languages).toEqual(['Lua', 'Shell'])
    expect(d.packageManager).toBe('')
  })

  it('skips dependency and build folders while counting', () => {
    const d = detectProject(
      folder({
        'main.go': '',
        'node_modules/x/index.js': '',
        'vendor/y/z.php': '',
        '.hidden/w.rb': ''
      })
    )
    expect(d.fileCounts).toEqual({ Go: 1 })
  })

  it('leaves out languages with a tiny share of the files', () => {
    const files = { 'one.py': '' }
    for (let i = 0; i < 30; i++) files[`src/f${i}.go`] = ''
    expect(detectProject(folder(files)).languages).toEqual(['Go'])
  })

  it('returns empty results for an empty or missing folder', () => {
    const empty = { languages: [], frameworks: [], packageManager: '', fileCounts: {} }
    expect(detectProject(folder())).toEqual(empty)
    expect(detectProject(join(tmpdir(), 'pm-detect-does-not-exist'))).toEqual(empty)
  })
})

describe('detectTags', () => {
  it('is languages + frameworks, deduped', () => {
    const tags = detectTags('', { languages: ['Vue', 'TypeScript'], frameworks: ['Vue', 'Vite'] })
    expect(tags).toEqual(['Vue', 'TypeScript', 'Vite'])
  })
})

describe('isProjectRoot', () => {
  it('is true for a VCS folder or a manifest', () => {
    expect(isProjectRoot(folder({ '.git/HEAD': '' }))).toBe(true)
    expect(isProjectRoot(folder({ 'package.json': '{}' }))).toBe(true)
    expect(isProjectRoot(folder({ 'Game.uproject': '' }))).toBe(true)
    expect(isProjectRoot(folder({ 'Tool.csproj': '' }))).toBe(true)
  })

  it('is false for a folder that only holds source files', () => {
    expect(isProjectRoot(folder({ 'a.js': '', 'b.py': '' }))).toBe(false)
  })
})

describe('mergeDetectedTags', () => {
  const detected = { languages: ['TypeScript'], frameworks: ['React'] }

  it("replaces detected tags and keeps the user's own", () => {
    expect(mergeDetectedTags(['JavaScript', 'Node', 'Client work', 'Vue'], detected)).toEqual([
      'TypeScript',
      'React',
      'Client work'
    ])
  })

  it('dedupes and copes with no current tags', () => {
    expect(mergeDetectedTags(null, detected)).toEqual(['TypeScript', 'React'])
    expect(mergeDetectedTags(['React'], detected)).toEqual(['TypeScript', 'React'])
  })

  it('caps the list at ten tags', () => {
    const own = Array.from({ length: 12 }, (_, i) => `mine${i}`)
    expect(mergeDetectedTags(own, detected)).toHaveLength(10)
  })

  it('knows every tag the detector produces, plus the legacy Node tag', () => {
    for (const tag of ['TypeScript', 'JavaScript', 'React', 'Docker', 'Unity', 'Lua', 'Node']) {
      expect(KNOWN_TAGS.has(tag)).toBe(true)
    }
    expect(KNOWN_TAGS.has('Client work')).toBe(false)
  })
})
