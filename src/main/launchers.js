// The command lines behind "open in editor", "open in terminal" and "run
// script", per platform. Pure: nothing here spawns anything or touches
// Electron, so every platform's commands are unit-tested on any OS.
//
// Each builder returns a spec `{ cmd, args, options }` for child_process.spawn,
// plus `wait: true` when the process must be awaited to know whether it worked
// (`open -a` exits non-zero on failure; a detached spawn can't tell). The Windows specs are exactly what the app has always run.

const isWin = (platform) => platform === 'win32'
const isMac = (platform) => platform === 'darwin'

// Single-quote a string for a POSIX shell: 'it'\''s' is the only escape needed.
export function posixQuote(s) {
  return `'${String(s).replace(/'/g, `'\\''`)}'`
}

// Editor CLIs go through the shell everywhere, so a custom command with
// arguments (`code -n`, `open -a Zed`) works.
// Windows: code/cursor are .cmd shims that need the shell. With shell:true
// Node joins args unquoted, hence the explicit quotes, otherwise a path with
// a space opens two folders, and one with an `&` would run a command.
// Windows paths can't contain `"`.
export function editorSpec(command, folderPath, platform) {
  if (isWin(platform)) {
    return { cmd: command, args: [`"${folderPath}"`], options: { shell: true, windowsHide: true } }
  }
  return { cmd: command, args: [posixQuote(folderPath)], options: { shell: true } }
}

// macOS only installs the `code` / `cursor` shell commands when the user asks
// for them, so for the editors the app offers, fall back to opening the app
// bundle by name.
const MAC_EDITOR_APPS = {
  code: 'Visual Studio Code',
  'code-insiders': 'Visual Studio Code - Insiders',
  cursor: 'Cursor'
}

export function editorFallbackSpec(command, folderPath, platform) {
  if (!isMac(platform) || !Object.prototype.hasOwnProperty.call(MAC_EDITOR_APPS, command)) return null
  return { cmd: 'open', args: ['-a', MAC_EDITOR_APPS[command], folderPath], options: {}, wait: true }
}

// Whether a bare command name is on the PATH.
export function commandExistsSpec(command, platform) {
  if (isWin(platform)) return { cmd: 'where', args: [command], options: { windowsHide: true } }
  // The name is passed as $1, never spliced into the script.
  return { cmd: '/bin/sh', args: ['-c', 'command -v "$1"', 'sh', command], options: {} }
}

// Terminals to try in order; the first one that starts wins.
export function terminalSpecs(folderPath, platform) {
  if (isWin(platform)) {
    return [
      // Windows Terminal when it's installed. wt treats `;` as a command
      // separator, so it has to be escaped in the path.
      { cmd: 'wt.exe', args: ['-d', folderPath.replace(/;/g, '\\;')], options: {} },
      // The classic console otherwise.
      { cmd: 'cmd.exe', args: ['/c', 'start', '', 'cmd.exe', '/k', `cd /d "${folderPath}"`], options: {} }
    ]
  }
  if (isMac(platform)) {
    return [{ cmd: 'open', args: ['-a', 'Terminal', folderPath], options: {}, wait: true }]
  }
  return [{ cmd: 'x-terminal-emulator', args: [], options: { cwd: folderPath } }]
}

// Run `command` (already validated: a package manager plus a safe script
// name) in `folderPath`, in a visible terminal the user can watch and Ctrl+C.
// null where that isn't supported yet (macOS).
export function scriptSpec(folderPath, command, platform) {
  if (isWin(platform)) {
    return {
      cmd: 'cmd.exe',
      args: ['/c', 'start', '', 'cmd.exe', '/k', `cd /d "${folderPath}" && ${command}`],
      options: {}
    }
  }
  if (isMac(platform)) return null
  const line = `cd ${posixQuote(folderPath)} && ${command}`
  // Keep the terminal open after the script ends, like cmd /k.
  return {
    cmd: 'x-terminal-emulator',
    args: ['-e', 'sh', '-c', `${line}; exec "\${SHELL:-sh}"`],
    options: {}
  }
}

// ---- PATH from the login shell (macOS / Linux) -----------------------------
// An app started from Finder or the Dock gets launchd's bare PATH
// (/usr/bin:/bin:/usr/sbin:/sbin), so editors and package managers installed
// with Homebrew, nvm, volta... aren't found. The login shell knows the real
// PATH; it's printed between markers because rc files may print other things.

export const PATH_MARKER = '__PM_PATH__'

export function loginShellPathSpec(shell) {
  return {
    cmd: shell || '/bin/zsh',
    args: ['-ilc', `printf '%s%s%s' '${PATH_MARKER}' "$PATH" '${PATH_MARKER}'`],
    options: {}
  }
}

export function parseLoginShellPath(stdout) {
  const parts = String(stdout || '').split(PATH_MARKER)
  return parts.length >= 3 ? parts[parts.length - 2].trim() : ''
}

// Common install locations, in case the shell couldn't be asked.
export const FALLBACK_PATH_DIRS = ['/opt/homebrew/bin', '/opt/homebrew/sbin', '/usr/local/bin']

// The shell's entries first (its order is what the user sees in a terminal),
// then whatever the app already had, then the fallbacks; no duplicates.
export function mergePath(current, fromShell, extra = FALLBACK_PATH_DIRS) {
  const seen = new Set()
  const out = []
  for (const list of [fromShell, current]) {
    for (const dir of String(list || '').split(':')) {
      if (dir && !seen.has(dir)) {
        seen.add(dir)
        out.push(dir)
      }
    }
  }
  for (const dir of extra) {
    if (!seen.has(dir)) {
      seen.add(dir)
      out.push(dir)
    }
  }
  return out.join(':')
}
