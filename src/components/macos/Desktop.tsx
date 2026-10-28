import { useState, type MouseEvent as ReactMouseEvent } from 'react'
import { folderIconUrl } from '../../assets/icons'
import { content } from '../../data/content'
import { askJignesh, FOLDERS, launch, openFolder, openResume } from '../../lib/launch'
import { useSystem } from '../../state/system'
import { CurrentlyBuildingWidget, ClockWeatherWidget, GitHubContributionsWidget } from '../../widgets'
import { ControlCenter } from '../shared/ControlCenter'
import { NotificationBanners } from '../shared/NotificationBanners'
import { NotificationCenter } from '../shared/NotificationCenter'
import { Spotlight } from '../shared/Spotlight'
import { Wallpaper } from '../shared/Wallpaper'
import { Dock } from './Dock'
import { Menu, type MenuEntry } from './Menu'
import { MenuBar } from './MenuBar'
import { WindowLayer } from './WindowLayer'
import './Desktop.css'

const DESKTOP_FOLDERS = [
  { id: 'projects', name: 'Projects', path: FOLDERS.projects },
  { id: 'resume', name: 'Resume', path: FOLDERS.resume },
  { id: 'certifications', name: 'Certifications', path: FOLDERS.certifications },
  { id: 'experience', name: 'Experience', path: FOLDERS.experience },
] as const

export function Desktop({ onLock, onRestart }: { onLock: () => void; onRestart: () => void }) {
  const [selected, setSelected] = useState<string | null>(null)
  const [ctx, setCtx] = useState<{ x: number; y: number } | null>(null)
  const mc = useSystem((s) => s.missionControl)

  const onContextMenu = (e: ReactMouseEvent) => {
    const t = e.target as HTMLElement
    if (t.closest('.mdesk__icon, .mdesk__widgets, .win, .dock, .mbar')) return
    e.preventDefault()
    setCtx({ x: e.clientX, y: e.clientY })
  }

  const ctxItems: MenuEntry[] = [
    { label: 'New Finder Window', onSelect: () => launch('finder') },
    { separator: true },
    { label: 'Change Wallpaper…', onSelect: () => launch('settings', { section: 'wallpaper' }) },
    { label: 'Open Terminal', onSelect: () => launch('terminal') },
    { label: `${content.assistant.name}…`, onSelect: () => askJignesh() },
    { separator: true },
    { label: 'View Resume', onSelect: openResume },
    { label: 'About This Mac', onSelect: () => launch('settings', { section: 'about' }) },
  ]

  return (
    <div className="mdesk" onContextMenu={onContextMenu}>
      <Wallpaper />
      <div
        className="mdesk__surface"
        onPointerDown={(e) => {
          if (e.target === e.currentTarget) setSelected(null)
        }}
      >
        <section className="mdesk__widgets" aria-label="Widgets">
          <div className="mdesk__widget-row">
            <ClockWeatherWidget size="small" platform="mac" />
            <CurrentlyBuildingWidget size="small" platform="mac" />
          </div>
          <div className="mdesk__widget-wide">
            <GitHubContributionsWidget size="medium" platform="mac" />
          </div>
        </section>

        <ul className="mdesk__icons" aria-label="Desktop">
          {DESKTOP_FOLDERS.map((f) => (
            <li key={f.id}>
              <button
                className={`mdesk__icon${selected === f.id ? ' is-selected' : ''}`}
                aria-label={`${f.name} folder`}
                onClick={() => setSelected(f.id)}
                onDoubleClick={() => openFolder(f.path)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') openFolder(f.path)
                }}
                onFocus={() => setSelected(f.id)}
              >
                <img src={folderIconUrl(f.id)} alt="" draggable={false} />
                <span>{f.name}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <WindowLayer />

      {!mc && (
        <button className="mdesk__orb" onClick={() => askJignesh()} aria-label={content.assistant.name} title={content.assistant.name}>
          <span className="mdesk__orb-core" />
          <span className="mdesk__orb-label">{content.assistant.name}</span>
        </button>
      )}

      <Dock />
      <MenuBar onLock={onLock} onRestart={onRestart} />

      <div className="mdesk__overlays">
        <Spotlight platform="mac" />
        <ControlCenter platform="mac" />
        <NotificationCenter platform="mac" />
        <NotificationBanners platform="mac" />
      </div>

      {ctx && <Menu items={ctxItems} x={ctx.x} y={ctx.y} onClose={() => setCtx(null)} label="Desktop" />}
    </div>
  )
}
