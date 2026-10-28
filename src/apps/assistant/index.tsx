import { SquarePen } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { content } from '../../data/content'
import { useApp } from '../types'
import { useChat } from './chatStore'
import { ChatView } from './ChatView'
import { ModeBadge } from './ModeBadge'
import { Orb } from './Orb'
import './assistant.css'

/** "Ask Jignesh" window (macOS). On iOS the shell shows SiriOverlay instead. */
export default function AskJignesh() {
  const { params, platform, active } = useApp()
  const streaming = useChat((s) => s.streaming)
  const clear = useChat((s) => s.clear)
  const hasMessages = useChat((s) => s.messages.length > 0)
  const handled = useRef<number | undefined>(undefined)

  // A launch with { query } (Spotlight hand-off, Terminal `ask`) asks immediately.
  useEffect(() => {
    if (params?.query && params.nonce !== handled.current) {
      handled.current = params.nonce
      useChat.getState().ask(params.query)
    }
  }, [params?.query, params?.nonce])

  return (
    <div className={`aj-app aj-app--${platform}`}>
      <header className="aj-header" data-drag>
        <Orb size={30} state={streaming ? 'thinking' : 'idle'} />
        <div className="aj-header__titles">
          <h1 className="aj-header__title">{content.assistant.name}</h1>
          <span className="aj-header__sub">Answers from Jignesh's portfolio</span>
        </div>
        <ModeBadge />
        <button className="aj-icon-btn" onClick={clear} disabled={!hasMessages} aria-label="New conversation" title="New conversation">
          <SquarePen size={15} strokeWidth={2} />
        </button>
      </header>
      <ChatView variant={platform} autoFocus={active} />
    </div>
  )
}
