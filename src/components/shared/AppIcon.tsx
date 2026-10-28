import type { CSSProperties } from 'react'
import { appIconUrl, type AppIconId } from '../../assets/icons'

/** App icon image. `size` in px; decorative unless `label` is given. */
export function AppIcon({ id, size = 48, label, className, style }: { id: AppIconId; size?: number; label?: string; className?: string; style?: CSSProperties }) {
  return (
    <img
      src={appIconUrl(id)}
      width={size}
      height={size}
      alt={label ?? ''}
      aria-hidden={label ? undefined : true}
      draggable={false}
      className={className}
      style={{ width: size, height: size, ...style }}
    />
  )
}
