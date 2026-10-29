import { useEffect, useLayoutEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { appName, apps } from '../../apps/registry'
import type { AppId } from '../../apps/types'
import { playSound } from '../../lib/sound'
import { useReducedMotion } from '../../lib/theme'
import { useIOS } from '../../state/ios'
import { useSystem } from '../../state/system'
import { AppFrame } from '../shared/AppFrame'
import { AppIcon } from '../shared/AppIcon'
import './AppLayer.css'

const noop = () => {}
const EASE = 'cubic-bezier(0.2, 0.9, 0.22, 1)'
const IDENTITY = 'translate(0px, 0px) scale(1)'
const FULL_CLIP = 'inset(0px 0px 0px 0px round 0px)'
/** Visual corner radius of a card / shrinking app, in screen px. */
const CARD_RADIUS = 30

type Geo = { x: number; y: number; s: number; cw: number; ch: number; spacing: number }

function viewport() {
  return { W: window.innerWidth, H: window.innerHeight }
}

function cardGeo(i: number, pos: number): Geo {
  const { W, H } = viewport()
  const s = Math.min(0.64, (H * 0.64) / H, 340 / W)
  const cw = W * s
  const ch = H * s
  const spacing = cw + Math.max(14, W * 0.04)
  return { x: (W - cw) / 2 + (i - pos) * spacing, y: (H - ch) / 2 + 8, s, cw, ch, spacing }
}

function cardTransform(g: Geo, dy = 0) {
  return `translate(${g.x}px, ${g.y + dy}px) scale(${g.s})`
}

function cardClip(s: number) {
  return `inset(0px 0px 0px 0px round ${CARD_RADIUS / s}px)`
}

/** Screen rect of an app's home-screen icon, corrected for the home screen's own scale. */
function iconRect(appId: AppId) {
  const img = document.querySelector<HTMLElement>(`.ios-home [data-ios-app="${appId}"] .ios-icon__img`)
  const home = document.querySelector<HTMLElement>('.ios-home')
  if (!img || !home) return null
  const r = img.getBoundingClientRect()
  const { W, H } = viewport()
  const m = new DOMMatrixReadOnly(getComputedStyle(home).transform === 'none' ? undefined : getComputedStyle(home).transform)
  const k = m.a || 1
  const cx = W / 2
  const cy = H / 2
  const x = cx + (r.left - cx) / k
  const y = cy + (r.top - cy) / k
  const w = r.width / k
  if (x + w < 0 || x > W || y + w < 0 || y > H) return null
  return { x, y, w }
}

/** Keyframe that maps the full-screen app onto an icon square. */
function iconPose(r: { x: number; y: number; w: number }) {
  const { W, H } = viewport()
  const s = r.w / W
  const inset = (H - W) / 2
  return {
    transform: `translate(${r.x}px, ${r.y - inset * s}px) scale(${s})`,
    clipPath: `inset(${inset}px 0px ${inset}px 0px round ${(r.w * 0.225) / s}px)`,
  }
}

function cancel(el: Element) {
  for (const a of el.getAnimations()) a.cancel()
}

function clearStyles(el: HTMLElement) {
  el.style.transform = ''
  el.style.clipPath = ''
  el.style.opacity = ''
  el.style.transition = ''
}

/**
 * All running iOS apps stay mounted here. The foreground app is full screen;
 * in the App Switcher the same live containers are transformed into cards.
 * Also owns the home indicator gesture (swipe up = home, swipe up and
 * hold = App Switcher).
 */
export function AppLayer() {
  const running = useIOS((s) => s.running)
  const active = useIOS((s) => s.active)
  const switcher = useIOS((s) => s.switcher)
  const reduce = useReducedMotion()
  const dur = (ms: number) => (reduce ? 1 : ms)

  const refs = useRef(new Map<AppId, HTMLDivElement>())
  const labelRefs = useRef(new Map<AppId, HTMLDivElement>())
  const [closing, setClosing] = useState<AppId | null>(null)
  const prev = useRef<{ active: AppId | null; switcher: boolean }>({ active: null, switcher: false })

  // Stable DOM order (moving a node would reload iframes inside apps).
  const order = useRef<AppId[]>([])
  for (const r of running) if (!order.current.includes(r.appId)) order.current.push(r.appId)
  order.current = order.current.filter((id) => running.some((r) => r.appId === id))

  // Cards: least recently used on the left, most recent on the right.
  const cards = [...running].sort((a, b) => a.lastActive - b.lastActive).map((r) => r.appId)
  const cardsRef = useRef(cards)
  cardsRef.current = cards
  const pos = useRef(0)
  const cardDrag = useRef<{ index: number; dy: number } | null>(null)

  const applyCards = (animate: boolean) => {
    cardsRef.current.forEach((id, i) => {
      const el = refs.current.get(id)
      const label = labelRefs.current.get(id)
      const g = cardGeo(i, pos.current)
      const dy = cardDrag.current?.index === i ? cardDrag.current.dy : 0
      const t = animate ? `transform ${dur(380)}ms ${EASE}, clip-path ${dur(380)}ms ${EASE}, opacity ${dur(260)}ms` : 'none'
      if (el) {
        el.style.transition = t
        el.style.transform = cardTransform(g, dy)
        el.style.clipPath = cardClip(g.s)
        el.style.opacity = dy < 0 ? String(Math.max(0.2, 1 + dy / (g.ch * 1.2))) : '1'
      }
      if (label) {
        label.style.transition = animate ? `transform ${dur(380)}ms ${EASE}, opacity 200ms` : 'none'
        label.style.transform = `translate(${g.x}px, ${g.y - 34 + dy}px)`
        label.style.width = `${g.cw}px`
        label.style.opacity = dy < -10 ? '0' : '1'
      }
    })
  }

  const animateOpen = (id: AppId) => {
    const el = refs.current.get(id)
    if (!el) return
    cancel(el)
    clearStyles(el)
    setClosing((c) => (c === id ? null : c))
    const splash = el.querySelector<HTMLElement>('.ios-app__splash')
    const r = iconRect(id)
    if (r) {
      const from = iconPose(r)
      el.animate([from, { transform: IDENTITY, clipPath: FULL_CLIP }], { duration: dur(500), easing: EASE })
      splash?.animate([{ opacity: 1 }, { opacity: 1, offset: 0.15 }, { opacity: 0 }], { duration: dur(320), easing: 'ease-out', fill: 'forwards' })
    } else {
      el.animate(
        [
          { transform: `translate(${viewport().W * 0.08}px, ${viewport().H * 0.08}px) scale(0.84)`, opacity: 0, clipPath: cardClip(0.84) },
          { transform: IDENTITY, opacity: 1, clipPath: FULL_CLIP },
        ],
        { duration: dur(380), easing: EASE },
      )
      splash?.animate([{ opacity: 0 }, { opacity: 0 }], { duration: 1, fill: 'forwards' })
    }
  }

  const animateClose = (id: AppId) => {
    const el = refs.current.get(id)
    if (!el) return
    const from = { transform: el.style.transform || IDENTITY, clipPath: el.style.clipPath || FULL_CLIP, opacity: el.style.opacity || '1' }
    cancel(el)
    setClosing(id)
    const r = iconRect(id)
    const { W, H } = viewport()
    const to = r ? { ...iconPose(r), opacity: '1' } : { transform: `translate(${W * 0.3}px, ${H * 0.32}px) scale(0.4)`, clipPath: cardClip(0.4), opacity: '0' }
    const splash = el.querySelector<HTMLElement>('.ios-app__splash')
    for (const a of splash?.getAnimations() ?? []) a.cancel()
    if (r) splash?.animate([{ opacity: 0 }, { opacity: 0, offset: 0.35 }, { opacity: 1 }], { duration: dur(420), easing: 'ease-in', fill: 'forwards' })
    const anim = el.animate([from, to], { duration: dur(440), easing: EASE, fill: 'forwards' })
    anim.onfinish = () => {
      clearStyles(el)
      cancel(el)
      for (const a of splash?.getAnimations() ?? []) a.cancel()
      setClosing((c) => (c === id ? null : c))
    }
  }

  const enterSwitcher = (from: AppId | null) => {
    const list = cardsRef.current
    pos.current = Math.max(0, list.length - 1)
    list.forEach((id, i) => {
      const el = refs.current.get(id)
      if (!el) return
      cancel(el)
      if (id !== from) {
        // Cards that weren't on screen fade in at their slot.
        const g = cardGeo(i, pos.current)
        el.style.transition = 'none'
        el.style.transform = cardTransform(g)
        el.style.clipPath = cardClip(g.s)
        el.style.opacity = '0'
      } else if (!el.style.transform) {
        el.style.transition = 'none'
        el.style.transform = IDENTITY
        el.style.clipPath = FULL_CLIP
      }
    })
    void document.body.offsetWidth
    applyCards(true)
  }

  const exitSwitcher = (to: AppId | null) => {
    for (const id of order.current) {
      const el = refs.current.get(id)
      if (!el) continue
      if (id === to) {
        const from = { transform: el.style.transform || IDENTITY, clipPath: el.style.clipPath || FULL_CLIP }
        cancel(el)
        clearStyles(el)
        el.animate([from, { transform: IDENTITY, clipPath: FULL_CLIP }], { duration: dur(400), easing: EASE })
      } else {
        cancel(el)
        clearStyles(el)
      }
    }
  }

  useLayoutEffect(() => {
    const was = prev.current
    prev.current = { active, switcher }
    if (switcher) {
      if (!was.switcher) enterSwitcher(was.active)
      else applyCards(true)
      return
    }
    if (was.switcher) {
      exitSwitcher(active)
      return
    }
    if (active && active !== was.active) {
      if (was.active) {
        const old = refs.current.get(was.active)
        if (old) {
          cancel(old)
          clearStyles(old)
        }
      }
      animateOpen(active)
    } else if (!active && was.active) {
      animateClose(was.active)
    }
  }, [active, switcher])

  // Keep cards laid out when apps are killed or the window resizes.
  useLayoutEffect(() => {
    if (!switcher) return
    pos.current = Math.min(pos.current, Math.max(0, cards.length - 1))
    applyCards(true)
  }, [running.length, switcher])

  useEffect(() => {
    if (!switcher) return
    const onResize = () => applyCards(false)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [switcher])

  // Escape: leave the switcher, or go home from an app (not while typing or with overlays open).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      const ios = useIOS.getState()
      const sys = useSystem.getState()
      if (sys.resumeOpen || sys.spotlight.open || sys.controlCenter || sys.notificationCenter || sys.siri.open) return
      const t = e.target as HTMLElement | null
      if (t?.closest('input, textarea, select, [contenteditable="true"]')) return
      if (ios.switcher || ios.active) ios.goHome()
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [])

  /* ───────────── App Switcher interaction ───────────── */
  const sw = useRef<{ id: number; x0: number; y0: number; pos0: number; axis: 'x' | 'y' | null; index: number; lastX: number; lastY: number; lastT: number; vx: number; vy: number } | null>(null)

  const hitCard = (x: number, y: number) => {
    const list = cardsRef.current
    for (let i = list.length - 1; i >= 0; i--) {
      const g = cardGeo(i, pos.current)
      if (x >= g.x && x <= g.x + g.cw && y >= g.y - 36 && y <= g.y + g.ch) return i
    }
    return -1
  }

  const onSwitcherDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.button > 0) return
    e.currentTarget.setPointerCapture(e.pointerId)
    sw.current = { id: e.pointerId, x0: e.clientX, y0: e.clientY, pos0: pos.current, axis: null, index: hitCard(e.clientX, e.clientY), lastX: e.clientX, lastY: e.clientY, lastT: performance.now(), vx: 0, vy: 0 }
  }
  const onSwitcherMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const s = sw.current
    if (!s || s.id !== e.pointerId) return
    const dx = e.clientX - s.x0
    const dy = e.clientY - s.y0
    const t = performance.now()
    const dt = Math.max(1, t - s.lastT)
    s.vx = 0.7 * ((e.clientX - s.lastX) / dt) + 0.3 * s.vx
    s.vy = 0.7 * ((e.clientY - s.lastY) / dt) + 0.3 * s.vy
    s.lastX = e.clientX
    s.lastY = e.clientY
    s.lastT = t
    if (!s.axis) {
      if (Math.hypot(dx, dy) < 8) return
      s.axis = Math.abs(dx) > Math.abs(dy) || s.index < 0 ? 'x' : 'y'
    }
    const n = cardsRef.current.length
    if (s.axis === 'x') {
      const g = cardGeo(0, 0)
      let p = s.pos0 - dx / g.spacing
      if (p < 0) p = p * 0.3
      if (p > n - 1) p = n - 1 + (p - (n - 1)) * 0.3
      pos.current = p
      applyCards(false)
    } else {
      cardDrag.current = { index: s.index, dy: dy < 0 ? dy : dy * 0.2 }
      applyCards(false)
    }
  }
  const onSwitcherUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    const s = sw.current
    sw.current = null
    if (!s || s.id !== e.pointerId) return
    const list = cardsRef.current
    const ios = useIOS.getState()
    if (!s.axis) {
      if (s.index >= 0) {
        playSound('open')
        ios.open(list[s.index])
      } else ios.goHome()
      return
    }
    if (s.axis === 'x') {
      const g = cardGeo(0, 0)
      const target = Math.round(pos.current - s.vx * 120 / g.spacing)
      pos.current = Math.max(0, Math.min(list.length - 1, target))
      applyCards(true)
      return
    }
    const drag = cardDrag.current
    cardDrag.current = null
    if (drag && (drag.dy < -110 || (s.vy < -0.5 && drag.dy < -30))) {
      const id = list[drag.index]
      const el = refs.current.get(id)
      const label = labelRefs.current.get(id)
      const g = cardGeo(drag.index, pos.current)
      playSound('close')
      if (el) {
        el.style.transition = `transform ${dur(260)}ms ease-in, opacity ${dur(260)}ms`
        el.style.transform = `translate(${g.x}px, ${-g.ch - 60}px) scale(${g.s})`
        el.style.opacity = '0'
      }
      if (label) label.style.opacity = '0'
      window.setTimeout(() => {
        if (el) clearStyles(el)
        useIOS.getState().kill(id)
        if (useIOS.getState().running.length === 0) useIOS.getState().goHome()
      }, dur(260))
    } else applyCards(true)
  }

  /* ───────────── Home indicator gesture ───────────── */
  const hi = useRef<{ id: number; x0: number; y0: number; lastMove: number; lastY: number; lastT: number; v: number; held: boolean; timer: number } | null>(null)

  const posePulled = (dx: number, dy: number) => {
    const id = useIOS.getState().active
    const el = id ? refs.current.get(id) : null
    if (!el) return
    const { W, H } = viewport()
    const up = Math.max(0, dy)
    const s = 1 - Math.min(up / H, 0.75) * 0.62
    const cy = H / 2 - up * 0.55
    el.style.transition = 'none'
    el.style.transform = `translate(${(W - W * s) / 2 + dx * 0.5}px, ${cy - (H * s) / 2}px) scale(${s})`
    el.style.clipPath = `inset(0px 0px 0px 0px round ${Math.min(CARD_RADIUS, up / 3) / s}px)`
  }

  const onIndicatorDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.button > 0) return
    const ios = useIOS.getState()
    if (ios.switcher) {
      ios.goHome()
      return
    }
    e.currentTarget.setPointerCapture(e.pointerId)
    const now = performance.now()
    const state = { id: e.pointerId, x0: e.clientX, y0: e.clientY, lastMove: now, lastY: e.clientY, lastT: now, v: 0, held: false, timer: 0 }
    state.timer = window.setInterval(() => {
      const h = hi.current
      if (!h || h.held) return
      const up = h.y0 - h.lastY
      if (up > 48 && performance.now() - h.lastMove > 240 && useIOS.getState().running.length > 0) {
        h.held = true
        playSound('click')
        useIOS.getState().setSwitcher(true)
      }
    }, 60)
    hi.current = state
  }
  const onIndicatorMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const h = hi.current
    if (!h || h.id !== e.pointerId || h.held) return
    const t = performance.now()
    if (Math.abs(e.clientY - h.lastY) > 3) h.lastMove = t
    h.v = 0.7 * ((h.lastY - e.clientY) / Math.max(1, t - h.lastT)) + 0.3 * h.v
    h.lastY = e.clientY
    h.lastT = t
    posePulled(e.clientX - h.x0, h.y0 - e.clientY)
  }
  const onIndicatorUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    const h = hi.current
    hi.current = null
    if (!h || h.id !== e.pointerId) return
    window.clearInterval(h.timer)
    if (h.held) return
    const ios = useIOS.getState()
    const up = h.y0 - e.clientY
    const id = ios.active
    if (!id) return
    if (up > 90 || (h.v > 0.5 && up > 24)) {
      playSound('close')
      ios.goHome()
      return
    }
    const el = refs.current.get(id)
    if (!el || !el.style.transform) return
    const from = { transform: el.style.transform, clipPath: el.style.clipPath || FULL_CLIP }
    clearStyles(el)
    el.animate([from, { transform: IDENTITY, clipPath: FULL_CLIP }], { duration: dur(320), easing: EASE })
  }

  useEffect(() => () => window.clearInterval(hi.current?.timer), [])

  const indicatorLight = !active || switcher

  return (
    <div className={`ios-apps${switcher ? ' ios-apps--switcher' : ''}`}>
      {switcher && <div className="ios-switcher__backdrop" />}
      {order.current.map((id) => {
        const r = running.find((x) => x.appId === id)
        if (!r) return null
        const isActive = active === id && !switcher
        const cls = `ios-app${isActive ? ' ios-app--active' : ''}${closing === id && !isActive ? ' ios-app--closing' : ''}${switcher ? ' ios-app--card' : ''}`
        return (
          <div
            key={id}
            className={cls}
            style={{ zIndex: isActive || closing === id ? 5 : switcher ? 2 + cardsRef.current.indexOf(id) / 100 : 1 }}
            ref={(el) => {
              if (el) refs.current.set(id, el)
              else refs.current.delete(id)
            }}
            aria-hidden={!isActive}
            inert={!isActive}
          >
            <AppFrame appId={id} instanceId={`ios-${id}`} platform="ios" active={isActive} params={r.params} setTitle={noop} close={useIOS.getState().goHome} />
            <div className="ios-app__splash" aria-hidden="true">
              <AppIcon id={apps[id].icon} size={64} style={{ width: '100%', height: '100%' }} />
            </div>
          </div>
        )
      })}

      {switcher && (
        <div
          className="ios-switcher"
          role="dialog"
          aria-label="App Switcher"
          onPointerDown={onSwitcherDown}
          onPointerMove={onSwitcherMove}
          onPointerUp={onSwitcherUp}
          onPointerCancel={onSwitcherUp}
        >
          {cards.length === 0 && <p className="ios-switcher__empty">No Recent Apps</p>}
          {cards.map((id) => (
            <div
              key={id}
              className="ios-switcher__label"
              ref={(el) => {
                if (el) labelRefs.current.set(id, el)
                else labelRefs.current.delete(id)
              }}
            >
              <AppIcon id={apps[id].icon} size={26} />
              <span>{appName(id, 'ios')}</span>
            </div>
          ))}
          <div className="ios-switcher__sr">
            {cards.map((id) => (
              <button key={id} className="sr-only" onClick={() => useIOS.getState().open(id)}>
                Open {appName(id, 'ios')}
              </button>
            ))}
            <button className="sr-only" onClick={() => useIOS.getState().goHome()}>
              Close App Switcher
            </button>
          </div>
        </div>
      )}

      <div
        className={`ios-indicator${indicatorLight ? ' ios-indicator--light' : ''}${!active && !switcher ? ' ios-indicator--idle' : ''}`}
        onPointerDown={onIndicatorDown}
        onPointerMove={onIndicatorMove}
        onPointerUp={onIndicatorUp}
        onPointerCancel={onIndicatorUp}
        role="button"
        tabIndex={active || switcher ? 0 : -1}
        aria-label={switcher ? 'Close App Switcher' : 'Home. Swipe up to go home, swipe up and hold for the App Switcher'}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            useIOS.getState().goHome()
          }
        }}
      >
        <span className="ios-indicator__bar" />
      </div>
    </div>
  )
}
