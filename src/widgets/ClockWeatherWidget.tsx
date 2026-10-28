import { content } from '../data/content'
import { formatClock } from '../lib/format'
import { useNow } from '../lib/hooks'
import { AnalogClock } from './AnalogClock'
import type { WidgetProps } from './types'
import { useWeather } from './useWeather'
import { describeWeather, hourLabel, isDaytimeHour, nextHours, zonedParts } from './weather'
import { WeatherIcon } from './WeatherIcon'
import { Widget } from './Widget'

const deg = (v: number) => `${Math.round(v)}°`

/** Singapore clock + current weather (Open-Meteo), small / medium / large. */
export function ClockWeatherWidget({ size, platform }: WidgetProps) {
  const now = useNow(1000)
  const tz = content.profile.timezone
  const city = content.profile.location
  const t = zonedParts(now, tz)
  const { data, status } = useWeather()

  const info = data ? describeWeather(data.current.code, data.current.isDay) : null
  const sky = info?.sky ?? (isDaytimeHour(t.hour) ? 'clear-day' : 'clear-night')
  const time = formatClock(now, { timeZone: tz })
  const temp = data ? deg(data.current.temperature) : '--'
  const condition = info?.label ?? (status === 'loading' ? 'Loading weather…' : 'Weather unavailable')
  const label = `${city} time ${time}${info ? `, ${temp} and ${info.label.toLowerCase()}` : ''}`
  const clock = <AnalogClock hour={t.hour} minute={t.minute} second={t.second} label={size === 'small' ? undefined : 'SGT'} numerals={size !== 'small'} />

  return (
    <Widget size={size} platform={platform} label={label} className={`widget-cw widget-sky widget-sky--${sky}`}>
      {size === 'small' ? (
        <div className="widget-cw__small">
          <div className="widget-cw__row">
            <span className="widget-eyebrow">{city}</span>
            {info && <WeatherIcon icon={info.icon} size={20} />}
          </div>
          <div className="widget-cw__clock">{clock}</div>
          <div className="widget-cw__row widget-cw__row--bottom">
            <span className="widget-cw__time">{time}</span>
            <span className="widget-cw__temp-sm">{temp}</span>
          </div>
        </div>
      ) : (
        <div className="widget-cw__main">
          <div className="widget-cw__top">
            <div className="widget-cw__clock">{clock}</div>
            <div className="widget-cw__weather">
              <div className="widget-cw__place">
                <span className="widget-cw__city">{city}</span>
                <span className="widget-cw__date">
                  {t.weekday}, {t.day} {t.month} · {time}
                </span>
              </div>
              <div className="widget-cw__temp">{temp}</div>
              <div className="widget-cw__cond">
                {info && <WeatherIcon icon={info.icon} size={18} />}
                <span>{condition}</span>
              </div>
              {data?.today && (
                <div className="widget-cw__hl">
                  H:{deg(data.today.max)} L:{deg(data.today.min)}
                </div>
              )}
            </div>
          </div>
          {size === 'large' && (
            <div className="widget-cw__hours">
              {data && nextHours(data, t.hourKey, 5).length > 0 ? (
                nextHours(data, t.hourKey, 5).map((h, i) => {
                  const hInfo = describeWeather(h.code, isDaytimeHour(Number(h.time.slice(11, 13))))
                  return (
                    <div key={h.time} className="widget-cw__hour">
                      <span className="widget-cw__hour-time">{i === 0 ? 'Now' : hourLabel(h.time)}</span>
                      <WeatherIcon icon={hInfo.icon} size={26} />
                      <span className="widget-cw__hour-temp">{deg(h.temperature)}</span>
                    </div>
                  )
                })
              ) : (
                <div className="widget-cw__empty">{status === 'loading' ? 'Loading forecast…' : 'Forecast unavailable offline'}</div>
              )}
              <div className="widget-cw__foot">
                {data ? `Feels like ${deg(data.current.apparent)} · Open-Meteo` : 'Weather by Open-Meteo'}
              </div>
            </div>
          )}
        </div>
      )}
    </Widget>
  )
}
