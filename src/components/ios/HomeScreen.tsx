import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  type RefObject,
  type WheelEvent as ReactWheelEvent,
} from 'react'
import { appName, apps } from '../../apps/registry'
import type { AppId } from '../../apps/types'
import type { AppIconId } from '../../assets/icons'
import { launch, openResume, rectOf } from '../../lib/launch'
import { useSystem } from '../../state/system'
import { ClockWeatherWidget, CurrentlyBuildingWidget, GitHubContributionsWidget, type WidgetSize } from '../../widgets'
import { AppIcon } from '../shared/AppIcon'
import { SearchGlyph } from './glyphs'
import './HomeScreen.css'

export const DOCK_APPS: AppId[] = ['safari', 'mail', 'assistant', 'photos']

type Cell =
  | { kind: 'app'; id: AppId; col: number; row: number }
  | { kind: 'clip'; id: 'resume'; label: string; icon: AppIconId; col: number; row: number; onOpen: () => void }
  | { kind: 'widget'; widget: 'clock' | 'building' | 'github'; size: WidgetSize; col: number; row: number }

const PAGES: Cell[][] = [
  [
    { kind: 'widget', widget: 'clock', size: 'medium', col: 1, row: 1 },
    { kind: 'widget', widget: 'building', size: 'small', col: 1, row: 3 },
    { kind: 'app', id: 'finder', col: 3, row: 3 },
    { kind: 'app', id: 'notes', col: 4, row: 3 },
    { kind: 'app', id: 'contacts', col: 3, row: 4 },
    { kind: 'app', id: 'settings', col: 4, row: 4 },
    { kind: 'app', id: 'terminal', col: 1, row: 5 },
    { kind: 'app', id: 'github', col: 2, row: 5 },
    { kind: 'app', id: 'tetris', col: 3, row: 5 },
    { kind: 'app', id: 'chess', col: 4, row: 5 },
    { kind: 'clip', id: 'resume', label: 'Resume', icon: 'resume', col: 1, row: 6, onOpen: openResume },
  ],
  [{ kind: 'widget', widget: 'github', size: 'large', col: 1, row: 1 }],
]

const SPAN: Record<WidgetSize, [number, number]> = { small: [2, 2], medium: [4, 2], large: [4, 4] }

/** Lays out the icon grid from the measured page size (iPhone-like proportions). */
function useGridMetrics(ref: RefObject<HTMLElement | null>) {
  const [size, setSize] = useState({ w: 390, h: 600 })
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const update = () => setSize({ w: el.clientWidth, h: el.clientHeight })
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [ref])
  const pad = Math.round(Math.max(16, size.w * 0.06))
  const cell = (size.w - pad * 2) / 4
  const icon = Math.round(Math.min(64, Math.max(48, cell * 0.7)))
  const row = Math.max(78, size.h / 6)
  const small = Math.round(Math.min(cell + icon + 12, row * 2 - 12))
  const inset = Math.max(0, (cell - icon - 12) / 2)
  const wide = Math.round(cell * 4 - inset * 2)
  const large = Math.round(Math.min(row * 4 - 14, wide * 1.06))
  return { pad, cell, icon, row, small, wide, large, w: size.w }
}

function openApp(id: AppId, el: Element | null) {
  launch(id, undefined, { origin: rectOf(el) })
}

function HomeIcon({ id, size, showLabel = true }: { id: AppId; size: number; showLabel?: boolean }) {
  const label = appName(id, 'ios')
  return (
    <button className="ios-icon" data-ios-app={id} aria-label={label} onClick={(e) => openApp(id, e.currentTarget.querySelector('img'))}>
      <AppIcon id={apps[id].icon} size={size} className="ios-icon__img" />
      {showLabel && <span className="ios-icon__label">{label}</span>}
    </button>
  )
}

function WidgetSlot({ widget, size }: { widget: 'clock' | 'building' | 'github'; size: WidgetSize }) {
  const props = { size, platform: 'ios' as const }
  let node: ReactNode
  if (widget === 'clock') node = <ClockWeatherWidget {...props} />
  else if (widget === 'building') node = <CurrentlyBuildingWidget {...props} />
  else node = <GitHubContributionsWidget {...props} />
  return <div className={`ios-widget ios-widget--${size}`}>{node}</div>
}

/**
 * iOS home screen: swipeable pages of widgets and icons, page dots /
 * "Search" pill, and the dock. Pull down anywhere on the pages to open
 * Spotlight. Paging is pointer-driven so it works with a mouse too.
 */
export function HomeScreen({ state }: { state: 'locked' | 'entering' | 'idle' | 'behind' }) {
  const pagesRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const metrics = useGridMetrics(pagesRef)
  const [page, setPage] = useState(0)
  const [scrolling, setScrolling] = useState(false)
  const openSpotlight = useSystem((s) => s.openSpotlight)
  const gesture = useRef<{ id: number; x0: number; y0: number; axis: 'x' | 'y' | null; lastX: number; lastT: number; v: number } | null>(null)
  const pageRef = useRef(page)
  pageRef.current = page
  const scrollTimer = useRef<number | undefined>(undefined)
  const wheel = useRef({ acc: 0, lock: 0 })

  const pageCount = PAGES.length

  const setTrack = (dx: number, dy: number, animate: boolean) => {
    const el = trackRef.current
    if (!el) return
    el.style.transition = animate ? 'transform 0.42s cubic-bezier(0.2, 0.9, 0.25, 1)' : 'none'
    el.style.transform = `translate3d(${-pageRef.current * metrics.w + dx}px, ${dy}px, 0)`
  }

  useLayoutEffect(() => {
    setTrack(0, 0, true)
  }, [page, metrics.w])

  const flashDots = () => {
    setScrolling(true)
    window.clearTimeout(scrollTimer.current)
    scrollTimer.current = window.setTimeout(() => setScrolling(false), 900)
  }

  const goTo = (p: number) => {
    const next = Math.max(0, Math.min(pageCount - 1, p))
    flashDots()
    if (next === pageRef.current) setTrack(0, 0, true)
    else setPage(next)
  }

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.button > 0) return
    gesture.current = { id: e.pointerId, x0: e.clientX, y0: e.clientY, axis: null, lastX: e.clientX, lastT: performance.now(), v: 0 }
  }
  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const g = gesture.current
    if (!g || g.id !== e.pointerId) return
    const dx = e.clientX - g.x0
    const dy = e.clientY - g.y0
    if (!g.axis) {
      if (Math.hypot(dx, dy) < 8) return
      g.axis = Math.abs(dx) > Math.abs(dy) ? 'x' : dy > 0 ? 'y' : null
      if (!g.axis) {
        gesture.current = null
        return
      }
      try {
        e.currentTarget.setPointerCapture(e.pointerId)
      } catch {
        /* ignore */
      }
      if (g.axis === 'x') flashDots()
    }
    const t = performance.now()
    g.v = 0.7 * ((e.clientX - g.lastX) / Math.max(1, t - g.lastT)) + 0.3 * g.v
    g.lastX = e.clientX
    g.lastT = t
    if (g.axis === 'x') {
      const atEdge = (pageRef.current === 0 && dx > 0) || (pageRef.current === pageCount - 1 && dx < 0)
      setTrack(atEdge ? dx * 0.3 : dx, 0, false)
      setScrolling(true)
    } else {
      setTrack(0, Math.min(90, Math.max(0, dy) * 0.35), false)
    }
  }
  const onPointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    const g = gesture.current
    gesture.current = null
    if (!g || g.id !== e.pointerId || !g.axis) return
    const dx = e.clientX - g.x0
    const dy = e.clientY - g.y0
    if (g.axis === 'x') {
      const threshold = metrics.w * 0.18
      if (dx < -threshold || g.v < -0.45) goTo(pageRef.current + 1)
      else if (dx > threshold || g.v > 0.45) goTo(pageRef.current - 1)
      else goTo(pageRef.current)
    } else {
      setTrack(0, 0, true)
      if (dy > 60) openSpotlight()
    }
  }

  const onWheel = (e: ReactWheelEvent) => {
    if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return
    const now = performance.now()
    if (now < wheel.current.lock) return
    wheel.current.acc += e.deltaX
    if (Math.abs(wheel.current.acc) > 50) {
      goTo(pageRef.current + (wheel.current.acc > 0 ? 1 : -1))
      wheel.current = { acc: 0, lock: now + 550 }
    }
  }

  useEffect(() => () => window.clearTimeout(scrollTimer.current), [])

  const style = {
    '--ios-grid-pad': `${metrics.pad}px`,
    '--ios-icon': `${metrics.icon}px`,
    '--ios-widget-small': `${metrics.small}px`,
    '--ios-widget-wide': `${metrics.wide}px`,
    '--ios-widget-large': `${metrics.large}px`,
  } as CSSProperties

  return (
    <div className={`ios-home ios-home--${state}`} style={style} aria-hidden={state === 'locked' || state === 'behind' ? true : undefined}>
      <div
        ref={pagesRef}
        className="ios-home__pages"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onWheel={onWheel}
      >
        <div ref={trackRef} className="ios-home__track" style={{ width: metrics.w * pageCount }}>
          {PAGES.map((cells, i) => (
            <section
              key={i}
              className="ios-home__page"
              style={{ width: metrics.w, left: metrics.w * i }}
              aria-label={`Home screen page ${i + 1} of ${pageCount}`}
              inert={i !== page}
            >
              {cells.map((c) => {
                if (c.kind === 'widget') {
                  const [cs, rs] = SPAN[c.size]
                  return (
                    <div key={`w-${c.widget}`} className="ios-home__cell ios-home__cell--widget" style={{ gridColumn: `${c.col} / span ${cs}`, gridRow: `${c.row} / span ${rs}` }}>
                      <WidgetSlot widget={c.widget} size={c.size} />
                    </div>
                  )
                }
                if (c.kind === 'clip') {
                  return (
                    <div key={`c-${c.id}`} className="ios-home__cell" style={{ gridColumn: c.col, gridRow: c.row }}>
                      <button className="ios-icon" data-ios-app={c.id} aria-label={c.label} onClick={c.onOpen}>
                        <AppIcon id={c.icon} size={metrics.icon} className="ios-icon__img" />
                        <span className="ios-icon__label">{c.label}</span>
                      </button>
                    </div>
                  )
                }
                return (
                  <div key={c.id} className="ios-home__cell" style={{ gridColumn: c.col, gridRow: c.row }}>
                    <HomeIcon id={c.id} size={metrics.icon} />
                  </div>
                )
              })}
            </section>
          ))}
        </div>
      </div>

      <div className="ios-home__pill-row">
        {scrolling ? (
          <div className="ios-home__dots" role="tablist" aria-label="Pages">
            {PAGES.map((_, i) => (
              <button
                key={i}
                role="tab"
                aria-selected={i === page}
                aria-label={`Page ${i + 1}`}
                className={`ios-home__dot${i === page ? ' ios-home__dot--on' : ''}`}
                onClick={() => goTo(i)}
              />
            ))}
          </div>
        ) : (
          <button className="ios-home__search" onClick={() => openSpotlight()} aria-label="Search">
            <SearchGlyph size={12} />
            <span>Search</span>
          </button>
        )}
        {!scrolling && pageCount > 1 && (
          <button className="ios-home__next" aria-label={page === 0 ? 'Next page' : 'Previous page'} onClick={() => goTo(page === 0 ? 1 : 0)}>
            {PAGES.map((_, i) => (
              <i key={i} className={i === page ? 'on' : ''} />
            ))}
          </button>
        )}
      </div>

      <nav className="ios-dock" aria-label="Dock">
        {DOCK_APPS.map((id) => (
          <HomeIcon key={id} id={id} size={metrics.icon} showLabel={false} />
        ))}
      </nav>
    </div>
  )
}
