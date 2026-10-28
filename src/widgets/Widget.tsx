import type { CSSProperties, KeyboardEvent, ReactNode } from 'react'
import type { WidgetProps } from './types'
import './widgets.css'

interface ShellProps extends WidgetProps {
  /** Accessible name, e.g. "Singapore time and weather". */
  label: string
  className?: string
  style?: CSSProperties
  /** Makes the whole widget a button (click / Enter / Space). */
  onActivate?: () => void
  children: ReactNode
}

/** Shared widget chrome: size, corner radius, material and keyboard handling. */
export function Widget({ size, platform, label, className = '', style, onActivate, children }: ShellProps) {
  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onActivate?.()
    }
  }
  return (
    <div
      className={`widget widget--${size} widget--${platform}${onActivate ? ' widget--action' : ''} ${className}`}
      style={style}
      role={onActivate ? 'button' : 'group'}
      aria-label={label}
      tabIndex={onActivate ? 0 : undefined}
      onClick={onActivate}
      onKeyDown={onActivate ? onKeyDown : undefined}
    >
      {children}
    </div>
  )
}
