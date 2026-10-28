/**
 * Small native-feeling UI kit shared by the info apps (Contacts, Notes,
 * Settings, Mail): iOS navigation pages + grouped lists, macOS grouped boxes,
 * switches, sliders, segmented controls, and clipboard / download helpers.
 * All classes use the `infokit-` prefix.
 */
import { ChevronLeft, ChevronRight, Search, X } from 'lucide-react'
import { useCallback, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react'
import './kit.css'

/* ── Controls ─────────────────────────────────────────────────────────── */

export function Switch({
  checked,
  onChange,
  label,
  platform = 'mac',
  id,
}: {
  checked: boolean
  onChange: (next: boolean) => void
  label: string
  platform?: 'mac' | 'ios'
  id?: string
}) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className={`infokit-switch infokit-switch--${platform}${checked ? ' is-on' : ''}`}
      onClick={() => onChange(!checked)}
    >
      <span className="infokit-switch__knob" />
    </button>
  )
}

export function Slider({
  value,
  onChange,
  min = 0,
  max = 1,
  step = 0.01,
  label,
  id,
  platform = 'mac',
}: {
  value: number
  onChange: (v: number) => void
  min?: number
  max?: number
  step?: number
  label: string
  id?: string
  platform?: 'mac' | 'ios'
}) {
  const pct = ((value - min) / (max - min)) * 100
  return (
    <input
      id={id}
      type="range"
      className={`infokit-slider infokit-slider--${platform}`}
      min={min}
      max={max}
      step={step}
      value={value}
      aria-label={label}
      style={{ '--pct': `${pct}%` } as CSSProperties}
      onChange={(e) => onChange(Number(e.target.value))}
    />
  )
}

export function Segmented<V extends string>({
  options,
  value,
  onChange,
  label,
  platform = 'mac',
}: {
  options: { value: V; label: string }[]
  value: V
  onChange: (v: V) => void
  label: string
  platform?: 'mac' | 'ios'
}) {
  return (
    <div className={`infokit-seg infokit-seg--${platform}`} role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={o.value === value}
          className={`infokit-seg__opt${o.value === value ? ' is-on' : ''}`}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function SearchField({
  value,
  onChange,
  placeholder = 'Search',
  platform = 'mac',
  id,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  platform?: 'mac' | 'ios'
  id?: string
}) {
  return (
    <label className={`infokit-search infokit-search--${platform}`}>
      <Search size={platform === 'ios' ? 17 : 13} strokeWidth={2.2} aria-hidden />
      <input
        id={id}
        type="search"
        value={value}
        placeholder={placeholder}
        aria-label={placeholder}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Escape' && value) {
            e.stopPropagation()
            onChange('')
          }
        }}
      />
      {value && (
        <button type="button" className="infokit-search__clear" aria-label="Clear search" onClick={() => onChange('')}>
          <X size={10} strokeWidth={3} />
        </button>
      )}
    </label>
  )
}

/** Rounded-square glyph like the coloured icons in System Settings / iOS Settings. */
export function GlyphTile({ color, children, size = 20 }: { color: string; children: ReactNode; size?: number }) {
  return (
    <span className="infokit-glyph" style={{ background: color, width: size, height: size, borderRadius: size * 0.26 }} aria-hidden>
      {children}
    </span>
  )
}

/* ── macOS grouped boxes (System Settings style) ──────────────────────── */

export function MacGroup({ title, footer, children }: { title?: string; footer?: ReactNode; children: ReactNode }) {
  return (
    <section className="infokit-mgroup">
      {title && <h3 className="infokit-mgroup__title">{title}</h3>}
      <div className="infokit-mgroup__box">{children}</div>
      {footer && <p className="infokit-mgroup__footer">{footer}</p>}
    </section>
  )
}

export function MacRow({ label, detail, children, htmlFor }: { label: ReactNode; detail?: ReactNode; children?: ReactNode; htmlFor?: string }) {
  return (
    <div className="infokit-mrow">
      <div className="infokit-mrow__text">
        {htmlFor ? (
          <label htmlFor={htmlFor} className="infokit-mrow__label">
            {label}
          </label>
        ) : (
          <span className="infokit-mrow__label">{label}</span>
        )}
        {detail && <span className="infokit-mrow__detail">{detail}</span>}
      </div>
      {children && <div className="infokit-mrow__control">{children}</div>}
    </div>
  )
}

/* ── iOS navigation ───────────────────────────────────────────────────── */

export type NavDir = 'push' | 'pop' | 'none'

/** A tiny push/pop navigation stack for iOS screens. Entries are route strings. */
export function useNavStack(initial: string[]) {
  const [state, setState] = useState<{ stack: string[]; dir: NavDir }>({ stack: initial, dir: 'none' })
  const push = useCallback((route: string) => setState((s) => ({ stack: [...s.stack, route], dir: 'push' })), [])
  const pop = useCallback(
    () => setState((s) => (s.stack.length > 1 ? { stack: s.stack.slice(0, -1), dir: 'pop' } : s)),
    [],
  )
  const reset = useCallback((stack: string[]) => setState({ stack, dir: 'none' }), [])
  const { stack, dir } = state
  return { stack, dir, top: stack[stack.length - 1], depth: stack.length, push, pop, reset }
}

export function IOSPage({
  title,
  large = true,
  back,
  trailing,
  tone = 'grouped',
  tint,
  dir = 'none',
  header,
  bottomBar,
  children,
}: {
  title: string
  large?: boolean
  back?: { label: string; onClick: () => void }
  trailing?: ReactNode
  tone?: 'grouped' | 'plain'
  /** Navigation tint (back button, trailing actions). Defaults to the accent colour. */
  tint?: string
  dir?: NavDir
  /** Rendered under the large title (e.g. a search field). */
  header?: ReactNode
  bottomBar?: ReactNode
  children: ReactNode
}) {
  const [scrolled, setScrolled] = useState(false)
  const drag = useRef<{ x: number; y: number; id: number } | null>(null)
  const pageRef = useRef<HTMLDivElement>(null)

  // Edge-swipe back gesture (from the left 24px), like iOS.
  const onPointerDown = (e: ReactPointerEvent) => {
    if (!back || e.clientX - (pageRef.current?.getBoundingClientRect().left ?? 0) > 24) return
    drag.current = { x: e.clientX, y: e.clientY, id: e.pointerId }
    pageRef.current?.setPointerCapture(e.pointerId)
  }
  const onPointerMove = (e: ReactPointerEvent) => {
    if (!drag.current || !pageRef.current) return
    const dx = Math.max(0, e.clientX - drag.current.x)
    pageRef.current.style.transform = `translateX(${dx}px)`
  }
  const onPointerEnd = (e: ReactPointerEvent) => {
    if (!drag.current || !pageRef.current) return
    const dx = e.clientX - drag.current.x
    drag.current = null
    const el = pageRef.current
    el.style.transition = 'transform .25s var(--ease-out)'
    if (dx > 90) {
      el.style.transform = 'translateX(100%)'
      window.setTimeout(() => back?.onClick(), 200)
    } else {
      el.style.transform = ''
      window.setTimeout(() => {
        el.style.transition = ''
      }, 260)
    }
  }

  return (
    <div
      ref={pageRef}
      className={`infokit-page infokit-page--${tone} infokit-anim--${dir}`}
      style={tint ? ({ '--infokit-tint': tint } as CSSProperties) : undefined}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerEnd}
      onPointerCancel={onPointerEnd}
    >
      <header className={`infokit-nav${scrolled || !large ? ' is-scrolled' : ''}`}>
        <div className="infokit-nav__bar">
          <div className="infokit-nav__leading">
            {back && (
              <button type="button" className="infokit-nav__back" onClick={back.onClick}>
                <ChevronLeft size={24} strokeWidth={2.4} aria-hidden />
                <span>{back.label}</span>
              </button>
            )}
          </div>
          <div className="infokit-nav__title" aria-hidden={large && !scrolled}>
            {title}
          </div>
          <div className="infokit-nav__trailing">{trailing}</div>
        </div>
      </header>
      <div className="infokit-page__scroll scroll" onScroll={(e) => setScrolled(e.currentTarget.scrollTop > 28)}>
        {large && <h1 className="infokit-largetitle">{title}</h1>}
        {header}
        {children}
      </div>
      {bottomBar && <div className="infokit-bottombar">{bottomBar}</div>}
    </div>
  )
}

export function IOSGroup({ header, footer, children }: { header?: ReactNode; footer?: ReactNode; children: ReactNode }) {
  return (
    <section className="infokit-igroup">
      {header && <h3 className="infokit-igroup__header">{header}</h3>}
      <div className="infokit-igroup__box">{children}</div>
      {footer && <p className="infokit-igroup__footer">{footer}</p>}
    </section>
  )
}

export function IOSRow({
  icon,
  label,
  detail,
  value,
  onClick,
  chevron = !!onClick,
  accessory,
  destructive,
  tinted,
  multiline,
}: {
  icon?: ReactNode
  label: ReactNode
  /** Secondary line under the label. */
  detail?: ReactNode
  /** Trailing grey value. */
  value?: ReactNode
  onClick?: () => void
  chevron?: boolean
  accessory?: ReactNode
  destructive?: boolean
  /** Label in the tint colour (action rows). */
  tinted?: boolean
  multiline?: boolean
}) {
  const body = (
    <>
      {icon && <span className="infokit-irow__icon">{icon}</span>}
      <span className={`infokit-irow__main${multiline ? ' is-multiline' : ''}`}>
        <span className={`infokit-irow__label${destructive ? ' is-destructive' : ''}${tinted ? ' is-tinted' : ''}`}>{label}</span>
        {detail && <span className="infokit-irow__detail">{detail}</span>}
      </span>
      {value != null && <span className="infokit-irow__value">{value}</span>}
      {accessory}
      {chevron && <ChevronRight className="infokit-irow__chevron" size={16} strokeWidth={2.6} aria-hidden />}
    </>
  )
  return onClick ? (
    <button type="button" className="infokit-irow infokit-irow--button" onClick={onClick}>
      {body}
    </button>
  ) : (
    <div className="infokit-irow">{body}</div>
  )
}

/* ── Helpers ──────────────────────────────────────────────────────────── */

/** Copies text; falls back to a hidden textarea + execCommand when the Clipboard API is refused. */
export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    try {
      const ta = document.createElement('textarea')
      ta.value = text
      ta.setAttribute('readonly', '')
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      const ok = document.execCommand('copy')
      ta.remove()
      return ok
    } catch {
      return false
    }
  }
}

export function downloadText(filename: string, text: string, mime = 'text/plain') {
  const url = URL.createObjectURL(new Blob([text], { type: `${mime};charset=utf-8` }))
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/** "Copied" style transient flag. */
export function useFlash(ms = 1600): [string | null, (msg: string) => void] {
  const [msg, setMsg] = useState<string | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const flash = useCallback(
    (m: string) => {
      setMsg(m)
      if (timer.current) clearTimeout(timer.current)
      timer.current = setTimeout(() => setMsg(null), ms)
    },
    [ms],
  )
  return [msg, flash]
}
