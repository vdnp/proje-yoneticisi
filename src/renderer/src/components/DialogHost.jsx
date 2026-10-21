import { useEffect, useRef } from 'react'
import { AlertTriangle, Trash } from './Icons.jsx'
import { cn } from '../lib/utils.js'
import { useI18n } from '../lib/i18n.js'
import { useDialogs, settleDialog } from '../lib/dialogs.js'

// Renders the front dialog queued by showAlert / showConfirm (lib/dialogs.js).
// Enter accepts, Esc (or a click on the backdrop) cancels.
export default function DialogHost() {
  const dialog = useDialogs((s) => s.queue[0])
  const { t } = useI18n()
  const okRef = useRef(null)

  useEffect(() => {
    if (!dialog) return
    okRef.current?.focus()
    const onKey = (e) => {
      if (e.key === 'Escape') {
        // Keep page-level Esc handlers (go back, clear selection) out of it.
        e.stopImmediatePropagation()
        settleDialog(dialog.id, false)
      }
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [dialog])

  if (!dialog) return null
  const isConfirm = dialog.kind === 'confirm'
  const Icon = dialog.danger ? Trash : AlertTriangle

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={() => settleDialog(dialog.id, false)}
    >
      <div
        role={isConfirm ? 'alertdialog' : 'dialog'}
        aria-modal="true"
        aria-label={dialog.title || t('app.name')}
        onClick={(e) => e.stopPropagation()}
        className="pm-elevated w-full max-w-sm animate-fadein rounded-2xl border border-surface-border bg-surface-card p-5 shadow-[0_18px_48px_rgb(0_0_0_/_0.35)]"
      >
        <div className="flex gap-3">
          <span
            className={cn(
              'grid h-9 w-9 shrink-0 place-items-center rounded-xl',
              dialog.danger ? 'bg-rose-500/15 text-rose-400' : 'bg-brand/15 text-brand'
            )}
          >
            <Icon size={18} />
          </span>
          <div className="min-w-0 flex-1 pt-0.5">
            {dialog.title && <h2 className="mb-1 text-sm font-semibold text-content-primary">{dialog.title}</h2>}
            <p className="whitespace-pre-line break-words text-sm leading-relaxed text-content-secondary">
              {dialog.message}
            </p>
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          {isConfirm && (
            <button
              onClick={() => settleDialog(dialog.id, false)}
              className="rounded-xl border border-surface-border px-3.5 py-2 text-sm font-medium text-content-secondary transition hover:bg-surface-hover"
            >
              {t('common.cancel')}
            </button>
          )}
          <button
            ref={okRef}
            onClick={() => settleDialog(dialog.id, true)}
            className={cn(
              'rounded-xl px-3.5 py-2 text-sm font-semibold outline-none transition hover:brightness-110 focus-visible:ring-2',
              dialog.danger
                ? 'bg-rose-500 text-white focus-visible:ring-rose-400/40'
                : 'bg-brand text-onbrand focus-visible:ring-brand/40'
            )}
          >
            {isConfirm ? dialog.confirmLabel || t('common.apply') : t('common.ok')}
          </button>
        </div>
      </div>
    </div>
  )
}
