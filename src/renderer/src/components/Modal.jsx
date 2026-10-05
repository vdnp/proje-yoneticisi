import { useEffect } from 'react'
import { X } from './Icons.jsx'

export default function Modal({ title, onClose, children, width = 'max-w-lg' }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        className={`w-full ${width} animate-fadein rounded-2xl border border-surface-border bg-surface-card shadow-card-hover`}
      >
        <div className="flex items-center justify-between border-b border-surface-border px-5 py-3.5">
          <h2 className="text-sm font-semibold text-content-primary">{title}</h2>
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-lg text-content-faint transition hover:bg-surface-hover hover:text-content-primary"
          >
            <X size={18} />
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  )
}
