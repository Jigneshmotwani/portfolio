import { content } from '../../data/content'
import { answerLocally } from '../../data/knowledge'
import { asset } from '../../lib/assets'

export type ChatRole = 'user' | 'assistant'

export interface ChatTurn {
  role: ChatRole
  content: string
}

export type AnswerMode = 'live' | 'offline'

export type StreamEvent =
  | { type: 'mode'; mode: AnswerMode; reason?: string }
  /** Drop everything streamed so far for this answer (e.g. switching to the offline fallback). */
  | { type: 'reset' }
  | { type: 'delta'; text: string }

const FIRST_BYTE_TIMEOUT = 8000
const MAX_TURNS = 12
const MAX_CHARS = 1000

/** URL of the proxy (api/chat.ts on Vercel), resolved against the site root. Empty = offline-only mode. */
const configuredApi = (import.meta.env.VITE_ASSISTANT_API_URL as string | undefined) || content.assistant.apiUrl || ''
export const apiUrl = configuredApi ? asset(configuredApi).replace(/\/+$/, '') : ''

const sleep = (ms: number, signal: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    if (signal.aborted) return reject(new DOMException('Aborted', 'AbortError'))
    const t = setTimeout(resolve, ms)
    signal.addEventListener(
      'abort',
      () => {
        clearTimeout(t)
        reject(new DOMException('Aborted', 'AbortError'))
      },
      { once: true },
    )
  })

/** Keeps the request within the proxy's validation limits. */
function trimHistory(history: ChatTurn[]): ChatTurn[] {
  const turns = history
    .filter((t) => t.content.trim())
    .map((t) => ({ role: t.role, content: t.content.slice(0, MAX_CHARS) }))
    .slice(-MAX_TURNS)
  while (turns.length && turns[0].role !== 'user') turns.shift()
  return turns
}

class FallbackError extends Error {}

/** Streams an answer from the proxy. Throws FallbackError when the live path can't be used. */
async function* streamLive(history: ChatTurn[], signal: AbortSignal): AsyncGenerator<StreamEvent> {
  const ctrl = new AbortController()
  const onAbort = () => ctrl.abort()
  signal.addEventListener('abort', onAbort, { once: true })
  let firstByte = false
  const timer = setTimeout(() => {
    if (!firstByte) ctrl.abort()
  }, FIRST_BYTE_TIMEOUT)

  try {
    let res: Response
    try {
      res = await fetch(`${apiUrl}/chat`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ messages: trimHistory(history) }),
        signal: ctrl.signal,
      })
    } catch (err) {
      if (signal.aborted) throw err
      throw new FallbackError('network')
    }
    if (!res.ok || !res.body) throw new FallbackError(res.status === 429 ? 'rate-limited' : `http-${res.status}`)
    // Static hosts without the proxy may answer with an HTML page; only an event stream is the live assistant.
    if (!res.headers.get('content-type')?.includes('text/event-stream')) throw new FallbackError('not-a-stream')

    const reader = res.body.pipeThrough(new TextDecoderStream()).getReader()
    let buffer = ''
    let streamedAny = false
    for (;;) {
      let chunk: ReadableStreamReadResult<string>
      try {
        chunk = await reader.read()
      } catch (err) {
        if (signal.aborted) throw err
        throw new FallbackError('stream-interrupted')
      }
      if (chunk.done) break
      if (!firstByte) {
        firstByte = true
        yield { type: 'mode', mode: 'live' }
      }
      buffer += chunk.value
      let sep: number
      while ((sep = buffer.indexOf('\n\n')) !== -1) {
        const raw = buffer.slice(0, sep)
        buffer = buffer.slice(sep + 2)
        const data = raw
          .split('\n')
          .filter((l) => l.startsWith('data:'))
          .map((l) => l.slice(5).trimStart())
          .join('\n')
        if (!data) continue
        let evt: { type?: string; text?: string; message?: string }
        try {
          evt = JSON.parse(data)
        } catch {
          continue
        }
        if (evt.type === 'delta' && evt.text) {
          streamedAny = true
          yield { type: 'delta', text: evt.text }
        } else if (evt.type === 'reset') {
          yield { type: 'reset' }
        } else if (evt.type === 'error') {
          throw new FallbackError(evt.message ?? 'upstream-error')
        } else if (evt.type === 'done') {
          if (!streamedAny) throw new FallbackError('empty')
          return
        }
      }
    }
    if (!streamedAny) throw new FallbackError('empty')
  } finally {
    clearTimeout(timer)
    signal.removeEventListener('abort', onAbort)
  }
}

/** Offline answer, revealed word by word so it feels like the live assistant. */
async function* streamLocal(history: ChatTurn[], signal: AbortSignal): AsyncGenerator<StreamEvent> {
  const users = history.filter((t) => t.role === 'user')
  const question = users[users.length - 1]?.content ?? ''
  const previous = users[users.length - 2]?.content
  const { text } = answerLocally(question, content, previous)
  await sleep(380 + Math.random() * 320, signal)
  const pieces = text.match(/\S+\s*/g) ?? [text]
  for (const piece of pieces) {
    yield { type: 'delta', text: piece }
    const pause = /[.!?:]\s*$/.test(piece) ? 70 : /\n/.test(piece) ? 45 : 14 + Math.random() * 22
    await sleep(pause, signal)
  }
}

/**
 * Streams an answer to the last user turn in `history`.
 * Live (proxy) when configured and reachable; otherwise offline keyword search.
 */
export async function* streamAnswer(history: ChatTurn[], signal: AbortSignal): AsyncGenerator<StreamEvent> {
  if (apiUrl) {
    try {
      yield* streamLive(history, signal)
      return
    } catch (err) {
      if (signal.aborted || !(err instanceof FallbackError)) throw err
      yield { type: 'reset' }
      yield { type: 'mode', mode: 'offline', reason: err.message }
    }
  } else {
    yield { type: 'mode', mode: 'offline', reason: 'not-configured' }
  }
  yield* streamLocal(history, signal)
}
