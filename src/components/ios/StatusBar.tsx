import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { useMediaQuery, useNow } from '../../lib/hooks'
import { openResume } from '../../lib/launch'
import { useTopActivity } from '../../state/island'
import { useSystem } from '../../state/system'
import { DynamicIsland } from './DynamicIsland'
import { BatteryGlyph, DocGlyph, SignalGlyph, WifiGlyph } from './glyphs'
import './StatusBar.css'

/** "9:41" — iOS shows 12-hour time without AM/PM. */
export function iosTime(date: Date) {
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).replace(/\s?[AP]M$/i, '')
}

interface BatteryManagerLike extends EventTarget {
  level: number
  charging: boolean
}

function useBattery() {
  const [state, setState] = useState({ level: 1, charging: false })
  useEffect(() => {
    const nav = navigator as Navigator & { getBattery?: () => Promise<BatteryManagerLike> }
    if (!nav.getBattery) return
    let battery: BatteryManagerLike | null = null
    const update = () => battery && setState({ level: battery.level, charging: battery.charging })
    nav
      .getBattery()
      .then((b) => {
        battery = b
        update()
        b.addEventListener('levelchange', update)
        b.addEventListener('chargingchange', update)
      })
      .catch(() => {})
    return () => {
      battery?.removeEventListener('levelchange', update)
      battery?.removeEventListener('chargingchange', update)
    }
  }, [])
  return state
}

/**
 * iOS status bar: time + Resume pill, Dynamic Island, signal/Wi-Fi/battery.
 * Dragging down from the top-right opens Control Center, from the
 * top-left/centre Notification Center (taps work as mouse fallbacks).
 */
export function StatusBar({ tone, carrier = false }: { tone: 'light' | 'adaptive'; carrier?: boolean }) {
  const now = useNow(60_000)
  const narrow = useMediaQuery('(max-width: 379px)')
  const battery = useBattery()
  const hasActivity = useTopActivity() !== null
  const toggleCC = useSystem((s) => s.toggleControlCenter)
  const toggleNC = useSystem((s) => s.toggleNotificationCenter)
  const drag = useRef<{ x: number; y: number; id: number; fired: boolean } | null>(null)
  const suppressClick = useRef(false)

  const onPointerDown = (e: ReactPointerEvent<HTMLElement>) => {
    drag.current = { x: e.clientX, y: e.clientY, id: e.pointerId, fired: false }
    suppressClick.current = false
  }
  const onPointerMove = (e: ReactPointerEvent<HTMLElement>) => {
    const d = drag.current
    if (!d || d.fired || d.id !== e.pointerId) return
    const dy = e.clientY - d.y
    const dx = e.clientX - d.x
    if (dy > 22 && dy > Math.abs(dx)) {
      d.fired = true
      suppressClick.current = true
      if (d.x > window.innerWidth * 0.6) toggleCC(true)
      else toggleNC(true)
    }
  }
  const onPointerEnd = () => {
    drag.current = null
  }
  const guard = (fn: () => void) => () => {
    if (suppressClick.current) {
      suppressClick.current = false
      return
    }
    fn()
  }

  return (
    <header
      className={`ios-status ios-status--${tone}${hasActivity ? ' ios-status--activity' : ''}`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerEnd}
      onPointerCancel={onPointerEnd}
    >
      <div className="ios-status__left">
        {/* The lock screen shows the big clock, so its status bar skips the time. */}
        {!carrier && (
          <button className="ios-status__time" onClick={guard(() => toggleNC(true))} aria-label="Open Notification Center">
            {iosTime(now)}
          </button>
        )}
        <button className="ios-status__resume" onClick={guard(openResume)} aria-label="View resume">
          <DocGlyph />
          <span>{narrow ? 'CV' : 'Resume'}</span>
        </button>
      </div>
      <DynamicIsland />
      <button className="ios-status__right" onClick={guard(() => toggleCC(true))} aria-label="Open Control Center">
        <SignalGlyph />
        <WifiGlyph />
        <BatteryGlyph level={battery.level} charging={battery.charging} />
      </button>
    </header>
  )
}
