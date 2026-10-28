import type { CSSProperties } from 'react'

/** Siri-like animated orb. `thinking` spins faster and glows. Motion stops under reduced motion. */
export function Orb({ size = 40, state = 'idle' }: { size?: number; state?: 'idle' | 'thinking' }) {
  return (
    <span className={`aj-orb aj-orb--${state}`} style={{ '--aj-orb-size': `${size}px` } as CSSProperties} aria-hidden="true">
      <span className="aj-orb__swirl" />
      <span className="aj-orb__swirl aj-orb__swirl--b" />
      <span className="aj-orb__shine" />
    </span>
  )
}
