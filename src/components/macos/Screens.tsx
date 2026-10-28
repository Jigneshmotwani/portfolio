import { useEffect, useRef, useState } from 'react'
import { content } from '../../data/content'
import { asset } from '../../lib/assets'
import { useNow } from '../../lib/hooks'
import { openResume } from '../../lib/launch'
import { playSound } from '../../lib/sound'
import { Wallpaper } from '../shared/Wallpaper'
import { ArrowRightGlyph, BatteryGlyph, DocGlyph, LogoGlyph, WifiGlyph } from './glyphs'
import './Screens.css'

const BOOT_MS = 1700

/** Black screen with the logo and a progress bar. Any click / key skips it. */
export function BootScreen({ onDone }: { onDone: () => void }) {
  const [started, setStarted] = useState(false)
  const done = useRef(false)

  useEffect(() => {
    const finish = () => {
      if (done.current) return
      done.current = true
      onDone()
    }
    const raf = requestAnimationFrame(() => setStarted(true))
    playSound('boot')
    const t = window.setTimeout(finish, BOOT_MS + 250)
    const skip = (e: Event) => {
      if (e instanceof KeyboardEvent && ['Shift', 'Control', 'Alt', 'Meta'].includes(e.key)) return
      finish()
    }
    window.addEventListener('pointerdown', skip)
    window.addEventListener('keydown', skip)
    return () => {
      cancelAnimationFrame(raf)
      window.clearTimeout(t)
      window.removeEventListener('pointerdown', skip)
      window.removeEventListener('keydown', skip)
    }
  }, [onDone])

  return (
    <div className="mboot" role="progressbar" aria-label="Starting up" aria-valuemin={0} aria-valuemax={100}>
      <LogoGlyph className="mboot__logo" />
      <div className="mboot__bar">
        <div className={`mboot__fill${started ? ' is-running' : ''}`} style={{ transitionDuration: `${BOOT_MS}ms` }} />
      </div>
      <span className="sr-only">Click or press any key to skip</span>
    </div>
  )
}

/** Login window: blurred wallpaper, avatar, any password works. */
export function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const now = useNow(1000)
  const [pw, setPw] = useState('')
  const [leaving, setLeaving] = useState(false)
  const input = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const t = window.setTimeout(() => input.current?.focus({ preventScroll: true }), 300)
    return () => window.clearTimeout(t)
  }, [])

  const submit = () => {
    if (leaving) return
    setLeaving(true)
    playSound('unlock')
    window.setTimeout(onLogin, 420)
  }

  const date = now.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })
  const time = now.toLocaleTimeString('en-GB', { hour: 'numeric', minute: '2-digit', hour12: false })

  return (
    <div
      className={`mlogin${leaving ? ' is-leaving' : ''}`}
      onPointerDown={(e) => {
        if (!(e.target as HTMLElement).closest('button, input')) input.current?.focus()
      }}
    >
      <Wallpaper blur />
      <div className="mlogin__status">
        <button className="mlogin__resume" onClick={openResume}>
          <DocGlyph />
          <span>Resume</span>
        </button>
        <WifiGlyph />
        <BatteryGlyph level={1} />
      </div>

      <div className="mlogin__clock" aria-live="off">
        <div className="mlogin__date">{date}</div>
        <div className="mlogin__time">{time}</div>
      </div>

      <form
        className="mlogin__user"
        onSubmit={(e) => {
          e.preventDefault()
          submit()
        }}
      >
        <img className="mlogin__avatar" src={asset(content.profile.photo)} alt="" draggable={false} />
        <div className="mlogin__name">{content.profile.name}</div>
        <div className="mlogin__field">
          <label htmlFor="mlogin-password" className="sr-only">
            Password
          </label>
          <input
            ref={input}
            id="mlogin-password"
            type="password"
            placeholder="Enter Password"
            autoComplete="off"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
          />
          <button type="submit" className="mlogin__go" aria-label="Log in">
            <ArrowRightGlyph />
          </button>
        </div>
        <p className="mlogin__hint">No password needed — just press Enter</p>
      </form>
    </div>
  )
}
