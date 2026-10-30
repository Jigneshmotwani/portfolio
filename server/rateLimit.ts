/**
 * Rate limiting for the Ask Jignesh proxy, layered:
 * 1. Redis (Upstash, or Vercel KV / Upstash from the Vercel Marketplace) when its REST
 *    URL and token are set: fixed windows shared by every function instance.
 * 2. Otherwise a best-effort in-memory sliding window per IP (per instance).
 * A global daily cap applies in both modes.
 */
export interface RateLimitEnv {
  /** Requests per IP per minute (default 8). */
  PER_MINUTE_LIMIT?: string
  /** Requests per IP per day (default 60). */
  PER_DAY_LIMIT?: string
  /** Total chat requests per UTC day across all visitors (default 1500, 0 = unlimited). */
  DAILY_LIMIT?: string
  UPSTASH_REDIS_REST_URL?: string
  UPSTASH_REDIS_REST_TOKEN?: string
  KV_REST_API_URL?: string
  KV_REST_API_TOKEN?: string
}

export type RateLimitResult = { ok: true } | { ok: false; reason: string; retryAfter: number }

const TOO_FAST = 'Too many questions. Try again in a minute.'
const DAILY_IP = 'Daily question limit reached. Email Jignesh instead!'
const DAILY_ALL = 'The assistant reached its daily limit. Email Jignesh instead!'

const num = (value: string | undefined, fallback: number) => {
  const n = Number(value)
  return value !== undefined && value !== '' && Number.isFinite(n) && n >= 0 ? n : fallback
}

const secondsToMidnightUtc = (now: number) => Math.ceil((Math.floor(now / 86_400_000) * 86_400_000 + 86_400_000 - now) / 1000)

// ── In-memory fallback ──────────────────────────────────────────────────

const hits = new Map<string, number[]>()
let localDay = ''
let localDayCount = 0

function memoryLimit(ip: string, perMinute: number, perDay: number, cap: number, now: number): RateLimitResult {
  const dayAgo = now - 86_400_000
  const list = (hits.get(ip) ?? []).filter((t) => t > dayAgo)
  const lastMinute = list.filter((t) => t > now - 60_000)
  if (lastMinute.length >= perMinute) {
    hits.set(ip, list)
    return { ok: false, reason: TOO_FAST, retryAfter: Math.max(1, Math.ceil((lastMinute[0] + 60_000 - now) / 1000)) }
  }
  if (list.length >= perDay) {
    hits.set(ip, list)
    return { ok: false, reason: DAILY_IP, retryAfter: Math.max(1, Math.ceil((list[0] + 86_400_000 - now) / 1000)) }
  }
  const day = new Date(now).toISOString().slice(0, 10)
  if (localDay !== day) {
    localDay = day
    localDayCount = 0
  }
  if (cap > 0 && localDayCount >= cap) return { ok: false, reason: DAILY_ALL, retryAfter: secondsToMidnightUtc(now) }
  localDayCount++
  list.push(now)
  hits.set(ip, list)
  // Keep memory bounded.
  if (hits.size > 5000) for (const key of [...hits.keys()].slice(0, 1000)) hits.delete(key)
  return { ok: true }
}

/** Test helper: forget all in-memory counters. */
export function resetMemoryLimits() {
  hits.clear()
  localDay = ''
  localDayCount = 0
}

// ── Redis (Upstash REST) ────────────────────────────────────────────────

async function redisLimit(
  url: string,
  token: string,
  ip: string,
  perMinute: number,
  perDay: number,
  cap: number,
  now: number,
  fetchImpl: typeof fetch,
): Promise<RateLimitResult> {
  const minute = Math.floor(now / 60_000)
  const day = new Date(now).toISOString().slice(0, 10)
  const keys = { m: `aj:m:${ip}:${minute}`, d: `aj:d:${ip}:${day}`, g: `aj:g:${day}` }
  const res = await fetchImpl(`${url.replace(/\/+$/, '')}/pipeline`, {
    method: 'POST',
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: JSON.stringify([
      ['INCR', keys.m],
      ['EXPIRE', keys.m, '70'],
      ['INCR', keys.d],
      ['EXPIRE', keys.d, '90000'],
      ['INCR', keys.g],
      ['EXPIRE', keys.g, '172800'],
    ]),
    signal: AbortSignal.timeout(2000),
  })
  if (!res.ok) throw new Error(`redis ${res.status}`)
  const out = (await res.json()) as { result?: number }[]
  const [m, , d, , g] = out.map((r) => Number(r.result ?? 0))
  if (m > perMinute) return { ok: false, reason: TOO_FAST, retryAfter: 60 - Math.floor((now % 60_000) / 1000) }
  if (d > perDay) return { ok: false, reason: DAILY_IP, retryAfter: secondsToMidnightUtc(now) }
  if (cap > 0 && g > cap) return { ok: false, reason: DAILY_ALL, retryAfter: secondsToMidnightUtc(now) }
  return { ok: true }
}

export async function checkRateLimit(ip: string, env: RateLimitEnv, now = Date.now(), fetchImpl: typeof fetch = fetch): Promise<RateLimitResult> {
  const perMinute = num(env.PER_MINUTE_LIMIT, 8)
  const perDay = num(env.PER_DAY_LIMIT, 60)
  const cap = num(env.DAILY_LIMIT, 1500)
  const url = env.UPSTASH_REDIS_REST_URL || env.KV_REST_API_URL
  const token = env.UPSTASH_REDIS_REST_TOKEN || env.KV_REST_API_TOKEN
  if (url && token) {
    try {
      return await redisLimit(url, token, ip, perMinute, perDay, cap, now, fetchImpl)
    } catch (err) {
      console.error('rate limit store unavailable, using memory', err instanceof Error ? err.message : err)
    }
  }
  return memoryLimit(ip, perMinute, perDay, cap, now)
}
