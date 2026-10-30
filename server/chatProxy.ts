/**
 * Ask Jignesh proxy core (platform-independent: Web Request in, Response out).
 *
 * Keeps the ai& API key server-side, grounds every answer in
 * src/data/content.ts, validates input, rate-limits per IP, and streams the
 * answer back to the browser as Server-Sent Events:
 *
 *   data: {"type":"delta","text":"…"}   (repeated)
 *   data: {"type":"done"}
 *   data: {"type":"error","message":"…"}
 *
 * ai& (https://console.aiand.com) serves an OpenAI-compatible Chat
 * Completions API, so any compatible provider works by changing AIAND_BASE_URL.
 */
import { content } from '../src/data/content.js'
import { buildSystemPrompt } from '../src/data/knowledge.js'
import { checkRateLimit, type RateLimitEnv } from './rateLimit.js'

export interface ProxyEnv extends RateLimitEnv {
  /** Secret API key from console.aiand.com. */
  AIAND_API_KEY?: string
  /** Model id from https://api.aiand.com/v1/models. */
  AIAND_MODEL?: string
  /** OpenAI-compatible base URL. */
  AIAND_BASE_URL?: string
  /** Optional reasoning effort for reasoning models (e.g. none, low, high). Unset = model default. */
  AIAND_REASONING_EFFORT?: string
  /** Extra allowed origins, comma-separated; `*` wildcards allowed (e.g. https://*.vercel.app). Same-origin is always allowed. */
  ALLOWED_ORIGINS?: string
  /** "true" to accept requests without an Origin header (curl). Off by default. */
  ALLOW_NO_ORIGIN?: string
}

export const DEFAULT_MODEL = 'google/gemma-4-31b-it'
export const DEFAULT_BASE_URL = 'https://api.aiand.com/v1'
export const MAX_MESSAGES = 12
export const MAX_CHARS = 1000
const MAX_BODY_BYTES = 16_000
const MAX_TOKENS = 700
const UPSTREAM_TIMEOUT_MS = 45_000

// Built once per instance. Deterministic, so providers can cache the prefix.
const SYSTEM_PROMPT = buildSystemPrompt(content)

export type Role = 'user' | 'assistant'
export interface Turn {
  role: Role
  content: string
}

// ── CORS ────────────────────────────────────────────────────────────────

export function originAllowed(origin: string | null, requestUrl: string, env: ProxyEnv): boolean {
  if (!origin) return env.ALLOW_NO_ORIGIN === 'true'
  try {
    if (new URL(origin).host === new URL(requestUrl).host) return true
  } catch {
    return false
  }
  const patterns = (env.ALLOWED_ORIGINS ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  return patterns.some((p) => {
    if (p === '*') return true
    const re = new RegExp(`^${p.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '[^/]*')}$`)
    return re.test(origin)
  })
}

function corsHeaders(origin: string | null): Record<string, string> {
  return origin
    ? {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Access-Control-Allow-Headers': 'content-type',
        'Access-Control-Max-Age': '86400',
        Vary: 'Origin',
      }
    : {}
}

function json(body: unknown, status: number, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers },
  })
}

// ── Validation ──────────────────────────────────────────────────────────

export function parseTurns(body: unknown): Turn[] | string {
  if (!body || typeof body !== 'object' || !Array.isArray((body as { messages?: unknown }).messages))
    return 'Expected {"messages": [{"role","content"}]}'
  const raw = (body as { messages: unknown[] }).messages
  if (raw.length === 0 || raw.length > MAX_MESSAGES) return `Send between 1 and ${MAX_MESSAGES} messages`
  const turns: Turn[] = []
  for (const m of raw) {
    if (!m || typeof m !== 'object') return 'Invalid message'
    const { role, content: text } = m as { role?: unknown; content?: unknown }
    if (role !== 'user' && role !== 'assistant') return 'Message roles must be "user" or "assistant"'
    if (typeof text !== 'string' || !text.trim()) return 'Message content must be a non-empty string'
    if (text.length > MAX_CHARS) return `Messages are limited to ${MAX_CHARS} characters`
    turns.push({ role, content: text })
  }
  while (turns.length && turns[0].role !== 'user') turns.shift()
  if (!turns.length || turns[turns.length - 1].role !== 'user') return 'The last message must be from the user'
  return turns
}

// ── Upstream (OpenAI-compatible) stream → text deltas ───────────────────

/** Parses an OpenAI-style SSE body and yields the answer text (reasoning tokens are skipped). */
export async function* openAIDeltas(body: ReadableStream<Uint8Array>): AsyncGenerator<string> {
  const reader = body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  try {
    for (;;) {
      const { value, done } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      let nl: number
      while ((nl = buffer.indexOf('\n')) >= 0) {
        const line = buffer.slice(0, nl).trim()
        buffer = buffer.slice(nl + 1)
        if (!line.startsWith('data:')) continue
        const data = line.slice(5).trim()
        if (data === '[DONE]') return
        let evt: { choices?: { delta?: { content?: string | null } }[]; error?: { message?: string } }
        try {
          evt = JSON.parse(data)
        } catch {
          continue
        }
        if (evt.error) throw new Error(evt.error.message || 'upstream error')
        const text = evt.choices?.[0]?.delta?.content
        if (text) yield text
      }
    }
  } finally {
    reader.releaseLock()
  }
}

function upstreamMessage(status: number): string {
  if (status === 401 || status === 403) return 'The assistant is not configured.'
  if (status === 429) return 'The assistant is busy. Try again in a minute.'
  return `Upstream error (${status}).`
}

function streamAnswer(turns: Turn[], env: ProxyEnv, signal: AbortSignal, fetchImpl: typeof fetch): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder()
  const base = (env.AIAND_BASE_URL || DEFAULT_BASE_URL).replace(/\/+$/, '')
  const payload: Record<string, unknown> = {
    model: env.AIAND_MODEL || DEFAULT_MODEL,
    messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...turns],
    stream: true,
    max_tokens: MAX_TOKENS,
    temperature: 0.3,
  }
  if (env.AIAND_REASONING_EFFORT) payload.reasoning_effort = env.AIAND_REASONING_EFFORT

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: Record<string, unknown>) => controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`))
      try {
        const res = await fetchImpl(`${base}/chat/completions`, {
          method: 'POST',
          headers: {
            authorization: `Bearer ${env.AIAND_API_KEY}`,
            'content-type': 'application/json',
            accept: 'text/event-stream',
          },
          body: JSON.stringify(payload),
          signal: AbortSignal.any([signal, AbortSignal.timeout(UPSTREAM_TIMEOUT_MS)]),
        })
        if (!res.ok || !res.body) {
          console.error('ai& error', res.status, (await res.text().catch(() => '')).slice(0, 300))
          send({ type: 'error', message: upstreamMessage(res.status) })
          return
        }
        let any = false
        for await (const text of openAIDeltas(res.body)) {
          any = true
          send({ type: 'delta', text })
        }
        if (!any) send({ type: 'delta', text: content.assistant.unknownAnswer })
        send({ type: 'done' })
      } catch (err) {
        if (!signal.aborted) {
          console.error('ai& stream failed', err instanceof Error ? err.message : err)
          send({ type: 'error', message: 'The assistant is unavailable right now.' })
        }
      } finally {
        try {
          controller.close()
        } catch {
          /* client already gone */
        }
      }
    },
  })
}

// ── Handler ─────────────────────────────────────────────────────────────

function clientIp(request: Request): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    request.headers.get('cf-connecting-ip') ||
    'unknown'
  )
}

/** Handles GET (health), OPTIONS (CORS preflight) and POST (chat). */
export async function handleChat(request: Request, env: ProxyEnv, fetchImpl: typeof fetch = fetch): Promise<Response> {
  const origin = request.headers.get('origin')
  const allowed = originAllowed(origin, request.url, env)
  const cors = allowed ? corsHeaders(origin) : {}

  if (request.method === 'OPTIONS') return new Response(null, { status: allowed ? 204 : 403, headers: cors })
  if (request.method === 'GET') {
    return json({ ok: true, provider: 'ai&', model: env.AIAND_MODEL || DEFAULT_MODEL, configured: !!env.AIAND_API_KEY }, 200, cors)
  }
  if (request.method !== 'POST') return json({ error: 'Use POST' }, 405, { ...cors, Allow: 'GET, POST, OPTIONS' })
  if (!allowed) return json({ error: 'Origin not allowed' }, 403)
  if (!env.AIAND_API_KEY) return json({ error: 'Assistant not configured' }, 503, cors)

  const length = Number(request.headers.get('content-length') ?? 0)
  if (length > MAX_BODY_BYTES) return json({ error: 'Request too large' }, 413, cors)
  const text = await request.text()
  if (text.length > MAX_BODY_BYTES) return json({ error: 'Request too large' }, 413, cors)

  let body: unknown
  try {
    body = JSON.parse(text)
  } catch {
    return json({ error: 'Invalid JSON' }, 400, cors)
  }
  const turns = parseTurns(body)
  if (typeof turns === 'string') return json({ error: turns }, 400, cors)

  const limit = await checkRateLimit(clientIp(request), env, Date.now(), fetchImpl)
  if (!limit.ok) return json({ error: limit.reason }, 429, { ...cors, 'Retry-After': String(limit.retryAfter) })

  return new Response(streamAnswer(turns, env, request.signal, fetchImpl), {
    headers: {
      ...cors,
      'content-type': 'text/event-stream; charset=utf-8',
      'cache-control': 'no-cache, no-transform',
      'x-content-type-options': 'nosniff',
      'x-accel-buffering': 'no',
    },
  })
}
