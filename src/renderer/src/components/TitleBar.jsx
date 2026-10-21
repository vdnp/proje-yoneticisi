import { useEffect, useState } from 'react'
import { ArrowLeft, ArrowRight, ChevronRight, Moon, Sun, Pin, PictureInPicture } from './Icons.jsx'
import WindowControls from './WindowControls.jsx'
import { cn } from '../lib/utils.js'
import api from '../lib/api.js'
import { useI18n } from '../lib/i18n.js'
import useStore from '../store/useStore.js'

// Frameless-window title bar: back/forward and the current location on the
// left, quick toggles and the window controls on the right. The strip is a
// drag region; every control opts out with no-drag. Nothing here may sit on
// top of a control: Electron's drag regions ignore pointer-events, so an
// overlapping drag area would swallow the control's clicks.
const drag = { WebkitAppRegion: 'drag' }
const noDrag = { WebkitAppRegion: 'no-drag' }

function BarButton({ title, onClick, disabled, active, children }) {
  return (
    <button
      title={title}
      aria-label={title}
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      style={noDrag}
      className={cn(
        'grid h-7 w-7 place-items-center rounded-lg transition',
        active ? 'bg-brand/15 text-brand' : 'text-content-faint hover:bg-surface-hover hover:text-content-primary',
        disabled && 'pointer-events-none opacity-35'
      )}
    >
      {children}
    </button>
  )
}

// One location segment: earlier ones are links back, the last one is the
// current page, tinted with its color (group / project) when it has one.
function Crumb({ crumb, current }) {
  const tint = crumb.color
  return (
    <button
      onClick={current ? undefined : crumb.onClick}
      disabled={current || !crumb.onClick}
      style={{
        ...noDrag,
        ...(current && tint
          ? { backgroundColor: `color-mix(in srgb, ${tint} 16%, transparent)`, '--pm': tint }
          : null)
      }}
      className={cn(
        'inline-flex max-w-[260px] items-center gap-1.5 truncate rounded-full border px-2.5 py-0.5 text-xs font-medium transition',
        current
          ? cn('border-transparent', tint ? 'pm-mark' : 'bg-brand/15 text-brand')
          : 'border-surface-border text-content-secondary hover:border-brand/40 hover:text-content-primary'
      )}
    >
      {tint && <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: tint }} />}
      <span className="truncate">{crumb.label}</span>
    </button>
  )
}

export default function TitleBar({ crumbs = [], canBack, canForward, onBack, onForward }) {
  const theme = useStore((s) => s.settings.theme)
  const updateSettings = useStore((s) => s.updateSettings)
  const [onTop, setOnTop] = useState(false)
  const { t } = useI18n()

  useEffect(() => {
    if (api.isAlwaysOnTop) api.isAlwaysOnTop().then(setOnTop)
  }, [])

  const toggleOnTop = async () => setOnTop(await api.setAlwaysOnTop(!onTop))
  const isLight = theme === 'light'

  return (
    <div
      style={drag}
      className="pm-glass relative flex h-10 shrink-0 select-none items-center gap-3 border-b border-surface-border bg-surface-bg pl-2"
    >
      <div className="flex items-center gap-0.5">
        <BarButton title={`${t('titlebar.back')} (Alt+←)`} onClick={onBack} disabled={!canBack}>
          <ArrowLeft size={16} />
        </BarButton>
        <BarButton title={`${t('titlebar.forward')} (Alt+→)`} onClick={onForward} disabled={!canForward}>
          <ArrowRight size={16} />
        </BarButton>
      </div>

      <nav aria-label={t('titlebar.location')} className="flex min-w-0 items-center gap-1">
        {crumbs.map((c, i) => (
          <span key={c.key} className="flex min-w-0 items-center gap-1">
            {i > 0 && <ChevronRight size={13} className="shrink-0 text-content-faint" />}
            <Crumb crumb={c} current={i === crumbs.length - 1} />
          </span>
        ))}
      </nav>

      <div className="ml-auto flex h-full items-center gap-0.5">
        <BarButton
          title={isLight ? t('titlebar.darkTheme') : t('titlebar.lightTheme')}
          onClick={() => updateSettings({ theme: isLight ? 'dark' : 'light' })}
        >
          {isLight ? <Moon size={15} /> : <Sun size={15} />}
        </BarButton>
        <BarButton title={t('titlebar.alwaysOnTop')} onClick={toggleOnTop} active={onTop}>
          <Pin size={15} fill={onTop ? 'currentColor' : 'none'} />
        </BarButton>
        <BarButton title={t('titlebar.mini')} onClick={() => api.openMini()}>
          <PictureInPicture size={15} />
        </BarButton>
        <span className="mx-1.5 h-4 w-px bg-surface-border" aria-hidden="true" />
        <WindowControls />
      </div>
    </div>
  )
}
