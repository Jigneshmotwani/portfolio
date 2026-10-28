import { useEffect, useState } from 'react'
import { AppIcon } from '../components/shared/AppIcon'
import { content } from '../data/content'
import { openUrl } from '../lib/launch'
import {
  busiestDay,
  cachedContributions,
  emptyWeeks,
  loadContributions,
  monthLabels,
  streaks,
  toWeeks,
  type ContributionData,
  type ContributionDay,
} from './contributions'
import type { WidgetProps, WidgetSize } from './types'
import { Widget } from './Widget'

type Mode = 'loading' | 'data' | 'image' | 'offline'

/** Week columns per size; large shows the whole year as two stacked half-year bands. */
const WEEKS: Record<WidgetSize, number> = { small: 10, medium: 22, large: 52 }
const CELL = 10
const GAP = 3
const PITCH = CELL + GAP

function useContributions(username: string) {
  const [data, setData] = useState<ContributionData | null>(() => cachedContributions())
  const [mode, setMode] = useState<Mode>(() => (cachedContributions() ? 'data' : 'loading'))
  useEffect(() => {
    let alive = true
    void loadContributions(username).then((d) => {
      if (!alive) return
      if (d) {
        setData(d)
        setMode('data')
      } else setMode((m) => (m === 'data' ? m : 'image'))
    })
    return () => {
      alive = false
    }
  }, [username])
  return { data, mode, setMode }
}

function Grid({ weeks, months, size }: { weeks: (ContributionDay | null)[][]; months: boolean; size: WidgetSize }) {
  const top = months ? 14 : 0
  const left = size === 'large' ? 22 : 0
  const width = left + weeks.length * PITCH - GAP
  const height = top + 7 * PITCH - GAP
  return (
    <svg className="widget-gh__grid" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet" aria-hidden="true">
      {months &&
        monthLabels(weeks).map((m) => (
          <text key={m.index} className="widget-gh__label" x={left + m.index * PITCH} y={9}>
            {m.label}
          </text>
        ))}
      {size === 'large' &&
        ['Mon', 'Wed', 'Fri'].map((d, i) => (
          <text key={d} className="widget-gh__label" x={0} y={top + (1 + i * 2) * PITCH + 8}>
            {d}
          </text>
        ))}
      {weeks.map((week, w) =>
        week.map((day, d) => (
          <rect
            key={`${w}-${d}`}
            className={`widget-gh__cell widget-gh__cell--${day ? day.level : 0}`}
            x={left + w * PITCH}
            y={top + d * PITCH}
            width={CELL}
            height={CELL}
            rx={2.2}
          >
            {day && <title>{`${day.count} contribution${day.count === 1 ? '' : 's'} on ${day.date}`}</title>}
          </rect>
        )),
      )}
    </svg>
  )
}

/** Public GitHub contribution calendar with an image fallback and an honest offline state. */
export function GitHubContributionsWidget({ size, platform }: WidgetProps) {
  const username = content.contact.githubUsername
  const { data, mode, setMode } = useContributions(username)
  const count = WEEKS[size]
  const weeks = data ? toWeeks(data.days).slice(-count) : emptyWeeks(count)
  const total = data?.total
  const label =
    mode === 'data' && total != null ? `GitHub: ${total} contributions in the last year. Open profile.` : 'GitHub contributions. Open profile.'
  const stats = data ? streaks(data.days) : null
  const best = data ? busiestDay(data.days) : null

  const caption =
    mode === 'data'
      ? `${total?.toLocaleString('en-US')} contributions in the last year`
      : mode === 'loading'
        ? 'Loading contributions…'
        : mode === 'offline'
          ? 'Contributions unavailable offline'
          : 'Last year on GitHub'

  return (
    <Widget size={size} platform={platform} label={label} className="widget-gh widget-material" onActivate={() => openUrl(content.contact.github)}>
      <div className="widget-gh__head">
        <AppIcon id="github" size={size === 'small' ? 20 : 22} />
        <div className="widget-gh__title">
          <span className="widget-gh__name">GitHub</span>
          {size !== 'small' && <span className="widget-gh__user">@{username}</span>}
        </div>
        {mode === 'data' && total != null && <span className="widget-gh__total">{total.toLocaleString('en-US')}</span>}
      </div>

      <div className={`widget-gh__body widget-gh__body--${mode}`}>
        {mode === 'image' ? (
          <img
            className="widget-gh__img"
            src={`https://ghchart.rshah.org/40c463/${encodeURIComponent(username)}`}
            alt=""
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={() => setMode('offline')}
          />
        ) : size === 'large' ? (
          <div className="widget-gh__bands">
            <Grid weeks={weeks.slice(0, Math.ceil(weeks.length / 2))} months size={size} />
            <Grid weeks={weeks.slice(Math.ceil(weeks.length / 2))} months size={size} />
          </div>
        ) : (
          <Grid weeks={weeks} months={size !== 'small'} size={size} />
        )}
      </div>

      <div className="widget-gh__caption">{caption}</div>

      {size === 'large' && (
        <div className="widget-gh__stats">
          <div>
            <span className="widget-gh__stat">{stats ? stats.current : '–'}</span>
            <span className="widget-gh__stat-label">Current streak</span>
          </div>
          <div>
            <span className="widget-gh__stat">{stats ? stats.longest : '–'}</span>
            <span className="widget-gh__stat-label">Longest streak</span>
          </div>
          <div>
            <span className="widget-gh__stat">{best ? best.count : '–'}</span>
            <span className="widget-gh__stat-label">Best day</span>
          </div>
          <div className="widget-gh__legend" aria-hidden="true">
            <span>Less</span>
            {[0, 1, 2, 3, 4].map((l) => (
              <i key={l} className={`widget-gh__swatch widget-gh__cell--${l}`} />
            ))}
            <span>More</span>
          </div>
        </div>
      )}
    </Widget>
  )
}
