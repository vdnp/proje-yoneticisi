import { useEffect, useState } from 'react'
import Logo from './Logo.jsx'
import api from '../lib/api.js'
import { useI18n } from '../lib/i18n.js'

// Frameless-window title bar, macOS style: traffic-light controls on the left,
// centered title. The strip is a drag region; controls opt out with no-drag.
const drag = { WebkitAppRegion: 'drag' }
const noDrag = { WebkitAppRegion: 'no-drag' }

const glyphs = {
  close: (
    <path d="M2 2l4 4M6 2l-4 4" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
  ),
  min: <line x1="1.5" y1="4" x2="6.5" y2="4" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />,
  max: (
    <>
      <path d="M2 2.4L2 5L4.6 2z" fill="currentColor" />
      <path d="M6 5.6L6 3L3.4 6z" fill="currentColor" />
    </>
  )
}

function Light({ color, glyph, onClick, title }) {
  return (
    <button
      title={title}
      aria-label={title}
      onClick={onClick}
      style={{ ...noDrag, backgroundColor: color }}
      className="grid h-3 w-3 place-items-center rounded-full ring-1 ring-inset ring-black/15 transition active:brightness-90"
    >
      <svg width="8" height="8" viewBox="0 0 8 8" className="text-black/55 opacity-0 transition group-hover:opacity-100">
        {glyph}
      </svg>
    </button>
  )
}

export default function TitleBar() {
  const [maximized, setMaximized] = useState(false)
  const { t } = useI18n()

  useEffect(() => {
    if (!api.isElectron) return
    api.windowIsMaximized().then(setMaximized)
    return api.onWindowMaximize(setMaximized)
  }, [])

  return (
    <div
      style={drag}
      className="relative flex h-8 shrink-0 select-none items-center border-b border-surface-border bg-surface-bg"
    >
      {/* traffic lights (left) */}
      <div className="group flex items-center gap-2 pl-3.5">
        <Light color="#ff5f57" glyph={glyphs.close} onClick={() => api.windowClose()} title={t('titlebar.close')} />
        <Light color="#febc2e" glyph={glyphs.min} onClick={() => api.windowMinimize()} title={t('titlebar.minimize')} />
        <Light
          color="#28c840"
          glyph={glyphs.max}
          onClick={() => api.windowMaximizeToggle()}
          title={maximized ? t('titlebar.restore') : t('titlebar.maximize')}
        />
      </div>

      {/* centered title */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center gap-2">
        <Logo size={15} />
        <span className="text-xs font-semibold text-content-secondary">{t('app.name')}</span>
      </div>
    </div>
  )
}
