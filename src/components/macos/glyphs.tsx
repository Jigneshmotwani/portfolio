/* Small monochrome glyphs for the menu bar, traffic lights and menus (currentColor). */
import { useId, type SVGProps } from 'react'

type P = SVGProps<SVGSVGElement>

/** The "j" logo used in place of a vendor logo. */
export function LogoGlyph(props: P) {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true" {...props}>
      <circle cx="14.6" cy="4.3" r="2.25" fill="currentColor" />
      <path
        d="M14.6 9.2v8.4c0 3-1.9 4.8-4.8 4.8-1.5 0-2.8-.5-3.7-1.3"
        fill="none"
        stroke="currentColor"
        strokeWidth="3.1"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function WifiGlyph(props: P) {
  return (
    <svg viewBox="0 0 20 16" width="17" height="14" aria-hidden="true" {...props}>
      <path d="M10 14.2l2.3-2.6a3.4 3.4 0 0 0-4.6 0z" fill="currentColor" />
      <path d="M5.4 9.1a6.8 6.8 0 0 1 9.2 0" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
      <path d="M2.6 6a10.9 10.9 0 0 1 14.8 0" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
    </svg>
  )
}

export function BatteryGlyph({ level = 1, charging = false, ...props }: P & { level?: number; charging?: boolean }) {
  const w = Math.max(1.5, Math.round(17 * Math.min(1, Math.max(0, level)) * 10) / 10)
  return (
    <svg viewBox="0 0 27 13" width="25" height="12" aria-hidden="true" {...props}>
      <rect x="0.6" y="0.6" width="22.6" height="11.8" rx="3.4" fill="none" stroke="currentColor" strokeOpacity=".45" strokeWidth="1.2" />
      <rect x="2.6" y="2.6" width={w} height="7.8" rx="1.8" fill={level < 0.2 && !charging ? '#ff3b30' : 'currentColor'} />
      <path d="M24.7 4.4v4.2c.9-.3 1.5-1.1 1.5-2.1s-.6-1.8-1.5-2.1z" fill="currentColor" fillOpacity=".45" />
      {charging && <path d="M12.6 1.8l-4 5.2h3l-1 4.2 4-5.2h-3z" fill="#fff" stroke="currentColor" strokeWidth=".6" />}
    </svg>
  )
}

export function ControlCenterGlyph(props: P) {
  return (
    <svg viewBox="0 0 18 16" width="16" height="14" aria-hidden="true" {...props}>
      <rect x="1" y="1.5" width="16" height="5.4" rx="2.7" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="13.9" cy="4.2" r="1.7" fill="currentColor" />
      <rect x="1" y="9.1" width="16" height="5.4" rx="2.7" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="4.1" cy="11.8" r="1.7" fill="currentColor" />
    </svg>
  )
}

export function SearchGlyph(props: P) {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" {...props}>
      <circle cx="6.6" cy="6.6" r="4.9" fill="none" stroke="currentColor" strokeWidth="1.7" />
      <path d="M10.3 10.3l4.2 4.2" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
    </svg>
  )
}

export function MissionControlGlyph(props: P) {
  return (
    <svg viewBox="0 0 18 14" width="17" height="13" aria-hidden="true" {...props}>
      <rect x="0.8" y="0.8" width="7.2" height="5.4" rx="1.3" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <rect x="10" y="0.8" width="7.2" height="5.4" rx="1.3" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <rect x="0.8" y="7.8" width="7.2" height="5.4" rx="1.3" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <rect x="10" y="7.8" width="7.2" height="5.4" rx="1.3" fill="none" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  )
}

export function DocGlyph(props: P) {
  return (
    <svg viewBox="0 0 12 14" width="10" height="12" aria-hidden="true" {...props}>
      <path d="M2 .8h5.4L11 4.4v7.6a1.2 1.2 0 0 1-1.2 1.2H2A1.2 1.2 0 0 1 .8 12V2A1.2 1.2 0 0 1 2 .8z" fill="none" stroke="currentColor" strokeWidth="1.3" />
      <path d="M3.3 7h5.4M3.3 9.6h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  )
}

/** Small animated-looking orb (static gradient) for the menu bar. */
export function OrbGlyph(props: P) {
  const id = useId().replace(/:/g, '')
  return (
    <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true" {...props}>
      <defs>
        <radialGradient id={`${id}a`} cx=".3" cy=".3" r=".8">
          <stop offset="0" stopColor="#7DF3FF" />
          <stop offset="1" stopColor="#7DF3FF" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${id}b`} cx=".75" cy=".4" r=".8">
          <stop offset="0" stopColor="#FF4FD8" />
          <stop offset="1" stopColor="#FF4FD8" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${id}c`} cx=".5" cy=".85" r=".8">
          <stop offset="0" stopColor="#7B5CFF" />
          <stop offset="1" stopColor="#7B5CFF" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="10" cy="10" r="8.5" fill="#1a1236" />
      <circle cx="10" cy="10" r="8.5" fill={`url(#${id}c)`} />
      <circle cx="10" cy="10" r="8.5" fill={`url(#${id}b)`} />
      <circle cx="10" cy="10" r="8.5" fill={`url(#${id}a)`} />
      <circle cx="10" cy="10" r="8.5" fill="none" stroke="currentColor" strokeOpacity=".25" />
    </svg>
  )
}

export function CheckGlyph(props: P) {
  return (
    <svg viewBox="0 0 12 12" width="10" height="10" aria-hidden="true" {...props}>
      <path d="M1.8 6.4l2.7 2.7 5.7-6.3" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function ArrowRightGlyph(props: P) {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" {...props}>
      <path d="M3 8h9.5M8.5 3.8 12.7 8l-4.2 4.2" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/* Traffic-light hover glyphs */
export function CloseGlyph() {
  return (
    <svg viewBox="0 0 12 12" aria-hidden="true">
      <path d="M3.6 3.6l4.8 4.8M8.4 3.6l-4.8 4.8" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
    </svg>
  )
}

export function MinimizeGlyph() {
  return (
    <svg viewBox="0 0 12 12" aria-hidden="true">
      <path d="M2.9 6h6.2" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" />
    </svg>
  )
}

export function ZoomGlyph() {
  return (
    <svg viewBox="0 0 12 12" aria-hidden="true">
      <path d="M3.4 4.6v4h4z" fill="currentColor" />
      <path d="M8.6 7.4v-4h-4z" fill="currentColor" />
    </svg>
  )
}
