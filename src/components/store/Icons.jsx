const base = { width: 22, height: 22, viewBox: '0 0 24 24', fill: 'none', 'aria-hidden': true }
const stroke = { stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' }

export const WhatsAppIcon = (p) => (
  <svg {...base} {...p}>
    <path
      fill="currentColor"
      d="M12.04 2a9.9 9.9 0 0 0-8.43 15.1L2 22l5.03-1.58A9.9 9.9 0 1 0 12.04 2Zm0 18.1a8.2 8.2 0 0 1-4.18-1.14l-.3-.18-2.99.94.97-2.9-.2-.31a8.2 8.2 0 1 1 6.7 3.59Zm4.5-6.14c-.25-.12-1.46-.72-1.69-.8-.23-.09-.39-.13-.56.12-.16.25-.64.8-.78.97-.14.16-.29.19-.54.06a6.7 6.7 0 0 1-3.3-2.88c-.25-.43.25-.4.72-1.33.08-.16.04-.3-.02-.43-.06-.12-.56-1.35-.77-1.85-.2-.48-.4-.42-.56-.43h-.47a.9.9 0 0 0-.65.3c-.22.25-.85.83-.85 2.03s.87 2.35.99 2.52c.12.16 1.71 2.6 4.14 3.65 1.54.66 2.14.72 2.91.6.47-.07 1.46-.6 1.67-1.17.2-.58.2-1.07.14-1.18-.06-.1-.22-.16-.47-.28Z"
    />
  </svg>
)

export const InstagramIcon = (p) => (
  <svg {...base} {...stroke} {...p}>
    <rect x="3" y="3" width="18" height="18" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.3" cy="6.7" r="0.6" fill="currentColor" />
  </svg>
)

export const PinIcon = (p) => (
  <svg {...base} {...stroke} {...p}>
    <path d="M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11Z" />
    <circle cx="12" cy="10" r="2.5" />
  </svg>
)

export const SearchIcon = (p) => (
  <svg {...base} {...stroke} {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </svg>
)

export const CloseIcon = (p) => (
  <svg {...base} {...stroke} {...p}>
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
)

export const ClockIcon = (p) => (
  <svg {...base} {...stroke} {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </svg>
)

export const CartIcon = (p) => (
  <svg {...base} {...stroke} {...p}>
    <path d="M3 4h2.4l2.1 10.2a1.5 1.5 0 0 0 1.5 1.2h8.2a1.5 1.5 0 0 0 1.5-1.1L20.5 8H6.2" />
    <circle cx="9.5" cy="19.5" r="1.3" fill="currentColor" />
    <circle cx="17" cy="19.5" r="1.3" fill="currentColor" />
  </svg>
)
export const PlusIcon = (p) => (
  <svg {...base} {...stroke} strokeWidth={2.4} {...p}>
    <path d="M12 5v14M5 12h14" />
  </svg>
)
export const MinusIcon = (p) => (
  <svg {...base} {...stroke} strokeWidth={2.4} {...p}>
    <path d="M5 12h14" />
  </svg>
)
export const TrashIcon = (p) => (
  <svg {...base} {...stroke} {...p}>
    <path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a1.5 1.5 0 0 0 1.5 1.4h7A1.5 1.5 0 0 0 17 19l1-12M9 7V4.5h6V7" />
  </svg>
)
export const GridIcon = (p) => (
  <svg {...base} {...stroke} {...p}>
    <rect x="4" y="4" width="6.5" height="6.5" rx="1.5" />
    <rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5" />
    <rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5" />
    <rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5" />
  </svg>
)
export const ListIcon = (p) => (
  <svg {...base} {...stroke} {...p}>
    <path d="M9 6h11M9 12h11M9 18h11" />
    <circle cx="4.5" cy="6" r="1" fill="currentColor" />
    <circle cx="4.5" cy="12" r="1" fill="currentColor" />
    <circle cx="4.5" cy="18" r="1" fill="currentColor" />
  </svg>
)
export const ChevronIcon = ({ dir = 'right', ...p }) => (
  <svg {...base} {...stroke} {...p} style={{ transform: dir === 'left' ? 'rotate(180deg)' : undefined }}>
    <path d="m9 5 7 7-7 7" />
  </svg>
)
