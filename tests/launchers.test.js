import { describe, it, expect } from 'vitest'
import { execFileSync } from 'child_process'
import {
  posixQuote,
  editorSpec,
  editorFallbackSpec,
  commandExistsSpec,
  terminalSpecs,
  scriptSpec,
  loginShellPathSpec,
  parseLoginShellPath,
  mergePath,
  PATH_MARKER
} from '../src/main/launchers.js'

const WIN_PATH = 'C:\\Users\\me\\My Projects\\app'
const MAC_PATH = "/Users/me/My Projects/bob's app"

// The Windows commands must stay exactly what the app ran before it learned
// about other platforms (installer, winget and Store builds rely on them).
describe('Windows launchers', () => {
  it('opens the editor through the shell with the path in double quotes', () => {
    expect(editorSpec('code', WIN_PATH, 'win32')).toEqual({
      cmd: 'code',
      args: [`"${WIN_PATH}"`],
      options: { shell: true, windowsHide: true }
    })
  })

  it('has no editor fallback', () => {
    expect(editorFallbackSpec('code', WIN_PATH, 'win32')).toBeNull()
  })

  it('checks commands with where', () => {
    expect(commandExistsSpec('cursor', 'win32')).toEqual({
      cmd: 'where',
      args: ['cursor'],
      options: { windowsHide: true }
    })
  })

  it('tries Windows Terminal, then cmd.exe', () => {
    expect(terminalSpecs('C:\\a;b', 'win32')).toEqual([
      { cmd: 'wt.exe', args: ['-d', 'C:\\a\\;b'], options: {} },
      { cmd: 'cmd.exe', args: ['/c', 'start', '', 'cmd.exe', '/k', 'cd /d "C:\\a;b"'], options: {} }
    ])
  })

  it('runs scripts in a new cmd.exe window', () => {
    expect(scriptSpec(WIN_PATH, 'npm run dev', 'win32')).toEqual({
      cmd: 'cmd.exe',
      args: ['/c', 'start', '', 'cmd.exe', '/k', `cd /d "${WIN_PATH}" && npm run dev`],
      options: {}
    })
  })
})

describe('posixQuote', () => {
  it('wraps in single quotes and escapes embedded ones', () => {
    expect(posixQuote('a b')).toBe("'a b'")
    expect(posixQuote("bob's")).toBe("'bob'\\''s'")
  })

  it('survives a real shell unchanged', () => {
    if (process.platform === 'win32') return
    const nasty = `it's "$HOME" & \`whoami\`; rm -rf x`
    const out = execFileSync('/bin/sh', ['-c', `printf %s ${posixQuote(nasty)}`]).toString()
    expect(out).toBe(nasty)
  })
})

describe('macOS launchers', () => {
  it('opens the editor through the shell with a single-quoted path', () => {
    expect(editorSpec('code', MAC_PATH, 'darwin')).toEqual({
      cmd: 'code',
      args: [posixQuote(MAC_PATH)],
      options: { shell: true }
    })
  })

  it('falls back to the app bundle for the known editors only', () => {
    expect(editorFallbackSpec('code', MAC_PATH, 'darwin')).toEqual({
      cmd: 'open',
      args: ['-a', 'Visual Studio Code', MAC_PATH],
      options: {},
      wait: true
    })
    expect(editorFallbackSpec('cursor', MAC_PATH, 'darwin').args[1]).toBe('Cursor')
    expect(editorFallbackSpec('subl', MAC_PATH, 'darwin')).toBeNull()
    expect(editorFallbackSpec('constructor', MAC_PATH, 'darwin')).toBeNull()
  })

  it('checks commands with command -v, passing the name as an argument', () => {
    expect(commandExistsSpec('code', 'darwin')).toEqual({
      cmd: '/bin/sh',
      args: ['-c', 'command -v "$1"', 'sh', 'code'],
      options: {}
    })
  })

  it('opens Terminal.app at the folder', () => {
    expect(terminalSpecs(MAC_PATH, 'darwin')).toEqual([
      { cmd: 'open', args: ['-a', 'Terminal', MAC_PATH], options: {}, wait: true }
    ])
  })

  it('has no script launcher yet', () => {
    expect(scriptSpec(MAC_PATH, 'npm run dev', 'darwin')).toBeNull()
  })
})

describe('Linux launchers', () => {
  it('uses x-terminal-emulator', () => {
    expect(terminalSpecs('/home/me/app', 'linux')[0]).toEqual({
      cmd: 'x-terminal-emulator',
      args: [],
      options: { cwd: '/home/me/app' }
    })
    expect(scriptSpec('/home/me/app', 'npm run dev', 'linux').args.slice(0, 3)).toEqual(['-e', 'sh', '-c'])
  })
})

describe('login shell PATH', () => {
  it('asks the given shell, defaulting to zsh', () => {
    expect(loginShellPathSpec('/bin/bash').cmd).toBe('/bin/bash')
    expect(loginShellPathSpec(undefined).cmd).toBe('/bin/zsh')
  })

  it('reads the PATH between the markers, ignoring rc-file noise', () => {
    const out = `Welcome!\n${PATH_MARKER}/opt/homebrew/bin:/usr/bin${PATH_MARKER}`
    expect(parseLoginShellPath(out)).toBe('/opt/homebrew/bin:/usr/bin')
    expect(parseLoginShellPath('no markers')).toBe('')
    expect(parseLoginShellPath(undefined)).toBe('')
  })

  it('works with a real shell', () => {
    if (process.platform === 'win32') return
    const spec = loginShellPathSpec('/bin/sh')
    // -i/-l aren't needed to test the printf; run the command part only.
    const out = execFileSync('/bin/sh', ['-c', spec.args[1]], { env: { PATH: '/x:/y' } }).toString()
    expect(parseLoginShellPath(out)).toBe('/x:/y')
  })

  it('puts the shell PATH first, keeps the old one, adds fallbacks, no duplicates', () => {
    expect(mergePath('/usr/bin:/bin', '/opt/homebrew/bin:/usr/bin', ['/usr/local/bin', '/bin'])).toBe(
      '/opt/homebrew/bin:/usr/bin:/bin:/usr/local/bin'
    )
    expect(mergePath('/usr/bin', '', [])).toBe('/usr/bin')
  })
})
