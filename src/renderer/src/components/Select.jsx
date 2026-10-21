import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown, Check } from './Icons.jsx'
import { cn } from '../lib/utils.js'

const SIZES = {
  md: 'gap-2 rounded-xl px-3 py-2 text-sm',
  sm: 'gap-2 rounded-lg px-2.5 py-1.5 text-sm',
  xs: 'gap-1.5 rounded-md px-2 py-1 text-xs'
}

// Themed dropdown in place of the native <select>, whose popup is drawn by
// the OS and ignores the app's theme and style. Listbox pattern: arrows,
// Home/End and letters move, Enter/Space picks, Esc or a click outside
// closes. The menu is portalled to <body> with fixed positioning so scroll
// containers can't clip it and translucent parents can't offset it.
//
// options: [{ value, label, hint?, dot? (CSS color) }]. When `value` matches
// no option the `placeholder` shows; "action" menus (pick something to do)
// keep value '' so the placeholder stays.
export default function Select({
  value,
  onChange,
  options,
  placeholder = '',
  label,
  icon: Icon,
  size = 'md',
  block = false,
  className,
  menuWidth = 200
}) {
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const [pos, setPos] = useState(null)
  const buttonRef = useRef(null)
  const menuRef = useRef(null)
  const listId = useId()

  const selectedIndex = options.findIndex((o) => o.value === value)
  const selected = options[selectedIndex]

  const openMenu = () => {
    setActive(selectedIndex >= 0 ? selectedIndex : 0)
    setOpen(true)
  }
  const close = () => {
    setOpen(false)
    setPos(null)
  }
  const pick = (option) => {
    close()
    buttonRef.current?.focus()
    if (option && option.value !== value) onChange(option.value)
  }

  // Place the menu under the button, or above it when there's more room there.
  useLayoutEffect(() => {
    if (!open) return
    const r = buttonRef.current.getBoundingClientRect()
    const height = Math.min(menuRef.current?.scrollHeight || options.length * 34 + 8, 288)
    const below = window.innerHeight - r.bottom - 8
    const up = below < height && r.top > below
    const width = Math.max(r.width, menuWidth)
    const left = Math.max(8, Math.min(r.left, window.innerWidth - width - 8))
    setPos(up ? { left, width, bottom: window.innerHeight - r.top + 6 } : { left, width, top: r.bottom + 6 })
  }, [open, options.length, menuWidth])

  // Close on a click outside, on resize, or when anything else scrolls.
  useEffect(() => {
    if (!open) return
    const onDown = (e) => {
      if (!buttonRef.current?.contains(e.target) && !menuRef.current?.contains(e.target)) close()
    }
    const onScroll = (e) => {
      if (!menuRef.current?.contains(e.target)) close()
    }
    window.addEventListener('mousedown', onDown, true)
    window.addEventListener('scroll', onScroll, true)
    window.addEventListener('resize', close)
    window.addEventListener('blur', close)
    return () => {
      window.removeEventListener('mousedown', onDown, true)
      window.removeEventListener('scroll', onScroll, true)
      window.removeEventListener('resize', close)
      window.removeEventListener('blur', close)
    }
  }, [open])

  // Keep the active option in view while arrowing through a long list.
  useEffect(() => {
    if (open && active >= 0) menuRef.current?.children[active]?.scrollIntoView({ block: 'nearest' })
  }, [open, active])

  // Handled keys stop here, so window-level shortcuts (arrow navigation over
  // the cards, Esc to go back) don't also react to them.
  const onKeyDown = (e) => {
    if (!open) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
        e.preventDefault()
        e.stopPropagation()
        openMenu()
      }
      return
    }
    const last = options.length - 1
    if (e.key === 'ArrowDown') setActive((i) => Math.min(last, i + 1))
    else if (e.key === 'ArrowUp') setActive((i) => Math.max(0, i - 1))
    else if (e.key === 'Home') setActive(0)
    else if (e.key === 'End') setActive(last)
    else if (e.key === 'Enter' || e.key === ' ') pick(options[active])
    else if (e.key === 'Escape') close()
    else if (e.key === 'Tab') return close()
    else if (e.key.length === 1) {
      // Jump to the next option starting with the typed letter.
      const ch = e.key.toLocaleLowerCase()
      const order = [...options.keys()].map((k) => (active + 1 + k) % options.length)
      const hit = order.find((i) => String(options[i].label).toLocaleLowerCase().startsWith(ch))
      if (hit !== undefined) setActive(hit)
    } else return
    e.preventDefault()
    e.stopPropagation()
  }

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-activedescendant={open && active >= 0 ? `${listId}-${active}` : undefined}
        aria-label={label}
        onClick={() => (open ? close() : openMenu())}
        onKeyDown={onKeyDown}
        className={cn(
          'inline-flex min-w-0 items-center border bg-surface-card text-left font-medium outline-none transition',
          'focus-visible:ring-2 focus-visible:ring-brand/30',
          open ? 'border-brand/50 ring-2 ring-brand/20' : 'border-surface-border hover:border-brand/40',
          SIZES[size],
          block && 'w-full',
          className
        )}
      >
        {Icon && <Icon size={size === 'xs' ? 13 : 15} className="shrink-0 text-content-faint" />}
        {selected?.dot && <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: selected.dot }} />}
        <span className={cn('min-w-0 flex-1 truncate', selected ? 'text-content-primary' : 'text-content-secondary')}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown
          size={size === 'xs' ? 13 : 15}
          className={cn('shrink-0 text-content-faint transition', open && 'rotate-180')}
        />
      </button>

      {open &&
        createPortal(
          <div
            ref={menuRef}
            id={listId}
            role="listbox"
            aria-label={label}
            style={pos ? { ...pos, position: 'fixed' } : { position: 'fixed', visibility: 'hidden' }}
            className={cn(
              'pm-elevated z-[70] max-h-72 animate-fadein overflow-y-auto rounded-xl border border-surface-border bg-surface-card p-1',
              'shadow-[0_14px_36px_rgb(0_0_0_/_0.28)]'
            )}
          >
            {options.map((o, i) => {
              const isSelected = o.value === value
              return (
                <div
                  key={String(o.value)}
                  id={`${listId}-${i}`}
                  role="option"
                  aria-selected={isSelected}
                  onMouseEnter={() => setActive(i)}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => pick(o)}
                  className={cn(
                    'flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm transition-colors',
                    i === active ? 'bg-surface-hover' : '',
                    isSelected ? 'text-brand' : 'text-content-primary'
                  )}
                >
                  {o.dot && <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: o.dot }} />}
                  <span className="min-w-0 flex-1 truncate">{o.label}</span>
                  {o.hint && <span className="shrink-0 font-mono text-[11px] text-content-faint">{o.hint}</span>}
                  <Check size={14} className={cn('shrink-0', isSelected ? 'opacity-100' : 'opacity-0')} />
                </div>
              )
            })}
          </div>,
          document.body
        )}
    </>
  )
}
