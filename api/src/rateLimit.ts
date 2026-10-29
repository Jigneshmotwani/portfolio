/**
 * Rate limiting, layered:
 * 1. Cloudflare's Rate Limiting binding (RATE_LIMITER in wrangler.toml), when configured.
 * 2. A best-effort in-memory sliding window per IP (per isolate, so approximate).
 * 3. A global daily cap: KV-backed (USAGE_KV) when bound, otherwise per isolate.
 */
export interface RateLimitEnv {
  RATE_LIMITER?: RateLimit
  USAGE_KV?: KVNamespace
  /** Requests per IP per minute for the in-memory fallback (default 8). */
  PER_MINUTE_LIMIT?: string
  /** Requests per IP per day for the in-memory fallback (default 60). */
  PER_DAY_LIMIT?: string
  /** Total chat requests per UTC day across all visitors (default 1500, 0 = unlimited). */
  DAILY_LIMIT?: string
}

export type RateLimitResult = { ok: true } | { ok: false; reason: string; retryAfter: number }

const hits = new Map<string, number[]>()
let localDay = ''
let localDayCount = 0

const num = (value: string | undefined, fallback: number) => {
  const n = Number(value)
  return Number.isFinite(n) && n >= 0 ? n : fallback
}

function slidingWindow(ip: string, perMinute: number, perDay: number, now: number): RateLimitResult {
  const dayAgo = now - 86_400_000
  const list = (hits.get(ip) ?? []).filter((t) => t > dayAgo)
  const lastMinute = list.filter((t) => t > now - 60_000)
  if (lastMinute.length >= perMinute) {
    hits.set(ip, list)
    return { ok: false, reason: 'Too many questions. Try again in a minute.', retryAfter: Math.ceil((lastMinute[0] + 60_000 - now) / 1000) }
  }
  if (list.length >= perDay) {
    hits.set(ip, list)
    return { ok: false, reason: 'Daily question limit reached. Email Jignesh instead!', retryAfter: Math.ceil((list[0] + 86_400_000 - now) / 1000) }
  }
  list.push(now)
  hits.set(ip, list)
  // Keep memory bounded.
  if (hits.size > 5000) for (const key of [...hits.keys()].slice(0, 1000)) hits.delete(key)
  return { ok: true }
}

async function dailyCap(env: RateLimitEnv, now: number): Promise<RateLimitResult> {
  const cap = num(env.DAILY_LIMIT, 1500)
  if (cap === 0) return { ok: true }
  const day = new Date(now).toISOString().slice(0, 10)
  const secondsLeft = Math.ceil((Date.parse(`${day}T00:00:00Z`) + 86_400_000 - now) / 1000)
  if (env.USAGE_KV) {
    const key = `usage:${day}`
    const count = Number((await env.USAGE_KV.get(key)) ?? 0)
    if (count >= cap) return { ok: false, reason: 'The assistant reached its daily limit. Email Jignesh instead!', retryAfter: secondsLeft }
    await env.USAGE_KV.put(key, String(count + 1), { expirationTtl: 2 * 86_400 })
    return { ok: true }
  }
  if (localDay !== day) {
    localDay = day
    localDayCount = 0
  }
  if (localDayCount >= cap) return { ok: false, reason: 'The assistant reached its daily limit. Email Jignesh instead!', retryAfter: secondsLeft }
  localDayCount++
  return { ok: true }
}

export async function checkRateLimit(ip: string, env: RateLimitEnv, now = Date.now()): Promise<RateLimitResult> {
  if (env.RATE_LIMITER) {
    const { success } = await env.RATE_LIMITER.limit({ key: ip })
    if (!success) return { ok: false, reason: 'Too many questions. Try again in a minute.', retryAfter: 60 }
  }
  const local = slidingWindow(ip, num(env.PER_MINUTE_LIMIT, 8), num(env.PER_DAY_LIMIT, 60), now)
  if (!local.ok) return local
  return dailyCap(env, now)
}
