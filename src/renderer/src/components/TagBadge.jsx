import { cn } from '../lib/utils.js'

// Deterministic accent color per tag label so the same tag looks consistent.
const PALETTE = [
  'text-indigo-300 bg-indigo-500/10 ring-indigo-500/20',
  'text-emerald-300 bg-emerald-500/10 ring-emerald-500/20',
  'text-amber-300 bg-amber-500/10 ring-amber-500/20',
  'text-sky-300 bg-sky-500/10 ring-sky-500/20',
  'text-rose-300 bg-rose-500/10 ring-rose-500/20',
  'text-violet-300 bg-violet-500/10 ring-violet-500/20',
  'text-teal-300 bg-teal-500/10 ring-teal-500/20'
]

function hash(str) {
  let h = 0
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0
  return Math.abs(h)
}

export default function TagBadge({ label, className = '' }) {
  const color = PALETTE[hash(label) % PALETTE.length]
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md px-1.5 py-0.5 text-[11px] font-medium ring-1 ring-inset',
        color,
        className
      )}
    >
      {label}
    </span>
  )
}
