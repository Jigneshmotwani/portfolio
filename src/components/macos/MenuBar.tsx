import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { apps, appName } from '../../apps/registry'
import { content } from '../../data/content'
import { formatMenuBarDate } from '../../lib/format'
import { useNow } from '../../lib/hooks'
import { askJignesh, launch, openResume } from '../../lib/launch'
import { modKey } from '../../lib/platform'
import { useResolvedTheme } from '../../lib/theme'
import { useNotifications } from '../../state/notifications'
import { useSettings, wallpaperById } from '../../state/settings'
import { useSystem } from '../../state/system'
import { useActiveAppId, useWindows } from '../../state/windows'
import { Menu, type MenuEntry } from './Menu'
import {
  BatteryGlyph,
  ControlCenterGlyph,
  DocGlyph,
  LogoGlyph,
  MissionControlGlyph,
  OrbGlyph,
  SearchGlyph,
  WifiGlyph,
} from './glyphs'
import './MenuBar.css'

type MenuId = 'logo' | 'app' | 'file' | 'edit' | 'view' | 'window' | 'help' | 'wifi' | 'battery'
const LEFT_MENUS: MenuId[] = ['logo', 'app', 'file', 'edit', 'view', 'window', 'help']

interface BatteryLike {
  level: number
  charging: boolean
  addEventListener: (t: string, fn: () => void) => void
  removeEventListener: (t: string, fn: () => void) => void
}

function useBattery() {
  const [state, setState] = useState({ level: 1, charging: true, known: false })
  useEffect(() => {
    const nav = navigator as Navigator & { getBattery?: () => Promise<BatteryLike> }
    if (!nav.getBattery) return
    let battery: BatteryLike | null = null
    const sync = () => battery && setState({ level: battery.level, charging: battery.charging, known: true })
    nav
      .getBattery()
      .then((b) => {
        battery = b
        sync()
        b.addEventListener('levelchange', sync)
        b.addEventListener('chargingchange', sync)
      })
      .catch(() => {})
    return () => {
      battery?.removeEventListener('levelchange', sync)
      battery?.removeEventListener('chargingchange', sync)
    }
  }, [])
  return state
}

const sc = (key: string, shift = false) => (modKey === '⌘' ? `${shift ? '⇧' : ''}⌘${key}` : `Ctrl+${shift ? 'Shift+' : ''}${key}`)

function execEdit(cmd: 'copy' | 'cut' | 'selectAll') {
  try {
    document.execCommand(cmd)
  } catch {
    /* unsupported */
  }
}

export function MenuBar({ onLock, onRestart }: { onLock: () => void; onRestart: () => void }) {
  const activeAppId = useActiveAppId()
  const focusedId = useWindows((s) => s.focusedId)
  const windows = useWindows((s) => s.windows)
  const theme = useResolvedTheme()
  const wallpaper = useSettings((s) => s.wallpaper)
  const cc = useSystem((s) => s.controlCenter)
  const nc = useSystem((s) => s.notificationCenter)
  const unread = useNotifications((s) => s.items.some((n) => !n.read))
  const now = useNow(1000)
  const battery = useBattery()
  const [open, setOpen] = useState<MenuId | null>(null)
  const [anchor, setAnchor] = useState<{ x: number; align: 'left' | 'right' }>({ x: 0, align: 'left' })
  const barRef = useRef<HTMLDivElement>(null)
  const btnRefs = useRef<Partial<Record<MenuId, HTMLButtonElement | null>>>({})

  const onDark = theme === 'dark' || wallpaperById(wallpaper).tone === 'dark'
  const appLabel = appName(activeAppId, 'mac')
  const focused = windows.find((w) => w.id === focusedId && w.status === 'open')
  const openWins = windows.filter((w) => w.status === 'open')

  const show = useCallback((id: MenuId) => {
    const el = btnRefs.current[id]
    if (!el) return
    const r = el.getBoundingClientRect()
    const right = id === 'wifi' || id === 'battery'
    setAnchor(right ? { x: r.right + 4, align: 'right' } : { x: r.left - 4, align: 'left' })
    setOpen(id)
  }, [])

  const close = useCallback(() => setOpen(null), [])

  const toggle = (id: MenuId) => (open === id ? close() : show(id))
  const hoverSwitch = (id: MenuId) => {
    if (open && open !== id) show(id)
  }

  const keyNav = (dir: -1 | 1) => {
    if (!open || !LEFT_MENUS.includes(open)) return
    const i = LEFT_MENUS.indexOf(open)
    show(LEFT_MENUS[(i + dir + LEFT_MENUS.length) % LEFT_MENUS.length])
  }

  const newWindow = () => {
    if (apps[activeAppId].singleton) launch(activeAppId)
    else useWindows.getState().open(activeAppId)
  }

  const menus: Record<MenuId, MenuEntry[]> = {
    logo: [
      { label: 'About This Mac', onSelect: () => launch('settings', { section: 'about' }) },
      { separator: true },
      { label: 'System Settings…', onSelect: () => launch('settings') },
      { separator: true },
      { label: 'Mission Control', shortcut: 'F3', onSelect: () => useSystem.getState().toggleMissionControl(true) },
      { label: 'View Resume', onSelect: openResume },
      { separator: true },
      { label: 'Lock Screen', shortcut: modKey === '⌘' ? '⌃⌘Q' : '', onSelect: onLock },
      { label: 'Restart…', onSelect: onRestart },
    ],
    app: [
      { label: `About ${appLabel}`, onSelect: () => launch('settings', { section: 'about' }) },
      { separator: true },
      { label: 'Settings…', shortcut: sc(','), onSelect: () => launch('settings') },
      { separator: true },
      {
        label: `Hide ${appLabel}`,
        disabled: !focused,
        onSelect: () => {
          const st = useWindows.getState()
          for (const w of st.windows) if (w.appId === activeAppId && w.status === 'open') st.minimize(w.id)
        },
      },
      {
        label: `Quit ${appLabel}`,
        shortcut: sc('Q'),
        disabled: !openWins.some((w) => w.appId === activeAppId),
        onSelect: () => useWindows.getState().quitApp(activeAppId),
      },
    ],
    file: [
      { label: activeAppId === 'finder' ? 'New Finder Window' : 'New Window', shortcut: sc('N'), onSelect: newWindow },
      { label: 'Open Resume…', shortcut: sc('O'), onSelect: openResume },
      { separator: true },
      { label: 'Close Window', shortcut: sc('W'), disabled: !focused, onSelect: () => focused && useWindows.getState().close(focused.id) },
    ],
    edit: [
      { label: 'Undo', shortcut: sc('Z'), disabled: true },
      { label: 'Redo', shortcut: sc('Z', true), disabled: true },
      { separator: true },
      { label: 'Cut', shortcut: sc('X'), onSelect: () => execEdit('cut') },
      { label: 'Copy', shortcut: sc('C'), onSelect: () => execEdit('copy') },
      { label: 'Paste', shortcut: sc('V'), disabled: true },
      { label: 'Select All', shortcut: sc('A'), onSelect: () => execEdit('selectAll') },
    ],
    view: [
      {
        label: document.fullscreenElement ? 'Exit Full Screen' : 'Enter Full Screen',
        shortcut: modKey === '⌘' ? '⌃⌘F' : 'F11',
        onSelect: () => {
          const el = document.documentElement
          if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {})
          else el.requestFullscreen?.().catch(() => {})
        },
      },
      { separator: true },
      { label: 'Mission Control', shortcut: 'F3', onSelect: () => useSystem.getState().toggleMissionControl(true) },
      { label: 'Spotlight Search', shortcut: `${modKey === '⌘' ? '⌘' : 'Ctrl+'}Space`, onSelect: () => useSystem.getState().openSpotlight() },
      { label: 'Control Center', onSelect: () => useSystem.getState().toggleControlCenter(true) },
      { label: 'Notification Center', onSelect: () => useSystem.getState().toggleNotificationCenter(true) },
    ],
    window: [
      { label: 'Minimize', shortcut: sc('M'), disabled: !focused, onSelect: () => focused && useWindows.getState().minimize(focused.id) },
      {
        label: 'Zoom',
        disabled: !focused || !apps[focused.appId].window.resizable,
        onSelect: () => focused && useWindows.getState().toggleMaximize(focused.id),
      },
      { separator: true },
      {
        label: 'Bring All to Front',
        disabled: !openWins.length,
        onSelect: () => {
          const st = useWindows.getState()
          ;[...st.windows].sort((a, b) => a.z - b.z).forEach((w) => w.status === 'open' && st.focus(w.id))
        },
      },
      ...(openWins.length ? [{ separator: true as const }] : []),
      ...openWins.map((w) => ({
        label: w.title,
        checked: w.id === focusedId,
        onSelect: () => useWindows.getState().focus(w.id),
      })),
    ],
    help: [
      { label: 'Ask Jignesh…', onSelect: () => askJignesh() },
      { label: 'View Resume', onSelect: openResume },
      { separator: true },
      {
        label: 'Keyboard Shortcuts',
        onSelect: () =>
          useNotifications.getState().push({
            appId: 'settings',
            title: 'Keyboard shortcuts',
            body: `${modKey === '⌘' ? '⌘' : 'Ctrl+'}Space or ${modKey === '⌘' ? '⌘' : 'Ctrl+'}K: Spotlight · F3 or Ctrl+↑: Mission Control · Esc: close overlays`,
          }),
      },
      { label: 'Source Code on GitHub', onSelect: () => launch('safari', { url: 'https://github.com/Jigneshmotwani/portfolio' }) },
    ],
    wifi: [
      { header: 'Wi‑Fi' },
      { label: 'Jignesh-Portfolio-5G', checked: true },
      { label: 'Marina-Bay-Guest' },
      { label: 'SUTD-Wireless' },
      { separator: true },
      { label: 'Wi‑Fi Settings…', onSelect: () => launch('settings') },
    ],
    battery: [
      { header: 'Battery' },
      { label: `${Math.round(battery.level * 100)}%${battery.known ? '' : ' (simulated)'}`, disabled: true },
      { label: `Power Source: ${battery.charging ? 'Power Adapter' : 'Battery'}`, disabled: true },
      { separator: true },
      { label: 'Battery Settings…', onSelect: () => launch('settings') },
    ],
  }

  const title = (id: MenuId, label: ReactNode, extra = '') => (
    <button
      ref={(el) => void (btnRefs.current[id] = el)}
      className={`mbar__item${open === id ? ' is-open' : ''}${extra}`}
      aria-haspopup="menu"
      aria-expanded={open === id}
      onPointerDown={(e) => {
        if (e.button !== 0) return
        e.preventDefault()
        toggle(id)
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
          e.preventDefault()
          show(id)
        }
      }}
      onPointerEnter={() => hoverSwitch(id)}
    >
      {label}
    </button>
  )

  return (
    <>
      <header ref={barRef} className={`mbar${onDark ? ' mbar--on-dark' : ''}`} role="menubar" aria-label="Menu bar">
        <div className="mbar__left">
          {title('logo', <LogoGlyph />, ' mbar__logo')}
          {title('app', appLabel, ' mbar__app')}
          {title('file', 'File')}
          {title('edit', 'Edit')}
          {title('view', 'View')}
          {title('window', 'Window')}
          {title('help', 'Help')}
        </div>
        <div className="mbar__right">
          <button className="mbar__resume" onClick={openResume} title="Open a plain, printable resume">
            <DocGlyph />
            <span>Resume</span>
          </button>
          <button className="mbar__item mbar__icon" aria-label={`${content.assistant.name}`} title={content.assistant.name} onClick={() => askJignesh()}>
            <OrbGlyph />
          </button>
          <button
            className="mbar__item mbar__icon mbar__hide-narrow"
            aria-label="Mission Control"
            title="Mission Control (F3)"
            onClick={() => useSystem.getState().toggleMissionControl()}
          >
            <MissionControlGlyph />
          </button>
          {title('wifi', <WifiGlyph />, ' mbar__icon mbar__hide-narrow')}
          {title('battery', <BatteryGlyph level={battery.level} charging={battery.charging} />, ' mbar__icon mbar__hide-narrow')}
          <button
            className={`mbar__item mbar__icon${cc ? ' is-open' : ''}`}
            aria-label="Control Center"
            aria-expanded={cc}
            onClick={() => useSystem.getState().toggleControlCenter()}
          >
            <ControlCenterGlyph />
          </button>
          <button
            className="mbar__item mbar__icon"
            aria-label="Spotlight"
            title={`Spotlight (${modKey === '⌘' ? '⌘' : 'Ctrl+'}Space)`}
            onClick={() => useSystem.getState().openSpotlight()}
          >
            <SearchGlyph />
          </button>
          <button
            className={`mbar__item mbar__clock${nc ? ' is-open' : ''}`}
            aria-label="Notification Center"
            aria-expanded={nc}
            onClick={() => {
              useSystem.getState().toggleNotificationCenter()
              useNotifications.getState().markAllRead()
            }}
          >
            {unread && <span className="mbar__badge" aria-label="Unread notifications" />}
            <time dateTime={now.toISOString()}>{formatMenuBarDate(now)}</time>
          </button>
        </div>
      </header>
      {open && (
        <Menu
          key={open}
          items={menus[open]}
          x={anchor.x}
          y={30}
          align={anchor.align}
          onClose={close}
          ignore={barRef}
          onKeyNav={keyNav}
          label={open}
          minWidth={open === 'logo' ? 230 : 210}
        />
      )}
    </>
  )
}
