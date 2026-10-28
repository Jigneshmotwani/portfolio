import { X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { apps, appName } from '../../apps/registry'
import type { Platform } from '../../lib/platform'
import { playSound } from '../../lib/sound'
import { useNotifications, type AppNotification } from '../../state/notifications'
import { AppIcon } from './AppIcon'
import { activateNotification } from './NotificationCenter'
import './NotificationBanners.css'

const BANNER_MS = 6000
/** Banner ids that already played the chime (survives StrictMode double effects). */
const chimed = new Set<string>()

/** Transient notification banners (top-right on macOS, top on iOS). */
export function NotificationBanners({ platform }: { platform: Platform }) {
  const banners = useNotifications((s) => s.banners)
  const items = useNotifications((s) => s.items)
  const dismiss = useNotifications((s) => s.dismissBanner)
  const list = banners.map((id) => items.find((i) => i.id === id)).filter((n): n is AppNotification => !!n)

  // iOS shows one banner at a time: a newer one replaces the older ones.
  useEffect(() => {
    if (platform !== 'ios' || list.length < 2) return
    for (const n of list.slice(0, -1)) dismiss(n.id)
  }, [platform, list, dismiss])

  if (!list.length) return null
  if (platform === 'mac') {
    return (
      <div className="banner-mac" role="region" aria-label="Notifications" aria-live="polite">
        {list.map((n) => (
          <MacBanner key={n.id} n={n} />
        ))}
      </div>
    )
  }
  const latest = list[list.length - 1]
  return (
    <div className="banner-ios" role="region" aria-label="Notifications" aria-live="polite">
      <IosBanner key={latest.id} n={latest} />
    </div>
  )
}

function useBannerLife(id: string, paused: boolean) {
  const dismiss = useNotifications((s) => s.dismissBanner)
  const [leaving, setLeaving] = useState(false)
  const remaining = useRef(BANNER_MS)

  useEffect(() => {
    if (chimed.has(id)) return
    chimed.add(id)
    playSound('notify')
  }, [id])

  useEffect(() => {
    if (paused || leaving) return
    const start = Date.now()
    const t = window.setTimeout(() => setLeaving(true), Math.max(0, remaining.current))
    return () => {
      window.clearTimeout(t)
      remaining.current -= Date.now() - start
    }
  }, [paused, leaving])

  useEffect(() => {
    if (!leaving) return
    const t = window.setTimeout(() => dismiss(id), 240)
    return () => window.clearTimeout(t)
  }, [leaving, dismiss, id])

  return { leaving, leave: () => setLeaving(true) }
}

function MacBanner({ n }: { n: AppNotification }) {
  const [hover, setHover] = useState(false)
  const { leaving, leave } = useBannerLife(n.id, hover)
  return (
    <div
      className={`banner-mac__item${leaving ? ' is-leaving' : ''}`}
      onPointerEnter={() => setHover(true)}
      onPointerLeave={() => setHover(false)}
      onFocus={() => setHover(true)}
      onBlur={() => setHover(false)}
    >
      <button
        className="banner-mac__main"
        onClick={() => {
          leave()
          activateNotification(n)
        }}
        aria-label={`${appName(n.appId, 'mac')}: ${n.title}. ${n.body}`}
      >
        <AppIcon id={apps[n.appId].icon} size={38} className="banner-mac__icon" />
        <span className="banner-mac__body">
          <span className="banner-mac__head">
            <span className="banner-mac__title">{n.title}</span>
            <span className="banner-mac__time">now</span>
          </span>
          <span className="banner-mac__text">{n.body}</span>
        </span>
      </button>
      <button className="banner-mac__close" onClick={leave} aria-label="Dismiss notification">
        <X size={11} strokeWidth={3} />
      </button>
    </div>
  )
}

function IosBanner({ n }: { n: AppNotification }) {
  const [dy, setDy] = useState(0)
  const drag = useRef<{ y: number; moved: boolean } | null>(null)
  const { leaving, leave } = useBannerLife(n.id, dy !== 0)
  return (
    <div
      className={`banner-ios__item${leaving ? ' is-leaving' : ''}`}
      style={dy ? { transform: `translateY(${dy}px)`, transition: 'none' } : undefined}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId)
        drag.current = { y: e.clientY, moved: false }
      }}
      onPointerMove={(e) => {
        if (!drag.current) return
        const d = e.clientY - drag.current.y
        if (Math.abs(d) > 5) drag.current.moved = true
        if (drag.current.moved) setDy(d < 0 ? d : d * 0.25)
      }}
      onPointerUp={(e) => {
        if (!drag.current) return
        const d = e.clientY - drag.current.y
        const moved = drag.current.moved
        drag.current = null
        setDy(0)
        if (!moved) {
          leave()
          activateNotification(n)
        } else if (d < -28) leave()
      }}
      onPointerCancel={() => {
        drag.current = null
        setDy(0)
      }}
      role="button"
      tabIndex={0}
      aria-label={`${appName(n.appId, 'ios')}: ${n.title}. ${n.body}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          leave()
          activateNotification(n)
        }
      }}
    >
      <AppIcon id={apps[n.appId].icon} size={38} className="banner-ios__icon" />
      <span className="banner-ios__body">
        <span className="banner-ios__head">
          <span className="banner-ios__title">{n.title}</span>
          <span className="banner-ios__time">now</span>
        </span>
        <span className="banner-ios__text">{n.body}</span>
      </span>
    </div>
  )
}
