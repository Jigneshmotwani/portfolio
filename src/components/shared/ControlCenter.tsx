import {
  Accessibility,
  Antenna,
  Bluetooth,
  FileText,
  Image as ImageIcon,
  Moon,
  Music2,
  Pause,
  Plane,
  Play,
  Radio,
  Settings2,
  SkipBack,
  SkipForward,
  Sun,
  SunDim,
  Volume1,
  Volume2,
  VolumeX,
  Wifi,
  type LucideIcon,
} from 'lucide-react'
import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react'
import { asset } from '../../lib/assets'
import { clamp } from '../../lib/hooks'
import { launch, openResume } from '../../lib/launch'
import type { Platform } from '../../lib/platform'
import { playSound } from '../../lib/sound'
import { useReducedMotion, useResolvedTheme } from '../../lib/theme'
import { currentTrack, useMusic } from '../../state/music'
import { useSettings, WALLPAPERS } from '../../state/settings'
import { useSystem } from '../../state/system'
import './ControlCenter.css'

/** Control Center: menu bar panel on macOS, full-screen overlay on iOS. */
export function ControlCenter({ platform }: { platform: Platform }) {
  const open = useSystem((s) => s.controlCenter)
  if (!open) return null
  return platform === 'mac' ? <MacControlCenter /> : <IosControlCenter />
}

/* ───────────────────────────── shared state ───────────────────────────── */

function useControls() {
  const settings = useSettings()
  const theme = useResolvedTheme()
  const reduceMotion = useReducedMotion()
  const close = () => useSystem.getState().toggleControlCenter(false)
  // Connectivity toggles are decorative; they live for the session only.
  const [wifi, setWifi] = useState(true)
  const [bluetooth, setBluetooth] = useState(true)
  const [airdrop, setAirdrop] = useState(false)
  const [airplane, setAirplane] = useState(false)
  const [cellular, setCellular] = useState(true)
  return {
    settings,
    close,
    dark: theme === 'dark',
    toggleDark: () => settings.update({ theme: theme === 'dark' ? 'light' : 'dark' }),
    reduceMotion,
    toggleReduceMotion: () => settings.update({ reduceMotion: !reduceMotion }),
    toggleDnd: () => settings.update({ dnd: !settings.dnd }),
    setVolume: (v: number) => settings.update({ volume: v, muted: v === 0 ? settings.muted : false }),
    toggleMute: () => settings.update({ muted: !settings.muted }),
    wifi,
    toggleWifi: () => setWifi((v) => !v),
    bluetooth,
    toggleBluetooth: () => setBluetooth((v) => !v),
    airdrop,
    toggleAirdrop: () => setAirdrop((v) => !v),
    airplane,
    toggleAirplane: () => setAirplane((v) => !v),
    cellular,
    toggleCellular: () => setCellular((v) => !v),
  }
}

function useEscape(onEscape: () => void) {
  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') onEscape()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onEscape])
}

/** Accessible slider (horizontal on macOS, vertical on iOS). value is 0..1 within [min, max]. */
function Slider({
  value,
  min = 0,
  max = 1,
  onChange,
  label,
  icon: Icon,
  vertical = false,
  className = '',
}: {
  value: number
  min?: number
  max?: number
  onChange: (v: number) => void
  label: string
  icon?: LucideIcon
  vertical?: boolean
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const frac = clamp((value - min) / (max - min), 0, 1)
  const setFromPointer = (e: ReactPointerEvent) => {
    const el = ref.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const f = vertical ? 1 - (e.clientY - r.top) / r.height : (e.clientX - r.left) / r.width
    onChange(Math.round((min + clamp(f, 0, 1) * (max - min)) * 100) / 100)
  }
  const onKeyDown = (e: KeyboardEvent) => {
    const step = (max - min) / 16
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') onChange(clamp(value + step, min, max))
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') onChange(clamp(value - step, min, max))
    else if (e.key === 'Home') onChange(min)
    else if (e.key === 'End') onChange(max)
    else return
    e.preventDefault()
  }
  return (
    <div
      ref={ref}
      className={`cc-slider${vertical ? ' cc-slider--v' : ''} ${className}`}
      role="slider"
      tabIndex={0}
      aria-label={label}
      aria-orientation={vertical ? 'vertical' : 'horizontal'}
      aria-valuemin={Math.round(min * 100)}
      aria-valuemax={Math.round(max * 100)}
      aria-valuenow={Math.round(value * 100)}
      onKeyDown={onKeyDown}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId)
        setFromPointer(e)
      }}
      onPointerMove={(e) => {
        if (e.currentTarget.hasPointerCapture(e.pointerId)) setFromPointer(e)
      }}
      style={{ ['--frac' as string]: frac }}
    >
      <div className="cc-slider__fill" />
      {Icon && <Icon className="cc-slider__icon" size={vertical ? 24 : 14} strokeWidth={2.4} aria-hidden="true" />}
    </div>
  )
}

function Toggle({ on, onClick, icon: Icon, label, color }: { on: boolean; onClick: () => void; icon: LucideIcon; label: string; color?: string }) {
  return (
    <button
      className={`cc-toggle${on ? ' is-on' : ''}`}
      onClick={() => {
        playSound('click')
        onClick()
      }}
      aria-pressed={on}
      aria-label={label}
      style={color ? { ['--cc-on' as string]: color } : undefined}
    >
      <Icon size={16} strokeWidth={2.4} aria-hidden="true" />
    </button>
  )
}

function NowPlaying({ compact = false }: { compact?: boolean }) {
  const { playing, index, toggle, next, prev } = useMusic()
  const track = currentTrack(index)
  return (
    <div className={`cc-np${compact ? ' cc-np--compact' : ''}`}>
      <div className="cc-np__art" aria-hidden="true">
        <Music2 size={compact ? 18 : 20} strokeWidth={2.2} />
        {playing && (
          <span className="cc-np__eq">
            <i />
            <i />
            <i />
          </span>
        )}
      </div>
      <div className="cc-np__meta">
        <div className="cc-np__title">{playing ? track.title : 'Not Playing'}</div>
        <div className="cc-np__artist">{playing ? track.artist : track.title}</div>
      </div>
      <div className="cc-np__controls">
        <button onClick={prev} aria-label="Previous track">
          <SkipBack size={16} fill="currentColor" />
        </button>
        <button onClick={toggle} aria-label={playing ? 'Pause' : 'Play'}>
          {playing ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
        </button>
        <button onClick={next} aria-label="Next track">
          <SkipForward size={16} fill="currentColor" />
        </button>
      </div>
    </div>
  )
}

function WallpaperRow({ className = '' }: { className?: string }) {
  const current = useSettings((s) => s.wallpaper)
  const update = useSettings((s) => s.update)
  return (
    <div className={`cc-wallpapers ${className}`} role="radiogroup" aria-label="Wallpaper">
      {WALLPAPERS.map((w) => (
        <button
          key={w.id}
          role="radio"
          aria-checked={current === w.id}
          aria-label={w.name}
          title={w.name}
          className={`cc-wallpaper${current === w.id ? ' is-active' : ''}`}
          style={{ backgroundImage: `url("${asset(w.src)}")`, backgroundColor: w.tint }}
          onClick={() => update({ wallpaper: w.id })}
        />
      ))}
    </div>
  )
}

/* ───────────────────────────── macOS ───────────────────────────── */

function MacControlCenter() {
  const c = useControls()
  useEscape(c.close)
  const VolumeIcon = c.settings.muted || c.settings.volume === 0 ? VolumeX : c.settings.volume < 0.5 ? Volume1 : Volume2

  const row = (icon: LucideIcon, on: boolean, toggle: () => void, title: string, sub: string, color?: string) => (
    <div className="cc-mac__row">
      <Toggle on={on} onClick={toggle} icon={icon} label={title} color={color} />
      <div className="cc-mac__row-text">
        <div className="cc-mac__row-title">{title}</div>
        <div className="cc-mac__row-sub">{sub}</div>
      </div>
    </div>
  )

  return (
    <div className="cc-mac" onPointerDown={(e) => e.target === e.currentTarget && c.close()}>
      <div className="cc-mac__panel" role="dialog" aria-label="Control Center">
        <div className="cc-mac__grid">
          <div className="cc-module cc-mac__connect">
            {row(Wifi, c.wifi, c.toggleWifi, 'Wi-Fi', c.wifi ? 'Jignesh-5G' : 'Off')}
            {row(Bluetooth, c.bluetooth, c.toggleBluetooth, 'Bluetooth', c.bluetooth ? 'On' : 'Off')}
            {row(Radio, c.airdrop, c.toggleAirdrop, 'AirDrop', c.airdrop ? 'Contacts Only' : 'Off')}
          </div>
          <button className={`cc-module cc-mac__focus${c.settings.dnd ? ' is-on' : ''}`} onClick={c.toggleDnd} aria-pressed={c.settings.dnd}>
            <span className="cc-mac__focus-icon">
              <Moon size={15} strokeWidth={2.4} fill="currentColor" />
            </span>
            <span className="cc-mac__focus-text">
              <span>{c.settings.dnd ? 'Do Not Disturb' : 'Focus'}</span>
              {c.settings.dnd && <small>On</small>}
            </span>
          </button>
          <button className={`cc-module cc-mac__small${c.dark ? ' is-on' : ''}`} onClick={c.toggleDark} aria-pressed={c.dark}>
            <span className="cc-mac__small-icon">{c.dark ? <Moon size={15} strokeWidth={2.4} /> : <Sun size={15} strokeWidth={2.4} />}</span>
            <span>Dark Mode</span>
          </button>
          <button className={`cc-module cc-mac__small${c.reduceMotion ? ' is-on' : ''}`} onClick={c.toggleReduceMotion} aria-pressed={c.reduceMotion}>
            <span className="cc-mac__small-icon">
              <Accessibility size={15} strokeWidth={2.4} />
            </span>
            <span>Reduce Motion</span>
          </button>
        </div>

        <div className="cc-module cc-mac__slider">
          <div className="cc-mac__label">Display</div>
          <Slider
            value={c.settings.brightness}
            min={0.35}
            max={1}
            onChange={(v) => c.settings.update({ brightness: v })}
            label="Display brightness"
            icon={SunDim}
          />
        </div>

        <div className="cc-module cc-mac__slider">
          <div className="cc-mac__label">
            Sound
            <button className="cc-mac__mute" onClick={c.toggleMute} aria-pressed={c.settings.muted}>
              {c.settings.muted ? 'Unmute' : 'Mute'}
            </button>
          </div>
          <Slider value={c.settings.muted ? 0 : c.settings.volume} onChange={c.setVolume} label="Sound volume" icon={VolumeIcon} />
        </div>

        <div className="cc-module">
          <NowPlaying />
        </div>

        <div className="cc-module cc-mac__wp">
          <div className="cc-mac__label">Wallpaper</div>
          <WallpaperRow />
        </div>

        <button className="cc-module cc-mac__resume" onClick={() => (c.close(), openResume())}>
          <FileText size={16} strokeWidth={2.2} />
          <span>View Resume</span>
          <small>PDF · one page</small>
        </button>
      </div>
    </div>
  )
}

/* ────────────────────────────── iOS ────────────────────────────── */

function IosControlCenter() {
  const c = useControls()
  const [closing, setClosing] = useState(false)
  const [showWallpapers, setShowWallpapers] = useState(false)
  const drag = useRef<{ y: number; moved: boolean } | null>(null)
  const [dy, setDy] = useState(0)

  const dismiss = () => {
    setClosing(true)
    window.setTimeout(c.close, 200)
  }
  useEscape(dismiss)

  const isBackground = (e: ReactPointerEvent) => {
    const t = e.target as HTMLElement
    return t === e.currentTarget || t.classList.contains('cc-ios__grid') || t.classList.contains('cc-ios__scroll')
  }

  const VolumeIcon = c.settings.muted || c.settings.volume === 0 ? VolumeX : Volume2

  const circle = (icon: LucideIcon, on: boolean, onClick: () => void, label: string, color: string, style?: string) => (
    <button
      className={`cc-ios__circle${on ? ' is-on' : ''} ${style ?? ''}`}
      style={{ ['--cc-on' as string]: color }}
      onClick={() => {
        playSound('click')
        onClick()
      }}
      aria-pressed={on}
      aria-label={label}
    >
      {(() => {
        const I = icon
        return <I size={22} strokeWidth={2.3} />
      })()}
    </button>
  )

  return (
    <div
      className={`cc-ios${closing ? ' cc-ios--closing' : ''}`}
      role="dialog"
      aria-label="Control Center"
      onPointerDown={(e) => {
        if (isBackground(e)) drag.current = { y: e.clientY, moved: false }
      }}
      onPointerMove={(e) => {
        if (!drag.current) return
        const d = Math.min(0, e.clientY - drag.current.y)
        if (Math.abs(e.clientY - drag.current.y) > 6) drag.current.moved = true
        setDy(d)
      }}
      onPointerUp={(e) => {
        if (!drag.current) return
        const d = e.clientY - drag.current.y
        const moved = drag.current.moved
        drag.current = null
        setDy(0)
        if (!moved || d < -50) dismiss()
      }}
      onPointerCancel={() => {
        drag.current = null
        setDy(0)
      }}
    >
      <div className="cc-ios__scroll" style={dy ? { transform: `translateY(${dy * 0.6}px)`, opacity: 1 + dy / 400 } : undefined}>
        <div className="cc-ios__grid">
          <div className="cc-ios__tile cc-ios__connect">
            {circle(Plane, c.airplane, c.toggleAirplane, 'Airplane Mode', '#ff9f0a')}
            {circle(Antenna, c.cellular, c.toggleCellular, 'Cellular Data', '#30d158')}
            {circle(Wifi, c.wifi, c.toggleWifi, 'Wi-Fi', '#0a84ff')}
            {circle(Bluetooth, c.bluetooth, c.toggleBluetooth, 'Bluetooth', '#0a84ff')}
          </div>
          <div className="cc-ios__tile cc-ios__music">
            <NowPlaying compact />
          </div>
          <button className={`cc-ios__tile cc-ios__focus${c.settings.dnd ? ' is-on' : ''}`} onClick={c.toggleDnd} aria-pressed={c.settings.dnd}>
            <span className="cc-ios__focus-icon">
              <Moon size={18} strokeWidth={2.4} fill="currentColor" />
            </span>
            <span className="cc-ios__focus-text">
              {c.settings.dnd ? 'Do Not Disturb' : 'Focus'}
              {c.settings.dnd && <small>On</small>}
            </span>
          </button>
          <div className="cc-ios__vslider cc-ios__brightness">
            <Slider vertical value={c.settings.brightness} min={0.35} max={1} onChange={(v) => c.settings.update({ brightness: v })} label="Brightness" icon={Sun} />
          </div>
          <div className="cc-ios__vslider cc-ios__volume">
            <Slider vertical value={c.settings.muted ? 0 : c.settings.volume} onChange={c.setVolume} label="Volume" icon={VolumeIcon} />
          </div>
          <div className="cc-ios__cell cc-ios__dark">{circle(c.dark ? Moon : Sun, c.dark, c.toggleDark, 'Dark Mode', '#ffffff', 'is-mono')}</div>
          <div className="cc-ios__cell cc-ios__motion">
            {circle(Accessibility, c.reduceMotion, c.toggleReduceMotion, 'Reduce Motion', '#ffffff', 'is-mono')}
          </div>
          <div className="cc-ios__cell cc-ios__wp">
            {circle(ImageIcon, showWallpapers, () => setShowWallpapers((v) => !v), 'Wallpaper', '#ffffff', 'is-mono')}
          </div>
          <div className="cc-ios__cell cc-ios__resume">
            {circle(FileText, false, () => (c.close(), openResume()), 'View Resume', '#ffffff', 'is-mono')}
          </div>
          <div className="cc-ios__cell cc-ios__mute">
            {circle(c.settings.muted ? VolumeX : Volume2, c.settings.muted, c.toggleMute, c.settings.muted ? 'Unmute' : 'Mute', '#ff453a')}
          </div>
          <div className="cc-ios__cell cc-ios__settings">
            {circle(Settings2, false, () => (c.close(), launch('settings')), 'Open Settings', '#ffffff', 'is-mono')}
          </div>
        </div>
        {showWallpapers && (
          <div className="cc-ios__tile cc-ios__wp-picker">
            <div className="cc-ios__wp-label">Wallpaper</div>
            <WallpaperRow className="cc-wallpapers--ios" />
          </div>
        )}
        <IosHints />
      </div>
    </div>
  )
}

function IosHints(): ReactNode {
  return <div className="cc-ios__hint">Tap outside or swipe up to close</div>
}
