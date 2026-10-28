import { X } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { content } from '../../data/content'
import { useSystem } from '../../state/system'
import { useChat } from './chatStore'
import { ChatView } from './ChatView'
import { ModeBadge } from './ModeBadge'
import { Orb } from './Orb'
import './assistant.css'

/**
 * iOS "Ask Jignesh": glowing screen edge + bottom sheet chat, Siri style.
 * Rendered by the iOS shell; shows while useSystem().siri.open.
 */
export function SiriOverlay() {
  const { open, query, nonce } = useSystem((s) => s.siri)
  const close = useSystem((s) => s.closeSiri)
  const streaming = useChat((s) => s.streaming)
  const handled = useRef(0)

  useEffect(() => {
    if (open && query && nonce !== handled.current) {
      handled.current = nonce
      useChat.getState().ask(query)
    }
  }, [open, query, nonce])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, close])

  if (!open) return null

  return (
    <div className={`siri${streaming ? ' siri--thinking' : ''}`} role="dialog" aria-modal="true" aria-label={content.assistant.name}>
      <div className="siri__scrim" onClick={close} />
      <div className="siri__glow" aria-hidden="true">
        <div className="siri__ring" />
        <div className="siri__ring siri__ring--blur" />
      </div>
      <section className="siri__sheet">
        <div className="siri__grabber" aria-hidden="true" />
        <header className="siri__header">
          <Orb size={34} state={streaming ? 'thinking' : 'idle'} />
          <div className="siri__titles">
            <h2 className="siri__title">{content.assistant.name}</h2>
            <ModeBadge />
          </div>
          <button className="siri__close" onClick={close} aria-label="Close">
            <X size={17} strokeWidth={2.4} />
          </button>
        </header>
        <ChatView variant="ios" autoFocus={!query} />
      </section>
    </div>
  )
}
