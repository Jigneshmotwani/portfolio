import { beforeEach, describe, expect, it, vi } from 'vitest'
import { handleChat, openAIDeltas, originAllowed, parseTurns, type ProxyEnv } from './chatProxy'
import { checkRateLimit, resetMemoryLimits } from './rateLimit'

const SITE = 'https://jigneshmotwani.vercel.app'
const env: ProxyEnv = { AIAND_API_KEY: 'sk-test', PER_MINUTE_LIMIT: '3' }

const sse = (chunks: string[]) =>
  new ReadableStream<Uint8Array>({
    start(c) {
      const enc = new TextEncoder()
      for (const chunk of chunks) c.enqueue(enc.encode(chunk))
      c.close()
    },
  })

const chat = (body: unknown, headers: Record<string, string> = {}) =>
  new Request(`${SITE}/api/chat`, {
    method: 'POST',
    headers: { origin: SITE, 'content-type': 'application/json', 'x-forwarded-for': '1.2.3.4', ...headers },
    body: JSON.stringify(body),
  })

async function readEvents(res: Response) {
  const text = await res.text()
  return text
    .split('\n\n')
    .filter((l) => l.startsWith('data: '))
    .map((l) => JSON.parse(l.slice(6)))
}

beforeEach(() => resetMemoryLimits())

describe('validation', () => {
  it('accepts a normal conversation', () => {
    expect(parseTurns({ messages: [{ role: 'user', content: 'hi' }] })).toEqual([{ role: 'user', content: 'hi' }])
  })
  it('rejects bad shapes', () => {
    expect(typeof parseTurns({})).toBe('string')
    expect(typeof parseTurns({ messages: [{ role: 'system', content: 'x' }] })).toBe('string')
    expect(typeof parseTurns({ messages: [{ role: 'user', content: 'x'.repeat(1001) }] })).toBe('string')
    expect(typeof parseTurns({ messages: [{ role: 'assistant', content: 'only me' }] })).toBe('string')
  })
})

describe('origins', () => {
  it('allows same-origin and configured patterns only', () => {
    expect(originAllowed(SITE, `${SITE}/api/chat`, {})).toBe(true)
    expect(originAllowed('https://evil.example', `${SITE}/api/chat`, {})).toBe(false)
    expect(originAllowed('https://pr-1-jignesh.vercel.app', `${SITE}/api/chat`, { ALLOWED_ORIGINS: 'https://*.vercel.app' })).toBe(true)
    expect(originAllowed(null, `${SITE}/api/chat`, {})).toBe(false)
  })
})

describe('openAIDeltas', () => {
  it('yields content and skips reasoning, keep-alives and split lines', async () => {
    const body = sse([
      ': keep-alive\n\n',
      'data: {"choices":[{"delta":{"reasoning_content":"hmm"}}]}\n\n',
      'data: {"choices":[{"delta":{"content":"Hel"}}]}\n\ndata: {"choices":[{"del',
      'ta":{"content":"lo"}}]}\n\n',
      'data: [DONE]\n\n',
    ])
    const out: string[] = []
    for await (const t of openAIDeltas(body)) out.push(t)
    expect(out.join('')).toBe('Hello')
  })
})

describe('handleChat', () => {
  it('streams ai& output as delta events with the system prompt and key', async () => {
    const fetchImpl = vi.fn(async (_url: string | URL | Request, init?: RequestInit) => {
      const payload = JSON.parse(String(init?.body))
      expect(payload.messages[0].role).toBe('system')
      expect(payload.messages[0].content).toContain('Jignesh')
      expect(payload.stream).toBe(true)
      expect((init?.headers as Record<string, string>).authorization).toBe('Bearer sk-test')
      return new Response(sse(['data: {"choices":[{"delta":{"content":"He leads K2."}}]}\n\n', 'data: [DONE]\n\n']), {
        headers: { 'content-type': 'text/event-stream' },
      })
    })
    const res = await handleChat(chat({ messages: [{ role: 'user', content: 'What does he do?' }] }), env, fetchImpl as typeof fetch)
    expect(res.headers.get('content-type')).toContain('text/event-stream')
    expect(await readEvents(res)).toEqual([{ type: 'delta', text: 'He leads K2.' }, { type: 'done' }])
    expect(String(fetchImpl.mock.calls[0][0])).toBe('https://api.aiand.com/v1/chat/completions')
  })

  it('reports upstream auth failures as an error event', async () => {
    const fetchImpl = vi.fn(async () => new Response('{"error":"bad key"}', { status: 401 }))
    const res = await handleChat(chat({ messages: [{ role: 'user', content: 'hi' }] }), env, fetchImpl as typeof fetch)
    expect(await readEvents(res)).toEqual([{ type: 'error', message: 'The assistant is not configured.' }])
  })

  it('refuses other origins, missing keys and bad bodies', async () => {
    const ok = vi.fn() as unknown as typeof fetch
    expect((await handleChat(chat({ messages: [] }, { origin: 'https://evil.example' }), env, ok)).status).toBe(403)
    expect((await handleChat(chat({ messages: [{ role: 'user', content: 'hi' }] }), {}, ok)).status).toBe(503)
    expect((await handleChat(chat({ nope: true }), env, ok)).status).toBe(400)
  })

  it('rate-limits per IP', async () => {
    const fetchImpl = vi.fn(async () => new Response(sse(['data: [DONE]\n\n'])))
    const statuses: number[] = []
    for (let i = 0; i < 4; i++) {
      const res = await handleChat(chat({ messages: [{ role: 'user', content: 'hi' }] }), env, fetchImpl as typeof fetch)
      statuses.push(res.status)
      await res.text()
    }
    expect(statuses).toEqual([200, 200, 200, 429])
  })

  it('answers GET with a health check', async () => {
    const res = await handleChat(new Request(`${SITE}/api/chat`), env)
    expect(await res.json()).toMatchObject({ ok: true, provider: 'ai&', configured: true })
  })
})

describe('rate limiter with Redis', () => {
  it('uses the Upstash pipeline when configured and enforces the per-minute limit', async () => {
    const fetchImpl = vi.fn(async (_url: string | URL | Request) => Response.json([{ result: 9 }, { result: 1 }, { result: 9 }, { result: 1 }, { result: 50 }, { result: 1 }]))
    const res = await checkRateLimit('5.6.7.8', { UPSTASH_REDIS_REST_URL: 'https://r.example', UPSTASH_REDIS_REST_TOKEN: 't' }, Date.now(), fetchImpl as typeof fetch)
    expect(res.ok).toBe(false)
    expect(String(fetchImpl.mock.calls[0][0])).toBe('https://r.example/pipeline')
  })

  it('falls back to memory when Redis is down', async () => {
    const fetchImpl = vi.fn(async () => new Response('down', { status: 500 }))
    const res = await checkRateLimit('5.6.7.9', { KV_REST_API_URL: 'https://r.example', KV_REST_API_TOKEN: 't' }, Date.now(), fetchImpl as typeof fetch)
    expect(res.ok).toBe(true)
  })
})
