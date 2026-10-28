import { content } from '../data/content'
import { formatMonth } from '../lib/format'
import { openUrl } from '../lib/launch'
import { T, isTodo } from '../lib/todo'
import type { WidgetProps } from './types'
import { Widget } from './Widget'

function Ring({ progress, size }: { progress: number; size: number }) {
  const r = 15.5
  const c = 2 * Math.PI * r
  const pct = Math.round(Math.min(1, Math.max(0, progress)) * 100)
  return (
    <div className="widget-cb__ring" style={{ width: size, height: size }}>
      <svg viewBox="0 0 36 36" aria-hidden="true">
        <circle className="widget-cb__ring-track" cx="18" cy="18" r={r} />
        <circle
          className="widget-cb__ring-fill"
          cx="18"
          cy="18"
          r={r}
          strokeDasharray={`${(c * pct) / 100} ${c}`}
          transform="rotate(-90 18 18)"
        />
      </svg>
      <span className="widget-cb__pct" style={{ fontSize: Math.round(size * 0.26) }}>
        {pct}%
      </span>
    </div>
  )
}

function Hammer() {
  return (
    <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true">
      <path d="M9.6 1.6l4.8 4.8-1.6 1.6-1.2-1.2-6.9 6.9a1.4 1.4 0 0 1-2-2L9.6 4.8 8.4 3.6z" fill="currentColor" />
    </svg>
  )
}

/** "Currently building" status card driven by content.currentlyBuilding. */
export function CurrentlyBuildingWidget({ size, platform }: WidgetProps) {
  const cb = content.currentlyBuilding
  const hasProgress = typeof cb.progress === 'number'
  const link = cb.link && !isTodo(cb.link) ? cb.link : undefined
  const stack = cb.stack.filter((s) => !isTodo(s))
  const updated = isTodo(cb.updated) ? null : formatMonth(cb.updated)
  const project = content.projects.find((p) => p.name.toLowerCase() === cb.title.toLowerCase())
  const highlights = (project?.highlights ?? []).filter((h) => !isTodo(h)).slice(0, 2)
  const eyebrow = (
    <span className="widget-eyebrow widget-cb__eyebrow">
      <Hammer /> Now building
    </span>
  )

  return (
    <Widget
      size={size}
      platform={platform}
      label={`Currently building ${cb.title}${link ? '. Open project.' : ''}`}
      className={`widget-cb widget-material widget-cb--${size}`}
      onActivate={link ? () => openUrl(link) : undefined}
    >
      {size === 'small' && (
        <div className="widget-cb__small">
          {eyebrow}
          <div className="widget-cb__title">
            <T>{cb.title}</T>
          </div>
          <p className="widget-cb__desc widget-cb__desc--2">
            <T>{cb.description}</T>
          </p>
          <div className="widget-cb__foot">
            {hasProgress && <Ring progress={cb.progress!} size={38} />}
            <span className="widget-cb__stack-inline">{stack.slice(0, 2).join(' · ')}</span>
          </div>
        </div>
      )}

      {size === 'medium' && (
        <div className="widget-cb__medium">
          {hasProgress && <Ring progress={cb.progress!} size={92} />}
          <div className="widget-cb__info">
            {eyebrow}
            <div className="widget-cb__title">
              <T>{cb.title}</T>
            </div>
            <p className="widget-cb__desc widget-cb__desc--3">
              <T>{cb.description}</T>
            </p>
            <div className="widget-cb__chips">
              {stack.slice(0, 4).map((s) => (
                <span key={s} className="widget-cb__chip">
                  {s}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {size === 'large' && (
        <div className="widget-cb__large">
          <div className="widget-cb__large-head">
            <div>
              {eyebrow}
              <div className="widget-cb__title widget-cb__title--lg">
                <T>{cb.title}</T>
              </div>
            </div>
            {hasProgress && <Ring progress={cb.progress!} size={64} />}
          </div>
          <p className="widget-cb__desc widget-cb__desc--4">
            <T>{cb.description}</T>
          </p>
          {highlights.length > 0 && (
            <ul className="widget-cb__highlights">
              {highlights.map((h) => (
                <li key={h}>{h.replace(/`/g, '')}</li>
              ))}
            </ul>
          )}
          <div className="widget-cb__chips">
            {stack.map((s) => (
              <span key={s} className="widget-cb__chip">
                {s}
              </span>
            ))}
          </div>
          <div className="widget-cb__large-foot">
            {updated && <span>Updated {updated}</span>}
            {link && <span className="widget-cb__open">Open project ↗</span>}
          </div>
        </div>
      )}
    </Widget>
  )
}
