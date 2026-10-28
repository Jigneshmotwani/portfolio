/** Hand-drawn status bar and lock screen glyphs (currentColor). */

export function SignalGlyph() {
  return (
    <svg className="ios-glyph" width="18" height="12" viewBox="0 0 18 12" aria-hidden="true">
      <rect x="0" y="8" width="3.2" height="4" rx="1" fill="currentColor" />
      <rect x="4.8" y="5.6" width="3.2" height="6.4" rx="1" fill="currentColor" />
      <rect x="9.6" y="3" width="3.2" height="9" rx="1" fill="currentColor" />
      <rect x="14.4" y="0" width="3.2" height="12" rx="1" fill="currentColor" />
    </svg>
  )
}

export function WifiGlyph() {
  return (
    <svg className="ios-glyph" width="16" height="12" viewBox="0 0 16 12" aria-hidden="true">
      <path d="M1.35 4.55a9.4 9.4 0 0 1 13.3 0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M4.04 7.24a5.6 5.6 0 0 1 7.92 0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="8" cy="10.2" r="1.6" fill="currentColor" />
    </svg>
  )
}

export function BatteryGlyph({ level = 1, charging = false }: { level?: number; charging?: boolean }) {
  const w = Math.max(2, Math.round(19 * Math.min(1, Math.max(0, level))))
  const low = level <= 0.2 && !charging
  return (
    <svg className="ios-glyph" width="27" height="13" viewBox="0 0 27 13" aria-hidden="true">
      <rect x=".6" y=".6" width="23" height="11.8" rx="3.6" fill="none" stroke="currentColor" strokeOpacity=".4" strokeWidth="1.1" />
      <rect x="2.4" y="2.4" width={w} height="8.2" rx="2" fill={low ? '#ff3b30' : charging ? '#34c759' : 'currentColor'} />
      <path d="M25.2 4.4v4.2c.9-.3 1.5-1.1 1.5-2.1s-.6-1.8-1.5-2.1Z" fill="currentColor" fillOpacity=".45" />
    </svg>
  )
}

export function LockGlyph({ open = false }: { open?: boolean }) {
  return (
    <svg width="16" height="22" viewBox="0 0 16 22" aria-hidden="true">
      <path
        d={open ? 'M4.2 9V5.8a3.8 3.8 0 0 1 7.5-.9' : 'M4.2 9V6.2a3.8 3.8 0 0 1 7.6 0V9'}
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <rect x="1" y="9" width="14" height="11.5" rx="3" fill="currentColor" />
    </svg>
  )
}

export function FlashlightGlyph() {
  return (
    <svg width="18" height="26" viewBox="0 0 18 26" aria-hidden="true">
      <path d="M2 1.5h14v4.2L12.5 10v13a2 2 0 0 1-2 2h-3a2 2 0 0 1-2-2V10L2 5.7Z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M2.4 5.5h13.2" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="9" cy="14.5" r="1.6" fill="currentColor" />
    </svg>
  )
}

export function CameraGlyph() {
  return (
    <svg width="26" height="20" viewBox="0 0 26 20" aria-hidden="true">
      <path
        d="M9.4 1.5h7.2l1.8 2.6h3.6A2.5 2.5 0 0 1 24.5 6.6v9.4a2.5 2.5 0 0 1-2.5 2.5H4A2.5 2.5 0 0 1 1.5 16V6.6A2.5 2.5 0 0 1 4 4.1h3.6Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <circle cx="13" cy="11" r="4.2" fill="none" stroke="currentColor" strokeWidth="2" />
    </svg>
  )
}

export function SearchGlyph({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" aria-hidden="true">
      <circle cx="6" cy="6" r="4.6" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M9.5 9.5 13 13" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
    </svg>
  )
}

export function DocGlyph() {
  return (
    <svg width="11" height="13" viewBox="0 0 11 13" aria-hidden="true">
      <path d="M2 .8h4.6L10 4.2V11a1.4 1.4 0 0 1-1.4 1.4H2A1.4 1.4 0 0 1 .6 11V2.2A1.4 1.4 0 0 1 2 .8Z" fill="none" stroke="currentColor" strokeWidth="1.3" />
      <path d="M3 6.4h4.6M3 8.8h3.4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  )
}

export function PlayGlyph({ playing }: { playing: boolean }) {
  return playing ? (
    <svg width="20" height="22" viewBox="0 0 20 22" aria-hidden="true">
      <rect x="3" y="2" width="5" height="18" rx="1.5" fill="currentColor" />
      <rect x="12" y="2" width="5" height="18" rx="1.5" fill="currentColor" />
    </svg>
  ) : (
    <svg width="20" height="22" viewBox="0 0 20 22" aria-hidden="true">
      <path d="M4 2.6v16.8c0 1 1 1.6 1.9 1.1l13-8.4c.8-.5.8-1.7 0-2.2l-13-8.4C5 .9 4 1.6 4 2.6Z" fill="currentColor" />
    </svg>
  )
}

export function SkipGlyph({ dir }: { dir: 'next' | 'prev' }) {
  return (
    <svg width="26" height="16" viewBox="0 0 26 16" aria-hidden="true" style={dir === 'prev' ? { transform: 'scaleX(-1)' } : undefined}>
      <path d="M1 1.6v12.8c0 .8.9 1.3 1.6.8L12 9c.6-.4.6-1.3 0-1.7L2.6.8C1.9.3 1 .8 1 1.6Z" fill="currentColor" />
      <path d="M13 1.6v12.8c0 .8.9 1.3 1.6.8L24 9c.6-.4.6-1.3 0-1.7L14.6.8C13.9.3 13 .8 13 1.6Z" fill="currentColor" />
    </svg>
  )
}
