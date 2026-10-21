import { create } from 'zustand'

// Themed replacements for window.alert / window.confirm, whose dialogs are
// drawn by the OS and ignore the app's theme. Both return a promise; the
// queue is rendered by components/DialogHost.jsx.
export const useDialogs = create(() => ({ queue: [] }))

function push(dialog) {
  return new Promise((resolve) => {
    useDialogs.setState((s) => ({ queue: [...s.queue, { ...dialog, id: Date.now() + Math.random(), resolve }] }))
  })
}

// Removes the front dialog and settles its promise.
export function settleDialog(id, value) {
  const d = useDialogs.getState().queue.find((x) => x.id === id)
  useDialogs.setState((s) => ({ queue: s.queue.filter((x) => x.id !== id) }))
  d?.resolve(value)
}

// showAlert(message, { title? }) → Promise<void>
export function showAlert(message, options = {}) {
  return push({ kind: 'alert', message, ...options })
}

// showConfirm(message, { title?, confirmLabel?, danger? }) → Promise<boolean>
export function showConfirm(message, options = {}) {
  return push({ kind: 'confirm', message, ...options })
}
