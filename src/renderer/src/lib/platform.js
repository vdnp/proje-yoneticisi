import api from './api.js'

// The OS the app runs on, from the preload. The browser preview (mock API)
// has none and looks like Windows, as it always has.
export const platform = api.platform || 'win32'
export const isMac = platform === 'darwin'

// Starting package.json scripts in a terminal isn't supported on macOS yet:
// the script controls are hidden there and "Launch" only opens editors.
export const canRunScripts = !isMac

// Modifier keys the way each platform writes them.
export const KEYS = isMac
  ? { mod: '⌘', alt: '⌥', shift: '⇧' }
  : { mod: 'Ctrl', alt: 'Alt', shift: 'Shift' }

// A shortcut label from key names: ['mod', 'K'] → "Ctrl+K" / "⌘K".
export function shortcutLabel(parts) {
  const names = parts.map((p) => KEYS[p] || p)
  return isMac ? names.join('') : names.join('+')
}
