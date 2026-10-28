import type { Color, PieceSymbol } from 'chess.js'

/**
 * Original flat chess pieces (viewBox 0 0 100 100). Drawn back-to-front so
 * overlapping outlines read as detail lines.
 */
const PALETTE = {
  w: { fill: '#FBFAF6', stroke: '#23272E', detail: '#23272E' },
  b: { fill: '#2C3038', stroke: '#0D0F12', detail: '#AEB6C4' },
}

function Shapes({ type, c }: { type: PieceSymbol; c: (typeof PALETTE)['w'] }) {
  const base = { fill: c.fill, stroke: c.stroke, strokeWidth: 3, strokeLinejoin: 'round' as const }
  const detail = { fill: 'none', stroke: c.detail, strokeWidth: 3, strokeLinecap: 'round' as const }
  switch (type) {
    case 'p':
      return (
        <>
          <path {...base} d="M41 46C40 58 34 66 28 75H72C66 66 60 58 59 46Z" />
          <rect {...base} x="24" y="75" width="52" height="11" rx="4" />
          <rect {...base} x="35" y="40" width="30" height="7" rx="3.5" />
          <circle {...base} cx="50" cy="27" r="12.5" />
        </>
      )
    case 'r':
      return (
        <>
          <rect {...base} x="35" y="40" width="30" height="28" />
          <path {...base} d="M29 76L33 67H67L71 76Z" />
          <rect {...base} x="24" y="76" width="52" height="10" rx="4" />
          <path {...base} d="M30 33H70L65 41H35Z" />
          <path {...base} d="M28 15H37V22H45V15H55V22H63V15H72V33H28Z" />
          <path {...detail} d="M39 52H61" strokeWidth={2.4} />
        </>
      )
    case 'n':
      return (
        <>
          <path
            {...base}
            d="M33 79h36v-5.5c0-3-2-4.8-4.6-5.6-2.6-9.8-.8-17.8 4.4-24.6 3.4-4.4 3.6-10.1.4-14.4-4.6-6.1-11.9-8.9-19.7-8.4L45.7 16l-3.3 6.4c-6.7 2.4-11.4 7.9-13.6 14.6l-5.3 9.3c-1.2 2.6.6 5.2 3.6 5.1l6.6-1.7c2.2-.3 4.2-1.5 5.8-3.1 1.5 4.3-1.1 8.6-4.9 12.5-3.4 3.5-5.4 7.7-5.6 12.5-2.6.9-4 2.9-4 5.6z"
          />
          <rect {...base} x="24" y="77" width="52" height="10" rx="4" />
          <circle cx="45" cy="32" r="2.8" fill={c.detail} />
          <path {...detail} d="M60.5 27c3.5 4.5 4 10 1 15.5" strokeWidth={2.4} />
          <path {...detail} d="M29.5 45.5l3-1" strokeWidth={2.4} />
        </>
      )
    case 'b':
      return (
        <>
          <path {...base} d="M31 77C33 72 37 69 42 68H58C63 69 67 72 69 77Z" />
          <rect {...base} x="24" y="77" width="52" height="10" rx="4" />
          <path {...base} d="M50 21C38 31 32 41 32 51C32 60 39 66 50 67C61 66 68 60 68 51C68 41 62 31 50 21Z" />
          <rect {...base} x="37" y="62" width="26" height="7" rx="3.5" />
          <circle {...base} cx="50" cy="15" r="5.5" />
          <path {...detail} d="M57 34L46 47" strokeWidth={3.4} />
        </>
      )
    case 'q':
      return (
        <>
          <path {...base} d="M31 71L24 36L33 51L37 27L44 48L50 23L56 48L63 27L67 51L76 36L69 71Z" />
          <path {...base} d="M30 71H70L72 77H28Z" />
          <rect {...base} x="24" y="77" width="52" height="10" rx="4" />
          {[
            [24, 33],
            [37, 24.5],
            [50, 20],
            [63, 24.5],
            [76, 33],
          ].map(([x, y]) => (
            <circle key={x} {...base} cx={x} cy={y} r="4.6" strokeWidth={2.6} />
          ))}
          <path {...detail} d="M34 63Q50 58 66 63" strokeWidth={2.4} />
        </>
      )
    case 'k':
      return (
        <>
          <path {...base} d="M31 71C24 63 22 52 28 45C34 38 43 41 50 50C57 41 66 38 72 45C78 52 76 63 69 71Z" />
          <path {...base} d="M50 50C45 44 44 37 46 31H54C56 37 55 44 50 50Z" />
          <path {...base} d="M30 71H70L72 77H28Z" />
          <rect {...base} x="24" y="77" width="52" height="10" rx="4" />
          <path {...base} d="M47.5 8H52.5V14H58V19H52.5V31H47.5V19H42V14H47.5Z" strokeWidth={2.6} />
          <path {...detail} d="M34 64Q50 58 66 64" strokeWidth={2.4} />
        </>
      )
  }
}

const NAMES: Record<PieceSymbol, string> = { p: 'pawn', n: 'knight', b: 'bishop', r: 'rook', q: 'queen', k: 'king' }

export function pieceName(color: Color, type: PieceSymbol) {
  return `${color === 'w' ? 'white' : 'black'} ${NAMES[type]}`
}

export function PieceSvg({ color, type, className }: { color: Color; type: PieceSymbol; className?: string }) {
  return (
    <svg className={className} viewBox="0 0 100 100" aria-hidden="true" focusable="false">
      <Shapes type={type} c={PALETTE[color]} />
    </svg>
  )
}
