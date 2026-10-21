import { useEffect, useState } from 'react'
import { cn } from '../lib/utils.js'
import api from '../lib/api.js'
import { useI18n } from '../lib/i18n.js'

// Minimize / maximize / close with the app's own glyphs: a line, two corner
// brackets (pointing inward once maximized) and a cross. On hover a short
// accent underline grows under the button; red for close.
const noDrag = { WebkitAppRegion: 'no-drag' }

const GLYPHS = {
  min: <path d="M2.5 6h7" />,
  max: <path d="M2.5 5V2.5H5M7 9.5h2.5V7" />,
  restore: <path d="M5 2.5V5H2.5M9.5 7H7v2.5" />,
  close: <path d="M3 3l6 6M9 3l-6 6" />
}

function ControlButton({ title, glyph, onClick, danger }) {
  return (
    <button
      title={title}
      aria-label={title}
      onClick={onClick}
      style={noDrag}
      className={cn(
        'group/wc relative grid h-7 w-8 place-items-center rounded-lg text-content-secondary transition-colors',
        'hover:bg-surface-hover',
        danger ? 'hover:text-rose-400' : 'hover:text-content-primary'
      )}
    >
      <svg
        width="12"
        height="12"
        viewBox="0 0 12 12"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {GLYPHS[glyph]}
      </svg>
      <span
        aria-hidden="true"
        className={cn(
          'absolute bottom-0.5 left-1/2 h-0.5 w-0 -translate-x-1/2 rounded-full transition-all duration-200 group-hover/wc:w-3',
          danger ? 'bg-rose-400' : 'bg-brand'
        )}
      />
    </button>
  )
}

// `closeOnly` (the mini window) shows just the close button, wired to `onClose`.
export default function WindowControls({ closeOnly = false, onClose }) {
  const [maximized, setMaximized] = useState(false)
  const { t } = useI18n()

  useEffect(() => {
    if (!api.isElectron || closeOnly) return
    api.windowIsMaximized().then(setMaximized)
    return api.onWindowMaximize(setMaximized)
  }, [closeOnly])

  return (
    <div className="flex items-center gap-0.5 pr-1.5">
      {!closeOnly && (
        <>
          <ControlButton title={t('titlebar.minimize')} glyph="min" onClick={() => api.windowMinimize()} />
          <ControlButton
            title={maximized ? t('titlebar.restore') : t('titlebar.maximize')}
            glyph={maximized ? 'restore' : 'max'}
            onClick={() => api.windowMaximizeToggle()}
          />
        </>
      )}
      <ControlButton title={t('titlebar.close')} glyph="close" danger onClick={onClose || (() => api.windowClose())} />
    </div>
  )
}
