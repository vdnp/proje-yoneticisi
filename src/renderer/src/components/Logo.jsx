// The app logo (lineal-color project board) as an inline SVG component.
// Mirrors build/logo.svg so branding stays consistent across icon + UI.
export default function Logo({ size = 22, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 256 256"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="256" height="256" rx="56" fill="#f4f5f8" />
      <g stroke="#151a23" strokeWidth="8" strokeLinecap="round">
        <line x1="52" y1="34" x2="104" y2="34" />
        <line x1="152" y1="34" x2="204" y2="34" />
        <line x1="52" y1="222" x2="104" y2="222" />
        <line x1="152" y1="222" x2="204" y2="222" />
        <line x1="34" y1="52" x2="34" y2="104" />
        <line x1="34" y1="152" x2="34" y2="204" />
        <line x1="222" y1="52" x2="222" y2="104" />
        <line x1="222" y1="152" x2="222" y2="204" />
      </g>
      <g stroke="#151a23" strokeWidth="7">
        <rect x="20" y="20" width="28" height="28" rx="7" fill="#e4e7ec" />
        <rect x="208" y="20" width="28" height="28" rx="7" fill="#e4e7ec" />
        <rect x="20" y="208" width="28" height="28" rx="7" fill="#e4e7ec" />
        <rect x="208" y="208" width="28" height="28" rx="7" fill="#e4e7ec" />
      </g>
      <g stroke="#151a23" strokeWidth="6" strokeLinejoin="round">
        <rect x="70" y="70" width="46" height="34" rx="7" fill="#fb7185" />
        <rect x="124" y="70" width="62" height="34" rx="7" fill="#93c5fd" />
        <rect x="70" y="112" width="116" height="30" rx="7" fill="#fb923c" />
        <rect x="70" y="150" width="34" height="36" rx="7" fill="#86efac" />
        <rect x="111" y="150" width="34" height="36" rx="7" fill="#c4b5fd" />
        <rect x="152" y="150" width="34" height="36" rx="7" fill="#fde047" />
      </g>
      <g stroke="#151a23" strokeWidth="5" strokeLinecap="round">
        <line x1="80" y1="82" x2="106" y2="82" />
        <line x1="80" y1="92" x2="100" y2="92" />
        <line x1="84" y1="121" x2="172" y2="121" />
        <line x1="84" y1="132" x2="172" y2="132" />
        <line x1="119" y1="162" x2="137" y2="162" />
        <line x1="119" y1="172" x2="137" y2="172" />
      </g>
    </svg>
  )
}
