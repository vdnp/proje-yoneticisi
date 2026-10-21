import { useEffect } from 'react'
import { useI18n } from '../lib/i18n.js'
import useStore from '../store/useStore.js'

const VISIBLE_MS = 6000

// "Project removed · Undo" after a removal. A newer removal replaces it and
// restarts the timer; once it times out the removal is final.
export default function UndoToast() {
  const removed = useStore((s) => s.lastRemoved)
  const undo = useStore((s) => s.undo)
  const dismissUndo = useStore((s) => s.dismissUndo)
  const { t } = useI18n()

  useEffect(() => {
    if (!removed) return
    const timer = setTimeout(() => dismissUndo(removed), VISIBLE_MS)
    return () => clearTimeout(timer)
  }, [removed, dismissUndo])

  if (!removed) return null

  const count = removed.kind === 'projects' ? removed.items.length : 0
  const text =
    removed.kind === 'todo'
      ? t('undo.todoRemoved')
      : count === 1
        ? t('undo.projectRemoved')
        : t('undo.projectsRemoved', { count })

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-16 z-40 flex justify-center px-4">
      <div
        role="status"
        className="pointer-events-auto flex animate-fadein items-center gap-3 rounded-xl border border-surface-border bg-surface-card py-1.5 pl-4 pr-1.5 text-sm text-content-primary shadow-lg"
      >
        <span>{text}</span>
        <button
          onClick={undo}
          className="rounded-lg px-2.5 py-1 text-sm font-semibold text-brand transition hover:bg-brand/10"
        >
          {t('undo.action')}
        </button>
      </div>
    </div>
  )
}
