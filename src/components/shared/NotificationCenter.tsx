import { X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { apps, appName } from '../../apps/registry'
import type { AppId } from '../../apps/types'
import { formatRelative } from '../../lib/format'
import { useNow } from '../../lib/hooks'
import { launch } from '../../lib/launch'
import type { Platform } from '../../lib/platform'
import { useNotifications, type AppNotification } from '../../state/notifications'
import { useSystem } from '../../state/system'
import { ClockWeatherWidget, CurrentlyBuildingWidget } from '../../widgets'
import { AppIcon } from './AppIcon'
import { Wallpaper } from './Wallpaper'
import './NotificationCenter.css'

/** Notification Center: right-side panel on macOS (click the clock), pull-down sheet on iOS. */
export function NotificationCenter({ platform }: { platform: Platform }) {
  const open = useSystem((s) => s.notificationCenter)
  if (!open) return null
  return platform === 'mac' ? <MacNotificationCenter /> : <IosNotificationCenter />
}

/** Runs a notification's action (or opens its app) and removes it from the list. */
export function activateNotification(n: AppNotification) {
  useNotifications.getState().remove(n.id)
  if (n.action) launch(n.action.appId, n.action.params)
  else launch(n.appId)
}

function useCloseOnEscape(close: () => void) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [close])
}

function useMarkRead() {
  const markAllRead = useNotifications((s) => s.markAllRead)
  const count = useNotifications((s) => s.items.length)
  useEffect(() => {
    markAllRead()
  }, [markAllRead, count])
}

function groupByApp(items: AppNotification[]) {
  const groups = new Map<AppId, AppNotification[]>()
  for (const n of items) {
    const list = groups.get(n.appId) ?? []
    list.push(n)
    groups.set(n.appId, list)
  }
  return [...groups.entries()]
}

function NotificationCard({ n, platform, now }: { n: AppNotification; platform: Platform; now: number }) {
  const remove = useNotifications((s) => s.remove)
  return (
    <div className="nc-card" role="listitem">
      <button className="nc-card__main" onClick={() => activateNotification(n)}>
        <AppIcon id={apps[n.appId].icon} size={platform === 'mac' ? 34 : 38} className="nc-card__icon" />
        <span className="nc-card__body">
          <span className="nc-card__head">
            <span className="nc-card__title">{n.title}</span>
            <span className="nc-card__time">{formatRelative(n.time, now)}</span>
          </span>
          <span className="nc-card__text">{n.body}</span>
        </span>
      </button>
      <button className="nc-card__close" onClick={() => remove(n.id)} aria-label={`Clear notification: ${n.title}`}>
        <X size={11} strokeWidth={3} />
      </button>
    </div>
  )
}

/* ───────────────────────────── macOS ───────────────────────────── */

function MacNotificationCenter() {
  const close = () => useSystem.getState().toggleNotificationCenter(false)
  const items = useNotifications((s) => s.items)
  const clearAll = useNotifications((s) => s.clearAll)
  const now = useNow(30_000).getTime()
  useCloseOnEscape(close)
  useMarkRead()
  const groups = useMemo(() => groupByApp(items), [items])

  return (
    <div className="nc-mac" onPointerDown={(e) => e.target === e.currentTarget && close()}>
      <aside className="nc-mac__panel scroll" aria-label="Notification Center" onPointerDown={(e) => e.target === e.currentTarget && close()}>
        <div className="nc-mac__header">
          <span>Notifications</span>
          {items.length > 0 && (
            <button className="nc-mac__clear" onClick={clearAll}>
              Clear All
            </button>
          )}
        </div>
        <div role="list" className="nc-mac__list">
          {items.length === 0 && <div className="nc-empty">No Notifications</div>}
          {groups.map(([appId, list]) => (
            <section key={appId} className="nc-group" aria-label={appName(appId, 'mac')}>
              <div className="nc-group__label">{appName(appId, 'mac')}</div>
              {list.map((n) => (
                <NotificationCard key={n.id} n={n} platform="mac" now={now} />
              ))}
            </section>
          ))}
        </div>
        <div className="nc-mac__widgets">
          <ClockWeatherWidget size="medium" platform="mac" />
          <CurrentlyBuildingWidget size="medium" platform="mac" />
        </div>
      </aside>
    </div>
  )
}

/* ────────────────────────────── iOS ────────────────────────────── */

function IosNotificationCenter() {
  const items = useNotifications((s) => s.items)
  const clearAll = useNotifications((s) => s.clearAll)
  const nowDate = useNow(1000)
  const [closing, setClosing] = useState(false)
  const [dy, setDy] = useState(0)
  const drag = useRef<{ y: number; moved: boolean } | null>(null)
  useMarkRead()

  const dismiss = () => {
    setClosing(true)
    window.setTimeout(() => useSystem.getState().toggleNotificationCenter(false), 260)
  }
  useCloseOnEscape(dismiss)

  const time = nowDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: false })
  const date = nowDate.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' })

  const isBackground = (t: HTMLElement) => !t.closest('button, a, input')

  return (
    <div
      className={`nc-ios${closing ? ' nc-ios--closing' : ''}`}
      role="dialog"
      aria-label="Notification Centre"
      style={dy ? { transform: `translateY(${dy}px)`, transition: 'none' } : undefined}
      onPointerDown={(e) => {
        if (isBackground(e.target as HTMLElement)) drag.current = { y: e.clientY, moved: false }
      }}
      onPointerMove={(e) => {
        if (!drag.current) return
        const d = e.clientY - drag.current.y
        if (Math.abs(d) > 6) drag.current.moved = true
        if (drag.current.moved) setDy(Math.min(0, d))
      }}
      onPointerUp={(e) => {
        if (!drag.current) return
        const d = e.clientY - drag.current.y
        const moved = drag.current.moved
        drag.current = null
        if (moved && d < -80) dismiss()
        setDy(0)
      }}
      onPointerCancel={() => {
        drag.current = null
        setDy(0)
      }}
    >
      <Wallpaper blur dim={0.25} />
      <div className="nc-ios__content scroll">
        <div className="nc-ios__date">{date}</div>
        <div className="nc-ios__time">{time}</div>
        <div className="nc-ios__section">
          <span>Notification Centre</span>
          {items.length > 0 && (
            <button className="nc-ios__clear" onClick={clearAll} aria-label="Clear all notifications">
              <X size={14} strokeWidth={3} />
            </button>
          )}
        </div>
        <div role="list" className="nc-ios__list">
          {items.map((n) => (
            <NotificationCard key={n.id} n={n} platform="ios" now={nowDate.getTime()} />
          ))}
        </div>
        {items.length === 0 && <div className="nc-ios__empty">No Older Notifications</div>}
      </div>
      <button className="nc-ios__handle" onClick={dismiss} aria-label="Close Notification Centre">
        <span />
      </button>
    </div>
  )
}
