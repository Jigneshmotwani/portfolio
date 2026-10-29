import { useCallback, useEffect, useRef, useState, type MouseEvent as ReactMouseEvent, type PointerEvent as ReactPointerEvent } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { appIconUrl, type AppIconId } from '../../assets/icons'
import { apps, dockOrder } from '../../apps/registry'
import type { AppId } from '../../apps/types'
import { launch, openFolder } from '../../lib/launch'
import { useReducedMotion } from '../../lib/theme'
import { useSettings } from '../../state/settings'
import { useSystem } from '../../state/system'
import { useWindows } from '../../state/windows'
import { Menu, type MenuEntry } from './Menu'
import './Dock.css'

const BASE = 50
const MAX = 1.72
const RANGE = 175
const GAP = 4
const PAD = 6
const SEP = 13

type Slot = { kind: 'app'; id: AppId } | { kind: 'sep' } | { kind: 'mc' } | { kind: 'trash' }

const SLOTS: Slot[] = [
  ...dockOrder.map((id) => ({ kind: 'app' as const, id })),
  { kind: 'sep' },
  { kind: 'mc' },
  { kind: 'trash' },
]

const slotWidth = (s: Slot) => (s.kind === 'sep' ? SEP : BASE)

export function Dock() {
  const running = useWindows(useShallow((s) => [...new Set(s.windows.filter((w) => w.status === 'open').map((w) => w.appId))]))
  const magnifyPref = useSettings((s) => s.dockMagnification)
  const reduced = useReducedMotion()
  const magnify = magnifyPref && !reduced
  const itemRefs = useRef<(HTMLElement | null)[]>([])
  const dockRef = useRef<HTMLElement>(null)
  const raf = useRef(0)
  const mouseX = useRef<number | null>(null)
  const [tracking, setTracking] = useState(false)
  const [bouncing, setBouncing] = useState<Set<string>>(() => new Set())
  const [menu, setMenu] = useState<{ x: number; y: number; items: MenuEntry[] } | null>(null)
  const prevRunning = useRef<AppId[]>(running)

  // Bounce icons of apps that just started running.
  useEffect(() => {
    const started = running.filter((id) => !prevRunning.current.includes(id))
    prevRunning.current = running
    if (!started.length || reduced) return
    setBouncing((b) => new Set([...b, ...started]))
    const t = window.setTimeout(
      () => setBouncing((b) => new Set([...b].filter((id) => !started.includes(id as AppId)))),
      1100,
    )
    return () => window.clearTimeout(t)
  }, [running, reduced])

  const update = useCallback(() => {
    raf.current = 0
    const mx = mouseX.current
    const widths = SLOTS.map(slotWidth)
    const baseTotal = widths.reduce((a, b) => a + b, 0) + GAP * (SLOTS.length - 1) + PAD * 2
    const baseLeft = (window.innerWidth - baseTotal) / 2
    // Scale every slot from its distance to the cursor in the *unmagnified* layout.
    let left = PAD
    const scales = SLOTS.map((slot, i) => {
      const center = baseLeft + left + widths[i] / 2
      left += widths[i] + GAP
      if (mx == null || slot.kind === 'sep') return 1
      const d = Math.abs(mx - center)
      return d < RANGE ? 1 + (MAX - 1) * ((Math.cos((Math.PI * d) / RANGE) + 1) / 2) : 1
    })
    SLOTS.forEach((slot, i) => {
      const el = itemRefs.current[i]
      if (el && slot.kind !== 'sep') el.style.setProperty('--s', scales[i].toFixed(3))
    })
    // Shift the (centred) dock so the point under the cursor stays under the cursor.
    let shift = 0
    if (mx != null) {
      const u = mx - baseLeft
      let b = PAD
      let n = PAD
      let mapped = u
      for (let i = 0; i < SLOTS.length; i++) {
        const w = widths[i]
        const nw = w * scales[i]
        if (u < b + w || i === SLOTS.length - 1) {
          mapped = u < b ? n - (b - u) : n + Math.min(u - b, w) * scales[i]
          break
        }
        b += w + GAP
        n += nw + GAP
      }
      const newTotal = widths.reduce((acc, w, i) => acc + w * scales[i], 0) + GAP * (SLOTS.length - 1) + PAD * 2
      shift = mx - ((window.innerWidth - newTotal) / 2 + mapped)
    }
    dockRef.current?.style.setProperty('--shift', `${shift.toFixed(1)}px`)
  }, [])

  const onMove = (e: ReactPointerEvent) => {
    if (!magnify || e.pointerType !== 'mouse') return
    mouseX.current = e.clientX
    if (!tracking) setTracking(true)
    if (!raf.current) raf.current = requestAnimationFrame(update)
  }

  const onLeave = () => {
    mouseX.current = null
    setTracking(false)
    if (raf.current) cancelAnimationFrame(raf.current)
    raf.current = 0
    update()
  }

  useEffect(() => {
    if (!magnify) onLeave()
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current)
    }
  }, [magnify])

  const openApp = (id: AppId) => {
    if (running.includes(id)) useWindows.getState().activateApp(id)
    else launch(id)
  }

  const showMenu = (e: ReactMouseEvent, slot: Slot) => {
    e.preventDefault()
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect()
    let items: MenuEntry[] = []
    if (slot.kind === 'app') {
      const def = apps[slot.id]
      const isRunning = running.includes(slot.id)
      items = [
        { header: def.name },
        { label: isRunning ? 'Show' : 'Open', onSelect: () => openApp(slot.id) },
        ...(!def.singleton && isRunning ? [{ label: 'New Window', onSelect: () => launch(slot.id) }] : []),
        ...(isRunning
          ? [
              { separator: true as const },
              { label: 'Hide', onSelect: () => hideApp(slot.id) },
              { label: 'Quit', onSelect: () => useWindows.getState().quitApp(slot.id) },
            ]
          : []),
      ]
    } else if (slot.kind === 'trash') {
      items = [
        { label: 'Open', onSelect: () => openFolder('/Trash') },
        { label: 'Empty Trash', disabled: true },
      ]
    } else if (slot.kind === 'mc') {
      items = [{ label: 'Open Mission Control', onSelect: () => useSystem.getState().toggleMissionControl(true) }]
    }
    setMenu({ x: r.left + r.width / 2 - 20, y: r.top - 10, items })
  }

  return (
    <>
      <nav ref={dockRef} className={`dock${tracking ? ' dock--tracking' : ''}`} aria-label="Dock" onPointerMove={onMove} onPointerLeave={onLeave}>
        <div className="dock__shelf" />
        <div className="dock__row">
          {SLOTS.map((slot, i) => {
            if (slot.kind === 'sep') return <div key="sep" className="dock__sep" ref={(el) => void (itemRefs.current[i] = el)} />
            const isApp = slot.kind === 'app'
            const id = isApp ? slot.id : slot.kind
            const label = isApp ? apps[slot.id].name : slot.kind === 'mc' ? 'Mission Control' : 'Trash'
            const icon: AppIconId = isApp ? apps[slot.id].icon : slot.kind === 'mc' ? 'missioncontrol' : 'trash'
            const on = isApp && running.includes(slot.id)
            return (
              <button
                key={id}
                ref={(el) => void (itemRefs.current[i] = el)}
                className={`dock__item${bouncing.has(id) ? ' is-bouncing' : ''}`}
                data-dock-app={id}
                aria-label={on ? `${label} (running)` : label}
                onClick={() => {
                  if (isApp) openApp(slot.id)
                  else if (slot.kind === 'mc') useSystem.getState().toggleMissionControl()
                  else openFolder('/Trash')
                }}
                onContextMenu={(e) => showMenu(e, slot)}
              >
                <span className="dock__tip" role="presentation">
                  {label}
                </span>
                <img className="dock__icon" src={appIconUrl(icon)} alt="" draggable={false} />
                <span className={`dock__dot${on ? ' is-on' : ''}`} />
              </button>
            )
          })}
        </div>
      </nav>
      {menu && <Menu items={menu.items} x={menu.x} y={menu.y} onClose={() => setMenu(null)} minWidth={160} />}
    </>
  )
}

/** "Hide": minimise every window of the app. */
function hideApp(appId: AppId) {
  const st = useWindows.getState()
  for (const w of st.windows) if (w.appId === appId && w.status === 'open' && !w.minimized) st.minimize(w.id)
}
