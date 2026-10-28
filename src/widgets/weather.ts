/**
 * Weather data for the clock widget: Open-Meteo (no API key) with a
 * localStorage cache. Pure helpers are exported for tests.
 */
import { readJSON, writeJSON } from '../lib/storage'
import { fetchJSON } from './net'

export type WeatherIconId =
  | 'sun'
  | 'moon'
  | 'partly-day'
  | 'partly-night'
  | 'cloud'
  | 'fog'
  | 'drizzle'
  | 'rain'
  | 'storm'
  | 'snow'

export type SkyTheme = 'clear-day' | 'clear-night' | 'cloudy-day' | 'cloudy-night' | 'rain' | 'storm' | 'fog'

export interface WeatherInfo {
  label: string
  icon: WeatherIconId
  sky: SkyTheme
}

/** WMO weather interpretation codes → label, icon and background. */
export function describeWeather(code: number, isDay: boolean): WeatherInfo {
  const clear: SkyTheme = isDay ? 'clear-day' : 'clear-night'
  const cloudy: SkyTheme = isDay ? 'cloudy-day' : 'cloudy-night'
  switch (code) {
    case 0:
      return { label: isDay ? 'Sunny' : 'Clear', icon: isDay ? 'sun' : 'moon', sky: clear }
    case 1:
      return { label: 'Mostly Clear', icon: isDay ? 'partly-day' : 'partly-night', sky: clear }
    case 2:
      return { label: 'Partly Cloudy', icon: isDay ? 'partly-day' : 'partly-night', sky: cloudy }
    case 3:
      return { label: 'Cloudy', icon: 'cloud', sky: cloudy }
    case 45:
    case 48:
      return { label: 'Fog', icon: 'fog', sky: 'fog' }
    case 51:
    case 53:
    case 55:
    case 56:
    case 57:
      return { label: 'Drizzle', icon: 'drizzle', sky: 'rain' }
    case 61:
      return { label: 'Light Rain', icon: 'rain', sky: 'rain' }
    case 63:
    case 66:
      return { label: 'Rain', icon: 'rain', sky: 'rain' }
    case 65:
    case 67:
      return { label: 'Heavy Rain', icon: 'rain', sky: 'rain' }
    case 71:
    case 73:
    case 75:
    case 77:
    case 85:
    case 86:
      return { label: 'Snow', icon: 'snow', sky: cloudy }
    case 80:
    case 81:
      return { label: 'Showers', icon: 'rain', sky: 'rain' }
    case 82:
      return { label: 'Heavy Showers', icon: 'rain', sky: 'rain' }
    case 95:
      return { label: 'Thunderstorms', icon: 'storm', sky: 'storm' }
    case 96:
    case 99:
      return { label: 'Thunderstorms', icon: 'storm', sky: 'storm' }
    default:
      return { label: 'Cloudy', icon: 'cloud', sky: cloudy }
  }
}

export interface HourlyPoint {
  /** Local time in the forecast's timezone, "YYYY-MM-DDTHH:00". */
  time: string
  temperature: number
  code: number
}

export interface WeatherData {
  fetchedAt: number
  current: { time: string; temperature: number; apparent: number; code: number; isDay: boolean }
  today: { max: number; min: number } | null
  hourly: HourlyPoint[]
}

const num = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : null)

/** Validates an Open-Meteo forecast response. Returns null when the shape is unusable. */
export function parseOpenMeteo(json: unknown, fetchedAt = Date.now()): WeatherData | null {
  if (!json || typeof json !== 'object') return null
  const j = json as Record<string, any>
  const c = j.current
  const temperature = num(c?.temperature_2m)
  const code = num(c?.weather_code)
  if (temperature == null || code == null) return null
  const max = num(j.daily?.temperature_2m_max?.[0])
  const min = num(j.daily?.temperature_2m_min?.[0])
  const times: unknown[] = Array.isArray(j.hourly?.time) ? j.hourly.time : []
  const hourly: HourlyPoint[] = []
  times.forEach((t, i) => {
    const temp = num(j.hourly?.temperature_2m?.[i])
    const wc = num(j.hourly?.weather_code?.[i])
    if (typeof t === 'string' && temp != null && wc != null) hourly.push({ time: t, temperature: temp, code: wc })
  })
  return {
    fetchedAt,
    current: {
      time: typeof c.time === 'string' ? c.time : '',
      temperature,
      apparent: num(c.apparent_temperature) ?? temperature,
      code,
      isDay: c.is_day === 1 || c.is_day === true,
    },
    today: max != null && min != null ? { max, min } : null,
    hourly,
  }
}

/** The next `count` hourly points starting at `hourKey` ("YYYY-MM-DDTHH:00"). */
export function nextHours(data: WeatherData, hourKey: string, count: number): HourlyPoint[] {
  return data.hourly.filter((h) => h.time >= hourKey).slice(0, count)
}

/** Night between 19:00 and 07:00 local time (used when forecast data has no is_day). */
export function isDaytimeHour(hour: number) {
  return hour >= 7 && hour < 19
}

export interface ZonedParts {
  hour: number
  minute: number
  second: number
  weekday: string
  day: string
  month: string
  /** "YYYY-MM-DDTHH:00" in the zone, comparable with Open-Meteo hourly times. */
  hourKey: string
}

const formatters = new Map<string, Intl.DateTimeFormat>()
function formatter(timeZone: string) {
  let f = formatters.get(timeZone)
  if (!f) {
    try {
      f = new Intl.DateTimeFormat('en-GB', {
        timeZone,
        hourCycle: 'h23',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        weekday: 'short',
      })
    } catch {
      f = new Intl.DateTimeFormat('en-GB', { hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', weekday: 'short' })
    }
    formatters.set(timeZone, f)
  }
  return f
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** Wall-clock parts of `date` in `timeZone`. */
export function zonedParts(date: Date, timeZone: string): ZonedParts {
  const parts: Record<string, string> = {}
  for (const p of formatter(timeZone).formatToParts(date)) parts[p.type] = p.value
  const hour = Number(parts.hour) % 24
  return {
    hour,
    minute: Number(parts.minute),
    second: Number(parts.second),
    weekday: parts.weekday ?? '',
    day: String(Number(parts.day)),
    month: MONTHS[Number(parts.month) - 1] ?? '',
    hourKey: `${parts.year}-${parts.month}-${parts.day}T${String(hour).padStart(2, '0')}:00`,
  }
}

/** "5 PM" style label for an hourly key. */
export function hourLabel(time: string): string {
  const h = Number(time.slice(11, 13))
  if (!Number.isFinite(h)) return ''
  const suffix = h < 12 ? 'AM' : 'PM'
  return `${h % 12 === 0 ? 12 : h % 12} ${suffix}`
}

export function weatherUrl(latitude: number, longitude: number, timeZone: string) {
  const q = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    current: 'temperature_2m,apparent_temperature,weather_code,is_day',
    daily: 'temperature_2m_max,temperature_2m_min',
    hourly: 'temperature_2m,weather_code',
    timezone: timeZone,
    forecast_days: '2',
  })
  return `https://api.open-meteo.com/v1/forecast?${q}`
}

const CACHE_KEY = 'jos.weather.v1'
export const WEATHER_TTL = 15 * 60_000
/** Older cached data is still better than nothing when offline. */
const MAX_STALE = 24 * 3600_000

/** Cached weather that is recent enough to show (may be older than the TTL). */
export function cachedWeather(now = Date.now()): WeatherData | null {
  const cached = readJSON<WeatherData | null>(CACHE_KEY, null)
  if (!cached || typeof cached.fetchedAt !== 'number' || !cached.current) return null
  return now - cached.fetchedAt < MAX_STALE ? cached : null
}

let inflight: Promise<WeatherData | null> | null = null

/** Fresh cache, else network, else stale cache, else null. Never rejects. */
export function loadWeather(latitude: number, longitude: number, timeZone: string): Promise<WeatherData | null> {
  const cached = cachedWeather()
  if (cached && Date.now() - cached.fetchedAt < WEATHER_TTL) return Promise.resolve(cached)
  if (inflight) return inflight
  inflight = fetchJSON(weatherUrl(latitude, longitude, timeZone))
    .then((json) => {
      const data = parseOpenMeteo(json)
      if (data) writeJSON(CACHE_KEY, data)
      return data ?? cachedWeather()
    })
    .catch(() => cachedWeather())
    .finally(() => {
      inflight = null
    })
  return inflight
}
