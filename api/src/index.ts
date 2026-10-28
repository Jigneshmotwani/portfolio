/**
 * Ask Jignesh proxy (Cloudflare Worker).
 *
 * Keeps the Claude API key server-side, grounds every answer in
 * src/data/content.ts, validates input, rate-limits per IP, and streams the
 * answer back to the browser as Server-Sent Events:
 *
 *   data: {"type":"delta","text":"…"}   (repeated)
 *   data: {"type":"reset"}              (discard text streamed so far)
 *   data: {"type":"done"}
 *   data: {"type":"error","message":"…"}
 */
import Anthropic from '@anthropic-ai/sdk'
import { content } from '../../src/data/content'
import { buildSystemPrompt } from '../../src/data/knowledge'
import { checkRateLimit, type RateLimitEnv } from './rateLimit'

export interface Env extends RateLimitEnv {
  /** Secret: `wrangler secret put ANTHROPIC_API_KEY`. */
  ANTHROPIC_API_KEY?: string
  /** Model id. Defaults to claude-opus-5-5. */
  ANTHROPIC_MODEL?: string
  /** low | medium | high. Chat answers need little reasoning: default low. */
  EFFORT?: string
  /** Comma-separated allowed origins; `*` wildcards allowed (e.g. http://localhost:*). */
  ALLOWED_ORIGINS?: string
  /** "true" to accept requests without an Origin header (curl). Off by default. */
  ALLOW_NO_ORIGIN?: string
}

const DEFAULT_MODEL = 'claude-opus-5-5'
const MAX_MESSAGES = 12
const MAX_CHARS = 1000
const MAX_BODY_BYTES = 16_000
/** Ceiling for one answer; thinking tokens count too, so leave headroom above the ~4 sentence answers. */
const MAX_TOKENS = 2048

// Built once per isolate. Deterministic, so it is a stable prompt-cache prefix.
const SYSTEM_PROMPT = buildSystemPrompt(content)
const UNKNOWN = content.assistant.unknownAnswer

type Role = 'user' | 'assistant'
interface Turn {
  role: Role
  content: string
}

// ── CORS ────────────────────────────────────────────────────────────────

function originAllowed(origin: string | null, env: Env): boolean {
  if (!origin) return env.ALLOW_NO_ORIGIN === 'true'
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

function parseTurns(body: unknown): Turn[] | string {
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

// ── Claude call ─────────────────────────────────────────────────────────

/** Server-side refusal fallbacks exist for the Opus 5.x, Fable 5.x and Sonnet 5.5 families (not Haiku). */
const supportsFallbacks = (model: string) => /^claude-(opus-5|fable-5|sonnet-5-5)/.test(model)

function streamAnswer(turns: Turn[], env: Env): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder()
  const model = env.ANTHROPIC_MODEL || DEFAULT_MODEL
  const effort = (['low', 'medium', 'high'].includes(env.EFFORT ?? '') ? env.EFFORT : 'low') as 'low' | 'medium' | 'high'
  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY, maxRetries: 1, timeout: 30_000 })

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: Record<string, unknown>) => controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`))
      try {
        const stream = client.beta.messages.stream({
          model,
          max_tokens: MAX_TOKENS,
          // Thinking stays adaptive (the default); low effort keeps chat answers fast and cheap.
          output_config: { effort },
          system: [{ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
          messages: turns,
          ...(supportsFallbacks(model) ? { betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default' as const } : {}),
        })
        for await (const event of stream) {
          if (event.type === 'content_block_delta' && event.delta.type === 'text_delta' && event.delta.text) {
            send({ type: 'delta', text: event.delta.text })
          }
        }
        const final = await stream.finalMessage()
        if (final.stop_reason === 'refusal') {
          // The whole fallback chain declined: replace any partial text with the standard answer.
          send({ type: 'reset' })
          send({ type: 'delta', text: UNKNOWN })
        }
        send({ type: 'done' })
      } catch (err) {
        let message = 'The assistant is unavailable right now.'
        if (err instanceof Anthropic.RateLimitError) message = 'The assistant is busy. Try again in a minute.'
        else if (err instanceof Anthropic.AuthenticationError) message = 'The assistant is not configured.'
        else if (err instanceof Anthropic.APIError) message = `Upstream error (${err.status ?? 'network'}).`
        console.error('claude error', err instanceof Error ? err.message : err)
        send({ type: 'error', message })
      } finally {
        controller.close()
      }
    },
  })
}

// ── Router ──────────────────────────────────────────────────────────────

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)
    const origin = request.headers.get('Origin')
    const allowed = originAllowed(origin, env)
    const cors = allowed ? corsHeaders(origin) : {}

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: allowed ? 204 : 403, headers: cors })
    }

    if (url.pathname === '/health' && request.method === 'GET') {
      return json({ ok: true, model: env.ANTHROPIC_MODEL || DEFAULT_MODEL, configured: !!env.ANTHROPIC_API_KEY }, 200, cors)
    }

    if (url.pathname !== '/chat') return json({ error: 'Not found' }, 404, cors)
    if (request.method !== 'POST') return json({ error: 'Use POST' }, 405, { ...cors, Allow: 'POST, OPTIONS' })
    if (!allowed) return json({ error: 'Origin not allowed' }, 403)
    if (!env.ANTHROPIC_API_KEY) return json({ error: 'Assistant not configured' }, 503, cors)

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

    const ip = request.headers.get('CF-Connecting-IP') ?? request.headers.get('X-Forwarded-For')?.split(',')[0]?.trim() ?? 'unknown'
    const limit = await checkRateLimit(ip, env)
    if (!limit.ok) {
      return json({ error: limit.reason }, 429, { ...cors, 'Retry-After': String(limit.retryAfter) })
    }

    return new Response(streamAnswer(turns, env), {
      headers: {
        ...cors,
        'content-type': 'text/event-stream; charset=utf-8',
        'cache-control': 'no-cache, no-transform',
        'x-content-type-options': 'nosniff',
      },
    })
  },
}
