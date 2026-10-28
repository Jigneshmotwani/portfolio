import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { content } from '../../data/content'
import { useNow } from '../../lib/hooks'
import { openResume } from '../../lib/launch'
import { playSound } from '../../lib/sound'
import { useReducedMotion } from '../../lib/theme'
import { useSystem } from '../../state/system'
import { Wallpaper } from '../shared/Wallpaper'
import { CameraGlyph, DocGlyph, FlashlightGlyph, LockGlyph } from './glyphs'
import { iosTime } from './StatusBar'
import './LockScreen.css'

function lockDate(d: Date) {
  const weekday = d.toLocaleDateString('en-GB', { weekday: 'long' })
  const day = d.toLocaleDateString('en-GB', { day: 'numeric' })
  const month = d.toLocaleDateString('en-GB', { month: 'long' })
  return `${weekday}, ${day} ${month}`
}

/**
 * iOS lock screen. Swipe up (or press the "Swipe up to open" button /
 * Enter / ↑) to unlock. The whole sheet follows the finger and springs
 * back if the swipe is too short.
 */
export function LockScreen({ animateIn, onUnlockStart, onUnlocked }: { animateIn: boolean; onUnlockStart: () => void; onUnlocked: () => void }) {
  const now = useNow(1000)
  const reduce = useReducedMotion()
  const ref = useRef<HTMLDivElement>(null)
  const [leaving, setLeaving] = useState(false)
  const [torch, setTorch] = useState(false)
  const [shake, setShake] = useState(false)
  const drag = useRef<{ id: number; y0: number; last: number; lastT: number; v: number; active: boolean } | null>(null)
  const leavingRef = useRef(false)
  const building = content.currentlyBuilding

  const setOffset = (y: number, animate: boolean) => {
    const el = ref.current
    if (!el) return
    el.style.transition = animate ? 'transform 0.42s cubic-bezier(0.2, 0.9, 0.25, 1)' : 'none'
    el.style.transform = y ? `translate3d(0, ${y}px, 0)` : ''
    el.style.setProperty('--lock-progress', String(Math.min(1, Math.max(0, -y / (window.innerHeight * 0.5)))))
  }

  const unlock = () => {
    if (leavingRef.current) return
    leavingRef.current = true
    setLeaving(true)
    playSound('unlock')
    onUnlockStart()
    const el = ref.current
    const done = () => onUnlocked()
    if (!el || reduce) {
      done()
      return
    }
    el.style.transition = 'transform 0.46s cubic-bezier(0.32, 0.72, 0, 1)'
    el.style.transform = 'translate3d(0, -100%, 0)'
    window.setTimeout(done, 460)
  }

  // Keyboard: Enter / Space / ↑ unlocks.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const sys = useSystem.getState()
      if (sys.resumeOpen || sys.spotlight.open || sys.controlCenter || sys.notificationCenter || sys.siri.open) return
      const t = e.target as HTMLElement | null
      if (t && (t.closest('input, textarea, [contenteditable="true"]') || (t.closest('button') && e.key !== 'ArrowUp'))) return
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowUp') {
        e.preventDefault()
        unlock()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (leavingRef.current || e.button > 0) return
    if ((e.target as HTMLElement).closest('button')) return
    drag.current = { id: e.pointerId, y0: e.clientY, last: e.clientY, lastT: performance.now(), v: 0, active: false }
  }
  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const d = drag.current
    if (!d || d.id !== e.pointerId) return
    const dy = e.clientY - d.y0
    if (!d.active) {
      if (Math.abs(dy) < 6) return
      d.active = true
      try {
        e.currentTarget.setPointerCapture(e.pointerId)
      } catch {
        /* ignore */
      }
    }
    const t = performance.now()
    const dt = Math.max(1, t - d.lastT)
    d.v = 0.7 * ((e.clientY - d.last) / dt) + 0.3 * d.v
    d.last = e.clientY
    d.lastT = t
    setOffset(dy < 0 ? dy : dy * 0.18, false)
  }
  const onPointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    const d = drag.current
    drag.current = null
    if (!d || d.id !== e.pointerId || !d.active) return
    const dy = e.clientY - d.y0
    if (dy < -window.innerHeight * 0.18 || (d.v < -0.45 && dy < -24)) unlock()
    else setOffset(0, true)
  }

  return (
    <div
      ref={ref}
      className={`ios-lock${animateIn ? ' ios-lock--in' : ''}${leaving ? ' ios-lock--leaving' : ''}`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      role="region"
      aria-label="Lock screen"
    >
      <Wallpaper dim={0.12} />
      {torch && <div className="ios-lock__torch" aria-hidden="true" />}
      <div className="ios-lock__top">
        <span className={`ios-lock__padlock${leaving ? ' ios-lock__padlock--open' : ''}`}>
          <LockGlyph open={leaving} />
        </span>
        <div className="ios-lock__date">{lockDate(now)}</div>
        <div className="ios-lock__time" aria-label={`Time ${iosTime(now)}`}>
          {iosTime(now)}
        </div>
        <div className="ios-lock__widgets">
          <div className="ios-lock__widget ios-lock__widget--rect">
            <span className="ios-lock__eyebrow">Currently building</span>
            <strong>{building.title}</strong>
            <span className="ios-lock__sub">{building.stack.slice(0, 3).join(' · ')}</span>
          </div>
          {building.progress != null && (
            <div className="ios-lock__widget ios-lock__widget--ring" aria-label={`${Math.round(building.progress * 100)} percent done`}>
              <svg viewBox="0 0 44 44" aria-hidden="true">
                <circle cx="22" cy="22" r="18" fill="none" stroke="currentColor" strokeOpacity=".28" strokeWidth="4.5" />
                <circle
                  cx="22"
                  cy="22"
                  r="18"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="4.5"
                  strokeLinecap="round"
                  strokeDasharray={`${building.progress * 113.1} 113.1`}
                  transform="rotate(-90 22 22)"
                />
              </svg>
              <span>{Math.round(building.progress * 100)}%</span>
            </div>
          )}
        </div>
      </div>

      <div className="ios-lock__bottom">
        <button
          className={`ios-lock__round${torch ? ' ios-lock__round--on' : ''}`}
          aria-label={torch ? 'Turn flashlight off' : 'Turn flashlight on'}
          aria-pressed={torch}
          onClick={() => {
            playSound('click')
            setTorch((v) => !v)
          }}
        >
          <FlashlightGlyph />
        </button>
        <button className="ios-lock__resume" onClick={openResume}>
          <DocGlyph />
          View Resume
        </button>
        <button
          className={`ios-lock__round${shake ? ' ios-lock__round--shake' : ''}`}
          aria-label="Camera"
          onClick={() => {
            playSound('click')
            setShake(true)
            window.setTimeout(() => setShake(false), 400)
          }}
        >
          <CameraGlyph />
        </button>
      </div>

      <button className="ios-lock__hint" onClick={unlock} aria-label="Unlock (or swipe up)">
        Swipe up to open
      </button>
      <span className="ios-lock__indicator" aria-hidden="true" />
    </div>
  )
}
