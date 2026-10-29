import { Accessibility, Bell, ChevronLeft, ChevronRight, Contrast, Image, Info, Volume2 } from 'lucide-react'
import { useEffect, useMemo, useState, type ComponentType, type ReactNode } from 'react'
import { content } from '../../data/content'
import { asset } from '../../lib/assets'
import { useApp } from '../types'
import { GlyphTile, IOSGroup, IOSPage, IOSRow, SearchField, useNavStack } from './kit'
import { AboutPane, AccessibilityPane, AppearancePane, NotificationsPane, SoundPane, WallpaperPane } from './panes'
import './Settings.css'

export type SectionId = 'about' | 'appearance' | 'accessibility' | 'wallpaper' | 'notifications' | 'sound'

interface Section {
  id: SectionId
  label: string
  iosLabel?: string
  color: string
  icon: ReactNode
  keywords: string
  pane: ComponentType<{ platform: 'mac' | 'ios' }>
}

const SECTIONS: Section[] = [
  { id: 'about', label: 'About', color: '#8e8e93', icon: <Info size={13} strokeWidth={2.6} />, keywords: 'about this mac me jignesh version specs resume', pane: AboutPane },
  { id: 'appearance', label: 'Appearance', iosLabel: 'Display & Brightness', color: '#48484a', icon: <Contrast size={13} strokeWidth={2.6} />, keywords: 'dark light mode theme accent colour color dock brightness', pane: AppearancePane },
  { id: 'accessibility', label: 'Accessibility', color: '#0a7aff', icon: <Accessibility size={13} strokeWidth={2.6} />, keywords: 'reduce motion animation', pane: AccessibilityPane },
  { id: 'wallpaper', label: 'Wallpaper', color: '#30b0c7', icon: <Image size={13} strokeWidth={2.6} />, keywords: 'background desktop picture', pane: WallpaperPane },
  { id: 'notifications', label: 'Notifications', color: '#ff3b30', icon: <Bell size={13} strokeWidth={2.6} fill="currentColor" />, keywords: 'do not disturb focus banners dnd', pane: NotificationsPane },
  { id: 'sound', label: 'Sound', iosLabel: 'Sounds', color: '#ff2d55', icon: <Volume2 size={13} strokeWidth={2.6} />, keywords: 'volume mute audio effects', pane: SoundPane },
]

/** Sidebar grouping on macOS. */
const MAC_GROUPS: SectionId[][] = [['about'], ['appearance', 'accessibility', 'wallpaper'], ['notifications', 'sound']]
/** List grouping on iOS. */
const IOS_GROUPS: SectionId[][] = [['wallpaper', 'appearance', 'accessibility'], ['notifications', 'sound'], ['about']]

const byId = (id: string) => SECTIONS.find((s) => s.id === id)
const isSection = (id: string | undefined): id is SectionId => !!id && !!byId(id)

export default function SettingsApp() {
  const { platform } = useApp()
  return platform === 'ios' ? <IOSSettings /> : <MacSettings />
}

/* ── macOS: System Settings ───────────────────────────────────────────── */

function MacSettings() {
  const { params, setTitle, active } = useApp()
  const initial: SectionId = isSection(params?.section) ? params.section : 'appearance'
  const [history, setHistory] = useState<{ list: SectionId[]; index: number }>({ list: [initial], index: 0 })
  const [query, setQuery] = useState('')
  const current = history.list[history.index]
  const section = byId(current)!

  const go = (id: SectionId) =>
    setHistory((h) => (h.list[h.index] === id ? h : { list: [...h.list.slice(0, h.index + 1), id], index: h.index + 1 }))

  useEffect(() => {
    if (isSection(params?.section)) go(params.section)
  }, [params?.nonce])

  useEffect(() => setTitle(section.label), [section.label, setTitle])

  const q = query.trim().toLowerCase()
  const matches = (s: Section) => !q || `${s.label} ${s.iosLabel ?? ''} ${s.keywords}`.toLowerCase().includes(q)
  const Pane = section.pane

  return (
    <div className={`settings-mac${active ? '' : ' is-inactive'}`}>
      <aside className="settings-sidebar">
        <div className="settings-sidebar__top" data-drag />
        <div className="settings-sidebar__search">
          <SearchField id="settings-search" value={query} onChange={setQuery} />
        </div>
        <nav className="settings-sidebar__list scroll" aria-label="Settings sections">
          {!q && (
            <button type="button" className="settings-profile" onClick={() => go('about')}>
              <img src={asset(content.profile.photo)} alt="" draggable={false} />
              <span>
                <strong>{content.profile.name}</strong>
                <small>Portfolio Account</small>
              </span>
            </button>
          )}
          {MAC_GROUPS.map((group, gi) => {
            const items = group.map((id) => byId(id)!).filter(matches)
            if (!items.length) return null
            return (
              <div key={gi} className="settings-sidebar__group">
                {items.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    className={`settings-navitem${current === s.id ? ' is-on' : ''}`}
                    aria-current={current === s.id ? 'page' : undefined}
                    onClick={() => go(s.id)}
                  >
                    <GlyphTile color={s.color}>{s.icon}</GlyphTile>
                    <span>{s.label}</span>
                  </button>
                ))}
              </div>
            )
          })}
          {q && !SECTIONS.some(matches) && <p className="settings-sidebar__empty">No results for “{query}”</p>}
        </nav>
      </aside>
      <main className="settings-main">
        <header className="settings-toolbar" data-drag>
          <div className="settings-toolbar__nav">
            <button
              type="button"
              aria-label="Back"
              disabled={history.index === 0}
              onClick={() => setHistory((h) => ({ ...h, index: Math.max(0, h.index - 1) }))}
            >
              <ChevronLeft size={18} strokeWidth={2.2} />
            </button>
            <button
              type="button"
              aria-label="Forward"
              disabled={history.index >= history.list.length - 1}
              onClick={() => setHistory((h) => ({ ...h, index: Math.min(h.list.length - 1, h.index + 1) }))}
            >
              <ChevronRight size={18} strokeWidth={2.2} />
            </button>
          </div>
          <h1 className="settings-toolbar__title">{section.label}</h1>
        </header>
        <div className="settings-content scroll" key={current}>
          <div className="settings-content__inner">
            <Pane platform="mac" />
          </div>
        </div>
      </main>
    </div>
  )
}

/* ── iOS: Settings ────────────────────────────────────────────────────── */

function IOSSettings() {
  const { params } = useApp()
  const nav = useNavStack(isSection(params?.section) ? ['root', params.section] : ['root'])
  const [query, setQuery] = useState('')

  useEffect(() => {
    if (isSection(params?.section)) nav.reset(['root', params.section])
  }, [params?.nonce])

  const q = query.trim().toLowerCase()
  const filtered = useMemo(
    () => SECTIONS.filter((s) => !q || `${s.label} ${s.iosLabel ?? ''} ${s.keywords}`.toLowerCase().includes(q)),
    [q],
  )

  if (nav.top !== 'root') {
    const s = byId(nav.top)!
    const Pane = s.pane
    return (
      <IOSPage key={nav.top} dir={nav.dir} title={s.iosLabel ?? s.label} large={false} back={{ label: 'Settings', onClick: nav.pop }}>
        <div className="settings-iospage">
          <Pane platform="ios" />
        </div>
      </IOSPage>
    )
  }

  const icon = (s: Section) => (
    <span className="settings-iosicon" style={{ background: s.color }}>
      {s.icon}
    </span>
  )

  return (
    <IOSPage
      key="root"
      dir={nav.dir}
      title="Settings"
      header={<SearchField platform="ios" value={query} onChange={setQuery} />}
    >
      {!q && (
        <IOSGroup>
          <IOSRow
            icon={<img className="settings-iosprofile__photo" src={asset(content.profile.photo)} alt="" draggable={false} />}
            label={<span className="settings-iosprofile__name">{content.profile.name}</span>}
            detail="Portfolio Account, Resume & More"
            onClick={() => nav.push('about')}
          />
        </IOSGroup>
      )}
      {q ? (
        <IOSGroup>
          {filtered.length ? (
            filtered.map((s) => <IOSRow key={s.id} icon={icon(s)} label={s.iosLabel ?? s.label} onClick={() => nav.push(s.id)} />)
          ) : (
            <IOSRow label={`No results for “${query}”`} />
          )}
        </IOSGroup>
      ) : (
        IOS_GROUPS.map((group, gi) => (
          <IOSGroup key={gi}>
            {group.map((id) => {
              const s = byId(id)!
              return <IOSRow key={id} icon={icon(s)} label={s.iosLabel ?? s.label} onClick={() => nav.push(id)} />
            })}
          </IOSGroup>
        ))
      )}
    </IOSPage>
  )
}
