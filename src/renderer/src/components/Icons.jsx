// Minimal inline SVG icon set (stroke-based, inherits currentColor).
// Keeps the bundle dependency-free.

const base = {
  width: 18,
  height: 18,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round'
}

const make = (paths) =>
  function Icon({ size = 18, className = '', ...rest }) {
    return (
      <svg {...base} width={size} height={size} className={className} {...rest}>
        {paths}
      </svg>
    )
  }

export const Search = make(
  <>
    <circle cx="11" cy="11" r="7" />
    <path d="m21 21-4.3-4.3" />
  </>
)
export const Plus = make(
  <>
    <path d="M12 5v14M5 12h14" />
  </>
)
export const Star = make(<path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 17l-5.2 2.6 1-5.8L3.5 9.7l5.9-.9L12 3.5z" />)
export const Grid = make(
  <>
    <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
    <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
    <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
    <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" />
  </>
)
export const List = make(
  <>
    <path d="M8 6h13M8 12h13M8 18h13" />
    <circle cx="3.5" cy="6" r="1" fill="currentColor" stroke="none" />
    <circle cx="3.5" cy="12" r="1" fill="currentColor" stroke="none" />
    <circle cx="3.5" cy="18" r="1" fill="currentColor" stroke="none" />
  </>
)
export const Code = make(
  <>
    <path d="m16 18 4-6-4-6M8 6l-4 6 4 6" />
  </>
)
export const Folder = make(
  <path d="M3 7a2 2 0 0 1 2-2h4l2 2h6a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" />
)
export const Github = make(
  <path
    d="M9 19c-4 1.5-4-2-6-2m12 4v-3.5c0-1 .1-1.4-.5-2 2.8-.3 5.5-1.4 5.5-6a4.6 4.6 0 0 0-1.3-3.2 4.2 4.2 0 0 0-.1-3.2s-1-.3-3.4 1.3a11.7 11.7 0 0 0-6 0C7.3 3.1 6.3 3.4 6.3 3.4a4.2 4.2 0 0 0-.1 3.2A4.6 4.6 0 0 0 4.9 9.8c0 4.6 2.7 5.7 5.5 6-.6.6-.6 1.2-.5 2V21"
    strokeWidth="1.6"
  />
)
export const Settings = make(
  <>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z"
    strokeWidth="1.4" />
  </>
)
export const ArrowLeft = make(<path d="M19 12H5m6-7-7 7 7 7" />)
export const Trash = make(
  <>
    <path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m-9 0 1 12a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1l1-12" />
  </>
)
export const Check = make(<path d="M20 6 9 17l-5-5" />)
export const Edit = make(
  <>
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
  </>
)
export const ChevronUp = make(<path d="m6 15 6-6 6 6" />)
export const ChevronDown = make(<path d="m6 9 6 6 6-6" />)
export const X = make(<path d="M18 6 6 18M6 6l12 12" />)
export const Clock = make(
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </>
)
export const Sun = make(
  <>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
  </>
)
export const Moon = make(<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />)
export const CheckSquare = make(
  <>
    <path d="M9 11l3 3 8-8" />
    <path d="M20 12v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h9" />
  </>
)
export const Pin = make(
  <>
    <path d="M12 17v5" />
    <path d="M9 3h6l-.7 4.2a2 2 0 0 0 .5 1.7l2.5 2.6a1 1 0 0 1-.7 1.7H7.4a1 1 0 0 1-.7-1.7l2.5-2.6a2 2 0 0 0 .5-1.7L9 3z" />
  </>
)
export const Play = make(<path d="M7 4.5v15l13-7.5-13-7.5z" />)
export const Terminal = make(
  <>
    <path d="m4 6 5 6-5 6M13 18h7" />
  </>
)
export const Layers = make(
  <>
    <path d="m12 3 9 5-9 5-9-5 9-5z" />
    <path d="m3 13 9 5 9-5" />
  </>
)
export const Scan = make(
  <>
    <path d="M3 8V5a2 2 0 0 1 2-2h3M16 3h3a2 2 0 0 1 2 2v3M21 16v3a2 2 0 0 1-2 2h-3M8 21H5a2 2 0 0 1-2-2v-3" />
    <path d="M7 12h10" />
  </>
)
export const GitBranch = make(
  <>
    <circle cx="6" cy="5" r="2" />
    <circle cx="6" cy="19" r="2" />
    <circle cx="18" cy="7" r="2" />
    <path d="M6 7v10M18 9c0 5-6 4-11.3 8.6" />
  </>
)
export const RefreshCw = make(
  <>
    <path d="M20 11a8 8 0 0 0-14.6-4.5L4 8M4 4v4h4" />
    <path d="M4 13a8 8 0 0 0 14.6 4.5L20 16M20 20v-4h-4" />
  </>
)
export const AlertTriangle = make(
  <>
    <path d="M10.3 4.3 2.6 18a2 2 0 0 0 1.7 3h15.4a2 2 0 0 0 1.7-3L13.7 4.3a2 2 0 0 0-3.4 0z" />
    <path d="M12 9v4M12 17h.01" />
  </>
)
export const Download = make(<path d="M12 4v11m0 0-4-4m4 4 4-4M5 20h14" />)
export const Upload = make(<path d="M12 16V5m0 0-4 4m4-4 4 4M5 20h14" />)
export const ListChecks = make(
  <>
    <path d="m3 6 2 2 3-3M3 13l2 2 3-3M3 19.5h4" />
    <path d="M12 7h9M12 14h9M12 19.5h9" />
  </>
)
export const FileText = make(
  <>
    <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5z" />
    <path d="M14 3v5h5M9 13h6M9 17h4" />
  </>
)
export const Dots = make(
  <>
    <circle cx="12" cy="5" r="1.4" fill="currentColor" stroke="none" />
    <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" />
    <circle cx="12" cy="19" r="1.4" fill="currentColor" stroke="none" />
  </>
)
