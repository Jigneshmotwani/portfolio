/**
 * GitHub contribution calendar for the widget. Data comes from the public
 * github-contributions-api (no auth) and is cached in localStorage. Pure
 * shaping helpers are exported for tests. Never invents data.
 */
import { readJSON, writeJSON } from '../lib/storage'
import { fetchJSON } from './net'

export type Level = 0 | 1 | 2 | 3 | 4

export interface ContributionDay {
  /** "YYYY-MM-DD" */
  date: string
  count: number
  level: Level
}

export interface ContributionData {
  fetchedAt: number
  total: number
  days: ContributionDay[]
}

const isLevel = (v: unknown): v is Level => v === 0 || v === 1 || v === 2 || v === 3 || v === 4

/** Parses the API's `{ total: {...}, contributions: [{date,count,level}] }` response. */
export function parseContributions(json: unknown, today = isoDate(new Date()), fetchedAt = Date.now()): ContributionData | null {
  if (!json || typeof json !== 'object') return null
  const j = json as { total?: Record<string, unknown>; contributions?: unknown }
  if (!Array.isArray(j.contributions)) return null
  const days: ContributionDay[] = []
  for (const raw of j.contributions) {
    if (!raw || typeof raw !== 'object') continue
    const d = raw as Record<string, unknown>
    if (typeof d.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(d.date) || d.date > today) continue
    const count = typeof d.count === 'number' && d.count >= 0 ? d.count : 0
    days.push({ date: d.date, count, level: isLevel(d.level) ? d.level : count > 0 ? 1 : 0 })
  }
  if (!days.length) return null
  days.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))
  const reported = j.total?.lastYear
  const total = typeof reported === 'number' ? reported : days.reduce((sum, d) => sum + d.count, 0)
  return { fetchedAt, total, days }
}

export function isoDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** Day of week (0 = Sunday) of an ISO date, timezone-independent. */
export function weekday(date: string): number {
  return new Date(`${date}T00:00:00Z`).getUTCDay()
}

/** Groups days into Sunday-first week columns; the first column is padded with nulls. */
export function toWeeks(days: ContributionDay[]): (ContributionDay | null)[][] {
  const weeks: (ContributionDay | null)[][] = []
  let week: (ContributionDay | null)[] = []
  if (days.length) for (let i = 0; i < weekday(days[0].date); i++) week.push(null)
  for (const day of days) {
    week.push(day)
    if (week.length === 7) {
      weeks.push(week)
      week = []
    }
  }
  if (week.length) weeks.push(week)
  return weeks
}

/** An all-empty calendar of `weeks` columns ending today (used while loading / offline). */
export function emptyWeeks(weeks: number): (ContributionDay | null)[][] {
  const out: (ContributionDay | null)[][] = []
  for (let w = 0; w < weeks; w++) out.push(Array.from({ length: 7 }, () => null))
  return out
}

/** Month labels for week columns: the column where each new month first appears. */
export function monthLabels(weeks: (ContributionDay | null)[][]): { index: number; label: string }[] {
  const names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const labels: { index: number; label: string }[] = []
  let last = -1
  weeks.forEach((week, index) => {
    const first = week.find((d): d is ContributionDay => !!d)
    if (!first) return
    const month = Number(first.date.slice(5, 7)) - 1
    if (month !== last) {
      labels.push({ index, label: names[month] })
      last = month
    }
  })
  // Drop a label that would collide with the next one.
  return labels.filter((l, i) => i === labels.length - 1 || labels[i + 1].index - l.index >= 3)
}

/** Current streak (ending today or yesterday) and longest streak, in days. */
export function streaks(days: ContributionDay[]): { current: number; longest: number } {
  let longest = 0
  let run = 0
  for (const d of days) {
    run = d.count > 0 ? run + 1 : 0
    longest = Math.max(longest, run)
  }
  let current = 0
  for (let i = days.length - 1; i >= 0; i--) {
    if (days[i].count > 0) current++
    else if (i === days.length - 1) continue // today may not have commits yet
    else break
  }
  return { current, longest }
}

export function busiestDay(days: ContributionDay[]): ContributionDay | null {
  return days.reduce<ContributionDay | null>((best, d) => (d.count > 0 && (!best || d.count > best.count) ? d : best), null)
}

const CACHE_KEY = 'jos.contributions.v1'
export const CONTRIB_TTL = 6 * 3600_000
const MAX_STALE = 7 * 24 * 3600_000

export function cachedContributions(now = Date.now()): ContributionData | null {
  const cached = readJSON<ContributionData | null>(CACHE_KEY, null)
  if (!cached || typeof cached.fetchedAt !== 'number' || !Array.isArray(cached.days)) return null
  return now - cached.fetchedAt < MAX_STALE ? cached : null
}

const inflight = new Map<string, Promise<ContributionData | null>>()

/** Fresh cache, else the API, else stale cache, else null. Never rejects. */
export function loadContributions(username: string): Promise<ContributionData | null> {
  const cached = cachedContributions()
  if (cached && Date.now() - cached.fetchedAt < CONTRIB_TTL) return Promise.resolve(cached)
  const pending = inflight.get(username)
  if (pending) return pending
  const p = fetchJSON(`https://github-contributions-api.jogruber.de/v4/${encodeURIComponent(username)}?y=last`, 9000)
    .then((json) => {
      const data = parseContributions(json)
      if (data) writeJSON(CACHE_KEY, data)
      return data ?? cachedContributions()
    })
    .catch(() => cachedContributions())
    .finally(() => inflight.delete(username))
  inflight.set(username, p)
  return p
}
