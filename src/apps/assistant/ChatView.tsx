import { ArrowUp, Mail, Square } from 'lucide-react'
import { useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent } from 'react'
import { content } from '../../data/content'
import { composeMail } from '../../lib/launch'
import { useChat } from './chatStore'
import { Markdown } from './Markdown'
import { Orb } from './Orb'

const { assistant, contact } = content

/** Chat transcript + composer, shared by the macOS window and the iOS Siri overlay. */
export function ChatView({ variant, autoFocus = false }: { variant: 'mac' | 'ios'; autoFocus?: boolean }) {
  const messages = useChat((s) => s.messages)
  const streaming = useChat((s) => s.streaming)
  const ask = useChat((s) => s.ask)
  const stop = useChat((s) => s.stop)
  const [draft, setDraft] = useState('')
  const listRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const stick = useRef(true)

  // Keep the newest text in view unless the reader scrolled up.
  useLayoutEffect(() => {
    const el = listRef.current
    if (el && stick.current) el.scrollTop = el.scrollHeight
  }, [messages])

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus({ preventScroll: true })
  }, [autoFocus])

  // Auto-grow the composer up to ~5 lines.
  useLayoutEffect(() => {
    const el = inputRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`
  }, [draft])

  const send = (text = draft) => {
    if (!text.trim()) return
    stick.current = true
    ask(text)
    setDraft('')
  }

  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault()
      send()
    }
  }

  const lastAnswer = [...messages].reverse().find((m) => m.role === 'assistant')
  const empty = messages.length === 0

  return (
    <div className={`aj-chat aj-chat--${variant}`}>
      <div
        className="aj-chat__list scroll"
        ref={listRef}
        onScroll={(e) => {
          const el = e.currentTarget
          stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < 40
        }}
        role="log"
        aria-live="polite"
        aria-label="Conversation with Ask Jignesh"
      >
        {empty ? (
          <div className="aj-empty">
            <Orb size={variant === 'ios' ? 56 : 64} />
            <p className="aj-empty__greeting">{assistant.greeting}</p>
            <div className="aj-starters" role="list">
              {assistant.starters.map((q) => (
                <button key={q} className="aj-starter" role="listitem" onClick={() => send(q)}>
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m) => (
            <div key={m.id} className={`aj-msg aj-msg--${m.role}`}>
              <div className={`aj-bubble${m.status === 'streaming' ? ' aj-bubble--streaming' : ''}`}>
                {m.role === 'assistant' ? (
                  m.content ? (
                    <Markdown text={m.content} />
                  ) : m.status === 'streaming' ? (
                    <span className="aj-typing" aria-label="Thinking">
                      <i />
                      <i />
                      <i />
                    </span>
                  ) : (
                    <p className="aj-muted">Stopped.</p>
                  )
                ) : (
                  <p>{m.content}</p>
                )}
                {m.status === 'streaming' && m.content && <span className="aj-caret" aria-hidden="true" />}
              </div>
              {m.role === 'assistant' && m.status !== 'streaming' && m.content.includes('try Mail') && (
                <button className="aj-action" onClick={() => composeMail({ to: contact.email, subject: 'Question from your portfolio' })}>
                  <Mail size={13} strokeWidth={2.2} /> Open Mail
                </button>
              )}
            </div>
          ))
        )}
        {!empty && !streaming && lastAnswer?.status !== 'streaming' && (
          <div className="aj-followups">
            {assistant.starters
              .filter((q) => !messages.some((m) => m.role === 'user' && m.content === q))
              .slice(0, 3)
              .map((q) => (
                <button key={q} className="aj-starter aj-starter--small" onClick={() => send(q)}>
                  {q}
                </button>
              ))}
          </div>
        )}
      </div>

      <form
        className="aj-composer"
        onSubmit={(e) => {
          e.preventDefault()
          send()
        }}
      >
        <label htmlFor={`aj-input-${variant}`} className="sr-only">
          Ask a question about Jignesh
        </label>
        <textarea
          id={`aj-input-${variant}`}
          ref={inputRef}
          className="aj-composer__input"
          rows={1}
          value={draft}
          maxLength={1000}
          placeholder="Ask about Jignesh…"
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKey}
        />
        {streaming ? (
          <button type="button" className="aj-composer__btn aj-composer__btn--stop" onClick={stop} aria-label="Stop answering">
            <Square size={12} fill="currentColor" strokeWidth={0} />
          </button>
        ) : (
          <button type="submit" className="aj-composer__btn" disabled={!draft.trim()} aria-label="Send">
            <ArrowUp size={16} strokeWidth={2.6} />
          </button>
        )}
      </form>
    </div>
  )
}
