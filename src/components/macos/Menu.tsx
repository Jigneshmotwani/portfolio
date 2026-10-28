import { useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type ReactNode, type RefObject } from 'react'
import { CheckGlyph } from './glyphs'
import './Menu.css'

export type MenuEntry =
  | {
      label: string
      shortcut?: string
      disabled?: boolean
      checked?: boolean
      icon?: ReactNode
      onSelect?: () => void
    }
  | { separator: true }
  | { header: string }

interface MenuProps {
  items: MenuEntry[]
  /** Anchor point in viewport px (top-left of the menu, or top-right when align="right"). */
  x: number
  y: number
  align?: 'left' | 'right'
  onClose: () => void
  /** Elements whose pointerdowns should not count as "outside" (e.g. the menu bar titles). */
  ignore?: RefObject<HTMLElement | null>
  /** Focus the menu for keyboard navigation (true when opened from the keyboard). */
  autoFocus?: boolean
  label?: string
  minWidth?: number
  /** Left/right arrow keys (menu bar: move to the neighbouring menu). */
  onKeyNav?: (dir: -1 | 1) => void
}

const isItem = (e: MenuEntry): e is Extract<MenuEntry, { label: string }> => 'label' in e

/** macOS-style dropdown / context menu. */
export function Menu({ items, x, y, align = 'left', onClose, ignore, autoFocus = true, label, minWidth = 200, onKeyNav }: MenuProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState({ left: x, top: y })
  const [hi, setHi] = useState(-1)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const r = el.getBoundingClientRect()
    let left = align === 'right' ? x - r.width : x
    left = Math.max(6, Math.min(left, window.innerWidth - r.width - 6))
    let top = y
    if (top + r.height > window.innerHeight - 6) top = Math.max(6, y - r.height)
    setPos({ left, top })
  }, [x, y, align])

  useEffect(() => {
    if (autoFocus) ref.current?.focus({ preventScroll: true })
  }, [autoFocus])

  useEffect(() => {
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node
      if (ref.current?.contains(t)) return
      if (ignore?.current?.contains(t)) return
      onClose()
    }
    const onBlur = () => onClose()
    document.addEventListener('pointerdown', onDown, true)
    window.addEventListener('blur', onBlur)
    return () => {
      document.removeEventListener('pointerdown', onDown, true)
      window.removeEventListener('blur', onBlur)
    }
  }, [onClose, ignore])

  const selectable = items.map((it, i) => (isItem(it) && !it.disabled ? i : -1)).filter((i) => i >= 0)

  const choose = (i: number) => {
    const it = items[i]
    if (!it || !isItem(it) || it.disabled) return
    onClose()
    it.onSelect?.()
  }

  const onKeyDown = (e: ReactKeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      e.stopPropagation()
      onClose()
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      if (!selectable.length) return
      const cur = selectable.indexOf(hi)
      const next =
        e.key === 'ArrowDown'
          ? selectable[(cur + 1 + selectable.length) % selectable.length]
          : selectable[(cur - 1 + selectable.length * 2) % selectable.length]
      setHi(cur === -1 && e.key === 'ArrowUp' ? selectable[selectable.length - 1] : next)
    } else if ((e.key === 'ArrowLeft' || e.key === 'ArrowRight') && onKeyNav) {
      e.preventDefault()
      onKeyNav(e.key === 'ArrowLeft' ? -1 : 1)
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      if (hi >= 0) choose(hi)
    }
  }

  return (
    <div
      ref={ref}
      className="mmenu"
      role="menu"
      aria-label={label}
      tabIndex={-1}
      style={{ left: pos.left, top: pos.top, minWidth }}
      onKeyDown={onKeyDown}
      onContextMenu={(e) => e.preventDefault()}
    >
      {items.map((it, i) => {
        if ('separator' in it) return <div key={i} className="mmenu__sep" role="separator" />
        if ('header' in it)
          return (
            <div key={i} className="mmenu__header" role="presentation">
              {it.header}
            </div>
          )
        return (
          <div
            key={i}
            role="menuitem"
            aria-disabled={it.disabled || undefined}
            className={`mmenu__item${hi === i ? ' is-hi' : ''}${it.disabled ? ' is-disabled' : ''}`}
            onPointerEnter={() => setHi(it.disabled ? -1 : i)}
            onPointerLeave={() => setHi(-1)}
            onClick={() => choose(i)}
          >
            <span className="mmenu__check">{it.checked ? <CheckGlyph /> : null}</span>
            {it.icon && <span className="mmenu__icon">{it.icon}</span>}
            <span className="mmenu__label">{it.label}</span>
            {it.shortcut && <span className="mmenu__shortcut">{it.shortcut}</span>}
          </div>
        )
      })}
    </div>
  )
}
