import { useEffect, useState } from 'react'
import { content } from '../data/content'
import { cachedWeather, loadWeather, WEATHER_TTL, type WeatherData } from './weather'

export type WeatherStatus = 'loading' | 'ready' | 'unavailable'

/** Singapore weather (from content.profile), refreshed every 15 minutes. */
export function useWeather(): { data: WeatherData | null; status: WeatherStatus } {
  const [data, setData] = useState<WeatherData | null>(() => cachedWeather())
  const [status, setStatus] = useState<WeatherStatus>(() => (cachedWeather() ? 'ready' : 'loading'))

  useEffect(() => {
    let alive = true
    const { latitude, longitude } = content.profile.coordinates
    const refresh = () => {
      void loadWeather(latitude, longitude, content.profile.timezone).then((d) => {
        if (!alive) return
        if (d) {
          setData(d)
          setStatus('ready')
        } else {
          setStatus((s) => (s === 'ready' ? s : 'unavailable'))
        }
      })
    }
    refresh()
    const timer = window.setInterval(refresh, WEATHER_TTL)
    return () => {
      alive = false
      window.clearInterval(timer)
    }
  }, [])

  return { data, status }
}
