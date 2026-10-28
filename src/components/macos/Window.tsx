import { memo, useCallback, useRef, useState, type MouseEvent as ReactMouseEvent, type PointerEvent as ReactPointerEvent } from 'react'
import { apps } from '../../apps/registry'
import { playSound } from '../../lib/sound'
import { MENUBAR_HEIGHT, useWindows, type Bounds } from '../../state/windows'
import { AppFrame } from '../shared/AppFrame'
import { CloseGlyph, MinimizeGlyph, ZoomGlyph } from './glyphs'
import './Window.css'

export interface MCTransform {
  x: number
  y: number
  scale: number
}

type Edge = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw'
const EDGES: Edge[] = ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw']
const INTERACTIVE = 'button, a, input, textarea, select, label, [data-no-drag], [contenteditable="true"], [role="slider"]'

interface Gesture {
  kind: 'drag' | 'resize'
  edge?: Edge
  pointerId: number
  startX: number
  startY: number
  base: Bounds
  cur: Bounds
  moved: boolean
}

/** Where a minimized window flies to: its Dock icon (or the Dock's middle). */
function minimizeTarget(appId: string, w: number, h: number) {
  const el = document.querySelector(`[data-dock-app="${appId}"]`)
  const r = el?.getBoundingClientRect()
  const cx = r ? r.left + r.width / 2 : window.innerWidth / 2
  const cy = r ? r.top + r.height / 2 : window.innerHeight - 36
  const s = Math.max(0.04, Math.min(48 / w, 48 / h))
  return { x: cx - (w * s) / 2, y: cy - (h * s) / 2, s }
}

export const Window = memo(function Window({ id, mc, onMcSelect }: { id: string; mc: MCTransform | null; onMcSelect?: (id: string) => void }) {
  const win = useWindows((s) => s.windows.find((w) => w.id === id))
  const active = useWindows((s) => s.focusedId === id)
  const outerRef = useRef<HTMLDivElement>(null)
  const gesture = useRef<Gesture | null>(null)
  const [interacting, setInteracting] = useState(false)

  const setTitle = useCallback((title: string) => useWindows.getState().setTitle(id, title), [id])
  const close = useCallback(() => {
    playSound('close')
    useWindows.getState().close(id)
  }, [id])

  const apply = (b: Bounds) => {
    const el = outerRef.current
    if (!el) return
    el.style.transform = `translate3d(${b.x}px, ${b.y}px, 0)`
    el.style.width = `${b.w}px`
    el.style.height = `${b.h}px`
  }

  const begin = (e: ReactPointerEvent, kind: Gesture['kind'], edge?: Edge) => {
    const w = useWindows.getState().windows.find((x) => x.id === id)
    const el = outerRef.current
    if (!w || !el) return
    const base = { x: w.x, y: w.y, w: w.w, h: w.h }
    gesture.current = { kind, edge, pointerId: e.pointerId, startX: e.clientX, startY: e.clientY, base, cur: base, moved: false }
    try {
      el.setPointerCapture(e.pointerId)
    } catch {
      /* ignore */
    }
    el.addEventListener('pointermove', onMove)
    el.addEventListener('pointerup', onUp)
    el.addEventListener('pointercancel', onUp)
  }

  const onMove = (e: PointerEvent) => {
    const g = gesture.current
    if (!g || e.pointerId !== g.pointerId) return
    const dx = e.clientX - g.startX
    const dy = e.clientY - g.startY
    if (!g.moved) {
      if (Math.hypot(dx, dy) < 3) return
      g.moved = true
      setInteracting(true)
      document.body.classList.add(g.kind === 'drag' ? 'mac-dragging' : `mac-resizing-${g.edge}`)
      const w = useWindows.getState().windows.find((x) => x.id === id)
      if (g.kind === 'drag' && w?.maximized && w.restore) {
        // Pull a zoomed window out from under the cursor, keeping the grab point proportional.
        const frac = (g.startX - w.x) / w.w
        const nw = w.restore.w
        const nh = w.restore.h
        const nx = Math.round(g.startX - frac * nw)
        useWindows.getState().toggleMaximize(id)
        useWindows.getState().setBounds(id, { x: nx, y: w.y })
        g.base = { x: nx, y: w.y, w: nw, h: nh }
      }
    }
    const vw = window.innerWidth
    const vh = window.innerHeight
    const b = g.base
    if (g.kind === 'drag') {
      const x = Math.min(Math.max(b.x + dx, -b.w + 120), vw - 120)
      const y = Math.min(Math.max(b.y + dy, MENUBAR_HEIGHT), vh - 64)
      g.cur = { ...b, x, y }
    } else {
      const def = apps[useWindows.getState().windows.find((x) => x.id === id)!.appId].window
      const edge = g.edge!
      let { x, y, w, h } = b
      if (edge.includes('e')) w = Math.max(def.minW, Math.min(b.w + dx, vw - b.x))
      if (edge.includes('s')) h = Math.max(def.minH, Math.min(b.h + dy, vh - b.y))
      if (edge.includes('w')) {
        const nx = Math.min(Math.max(b.x + dx, -b.w + 120), b.x + b.w - def.minW)
        w = b.w + (b.x - nx)
        x = nx
      }
      if (edge.includes('n')) {
        const ny = Math.min(Math.max(b.y + dy, MENUBAR_HEIGHT), b.y + b.h - def.minH)
        h = b.h + (b.y - ny)
        y = ny
      }
      g.cur = { x, y, w, h }
    }
    apply(g.cur)
  }

  const onUp = (e: PointerEvent) => {
    const g = gesture.current
    const el = outerRef.current
    if (!g || e.pointerId !== g.pointerId) return
    gesture.current = null
    if (el) {
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerup', onUp)
      el.removeEventListener('pointercancel', onUp)
      try {
        el.releasePointerCapture(e.pointerId)
      } catch {
        /* ignore */
      }
    }
    document.body.classList.remove('mac-dragging', ...EDGES.map((d) => `mac-resizing-${d}`))
    if (g.moved) {
      const st = useWindows.getState()
      const w = st.windows.find((x) => x.id === id)
      st.setBounds(id, g.cur)
      // A manual resize of a zoomed window un-zooms it.
      if (g.kind === 'resize' && w?.maximized) {
        useWindows.setState((s) => ({
          windows: s.windows.map((x) => (x.id === id ? { ...x, maximized: false, restore: undefined } : x)),
        }))
      }
      setInteracting(false)
    }
  }

  if (!win) return null
  const def = apps[win.appId]
  const unified = def.window.chrome === 'unified'

  const onPointerDownCapture = () => {
    if (!active && !mc) useWindows.getState().focus(id)
  }

  const isDragTarget = (target: HTMLElement) => {
    const region = target.closest('[data-drag]')
    if (!region || !outerRef.current?.contains(region)) return false
    const interactive = target.closest(INTERACTIVE)
    return !(interactive && region.contains(interactive))
  }

  const onPointerDown = (e: ReactPointerEvent) => {
    if (mc || e.button !== 0 || win.status === 'closing') return
    if (!isDragTarget(e.target as HTMLElement)) return
    begin(e, 'drag')
  }

  const onDoubleClick = (e: ReactMouseEvent) => {
    if (mc) return
    if (isDragTarget(e.target as HTMLElement)) useWindows.getState().toggleMaximize(id)
  }

  let transform = `translate3d(${win.x}px, ${win.y}px, 0)`
  let opacity = 1
  if (win.minimized) {
    const t = minimizeTarget(win.appId, win.w, win.h)
    transform = `translate3d(${t.x}px, ${t.y}px, 0) scale(${t.s})`
    opacity = 0
  } else if (mc) {
    transform = `translate3d(${mc.x}px, ${mc.y}px, 0) scale(${mc.scale})`
  }

  const cls = [
    'win',
    unified ? 'win--unified' : 'win--standard',
    active && !mc ? 'win--active' : '',
    win.maximized ? 'win--maximized' : '',
    win.minimized ? 'win--minimized' : '',
    win.status === 'closing' ? 'win--closing' : '',
    interacting ? 'win--interacting' : '',
    mc ? 'win--mc' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div
      ref={outerRef}
      className={cls}
      role="dialog"
      aria-label={win.title}
      aria-hidden={win.minimized || undefined}
      data-window-id={id}
      style={{ transform, width: win.w, height: win.h, zIndex: win.z, opacity }}
      onPointerDownCapture={onPointerDownCapture}
      onPointerDown={onPointerDown}
      onDoubleClick={onDoubleClick}
      onClickCapture={
        mc
          ? (e) => {
              e.preventDefault()
              e.stopPropagation()
              onMcSelect?.(id)
            }
          : undefined
      }
    >
      <div className="win__frame">
        <TrafficLights id={id} active={active} unified={unified} resizable={def.window.resizable} onClose={close} />
        {!unified && (
          <div className="win__titlebar" data-drag>
            <span className="win__title">{win.title}</span>
          </div>
        )}
        <div className="win__content">
          <AppFrame
            appId={win.appId}
            instanceId={id}
            platform="mac"
            active={active && !win.minimized}
            params={win.params}
            setTitle={setTitle}
            close={close}
          />
        </div>
        {mc && <div className="win__mc-shield" />}
      </div>
      {def.window.resizable &&
        !mc &&
        !win.minimized &&
        EDGES.map((edge) => (
          <div
            key={edge}
            className={`win__rs win__rs--${edge}`}
            onPointerDown={(e) => {
              if (e.button !== 0) return
              e.stopPropagation()
              begin(e, 'resize', edge)
            }}
          />
        ))}
    </div>
  )
})

function TrafficLights({ id, active, unified, resizable, onClose }: { id: string; active: boolean; unified: boolean; resizable: boolean; onClose: () => void }) {
  return (
    <div className={`tl${unified ? ' tl--unified' : ''}${active ? ' tl--active' : ''}`} data-no-drag onDoubleClick={(e) => e.stopPropagation()}>
      <button className="tl__btn tl__btn--close" aria-label="Close window" onClick={onClose}>
        <CloseGlyph />
      </button>
      <button
        className="tl__btn tl__btn--min"
        aria-label="Minimize window"
        onClick={() => {
          playSound('minimize')
          useWindows.getState().minimize(id)
        }}
      >
        <MinimizeGlyph />
      </button>
      <button
        className="tl__btn tl__btn--zoom"
        aria-label="Zoom window"
        disabled={!resizable}
        onClick={() => useWindows.getState().toggleMaximize(id)}
      >
        <ZoomGlyph />
      </button>
    </div>
  )
}
