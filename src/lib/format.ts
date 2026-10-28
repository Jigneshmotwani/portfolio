const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** "2026-01" → "Jan 2026", "2021" → "2021". */
export function formatMonth(value: string): string {
  const m = /^(\d{4})-(\d{2})$/.exec(value)
  if (!m) return value
  return `${MONTHS[Number(m[2]) - 1]} ${m[1]}`
}

export function formatRange(start: string, end: string | null): string {
  return `${formatMonth(start)} – ${end ? formatMonth(end) : 'Present'}`
}

function toMonths(value: string, endOfYear: boolean): number {
  const m = /^(\d{4})(?:-(\d{2}))?$/.exec(value)
  if (!m) return NaN
  return Number(m[1]) * 12 + (m[2] ? Number(m[2]) - 1 : endOfYear ? 11 : 0)
}

/** Human duration like LinkedIn: "1 yr 4 mos". */
export function formatDuration(start: string, end: string | null, now = new Date()): string {
  const s = toMonths(start, false)
  const e = end ? toMonths(end, true) : now.getFullYear() * 12 + now.getMonth()
  if (Number.isNaN(s) || Number.isNaN(e)) return ''
  const total = Math.max(1, e - s + 1)
  const y = Math.floor(total / 12)
  const mo = total % 12
  const parts = []
  if (y) parts.push(`${y} yr${y > 1 ? 's' : ''}`)
  if (mo) parts.push(`${mo} mo${mo > 1 ? 's' : ''}`)
  return parts.join(' ')
}

export function formatClock(date: Date, opts: { seconds?: boolean; hour12?: boolean; timeZone?: string } = {}): string {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    second: opts.seconds ? '2-digit' : undefined,
    hour12: opts.hour12 ?? true,
    timeZone: opts.timeZone,
  })
}

/** macOS menu bar style: "Tue 28 Oct  5:45 PM". */
export function formatMenuBarDate(date: Date): string {
  const day = date.toLocaleDateString('en-US', { weekday: 'short' })
  const md = date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
  return `${day} ${md}  ${formatClock(date)}`
}

export function formatRelative(time: number, now = Date.now()): string {
  const s = Math.round((now - time) / 1000)
  if (s < 45) return 'now'
  const m = Math.round(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.round(m / 60)
  if (h < 24) return `${h}h ago`
  return new Date(time).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export function hostOf(url: string): string {
  try {
    return new URL(url).host.replace(/^www\./, '')
  } catch {
    return url
  }
}
