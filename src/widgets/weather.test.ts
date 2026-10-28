import { describe, expect, it } from 'vitest'
import { describeWeather, hourLabel, nextHours, parseOpenMeteo, zonedParts } from './weather'

describe('describeWeather', () => {
  it('maps clear sky by day and night', () => {
    expect(describeWeather(0, true)).toMatchObject({ label: 'Sunny', icon: 'sun', sky: 'clear-day' })
    expect(describeWeather(0, false)).toMatchObject({ label: 'Clear', icon: 'moon', sky: 'clear-night' })
  })
  it('maps clouds, fog, rain and storms', () => {
    expect(describeWeather(3, true).icon).toBe('cloud')
    expect(describeWeather(45, true).sky).toBe('fog')
    expect(describeWeather(61, true)).toMatchObject({ icon: 'rain', sky: 'rain' })
    expect(describeWeather(53, false).icon).toBe('drizzle')
    expect(describeWeather(95, true)).toMatchObject({ icon: 'storm', sky: 'storm' })
  })
  it('falls back for unknown codes', () => {
    expect(describeWeather(1234, true).icon).toBe('cloud')
  })
})

const sample = {
  current: { time: '2026-10-29T01:30', temperature_2m: 24.6, apparent_temperature: 27.1, weather_code: 45, is_day: 0 },
  daily: { temperature_2m_max: [31.2], temperature_2m_min: [24.1] },
  hourly: {
    time: ['2026-10-29T00:00', '2026-10-29T01:00', '2026-10-29T02:00', '2026-10-29T03:00'],
    temperature_2m: [25, 24.6, 24.2, 24],
    weather_code: [3, 45, 45, 2],
  },
}

describe('parseOpenMeteo', () => {
  it('parses a forecast', () => {
    const d = parseOpenMeteo(sample, 1)!
    expect(d.current).toMatchObject({ temperature: 24.6, apparent: 27.1, code: 45, isDay: false })
    expect(d.today).toEqual({ max: 31.2, min: 24.1 })
    expect(d.hourly).toHaveLength(4)
    expect(nextHours(d, '2026-10-29T01:00', 2).map((h) => h.time)).toEqual(['2026-10-29T01:00', '2026-10-29T02:00'])
  })
  it('rejects unusable payloads', () => {
    expect(parseOpenMeteo(null)).toBeNull()
    expect(parseOpenMeteo({ current: {} })).toBeNull()
    expect(parseOpenMeteo({ error: true, reason: 'x' })).toBeNull()
  })
})

describe('time helpers', () => {
  it('formats hour labels', () => {
    expect(hourLabel('2026-10-29T00:00')).toBe('12 AM')
    expect(hourLabel('2026-10-29T13:00')).toBe('1 PM')
  })
  it('reads wall-clock parts in a timezone', () => {
    const p = zonedParts(new Date('2026-10-28T17:45:30Z'), 'Asia/Singapore')
    expect(p).toMatchObject({ hour: 1, minute: 45, second: 30, day: '29', month: 'Oct', hourKey: '2026-10-29T01:00' })
  })
})
