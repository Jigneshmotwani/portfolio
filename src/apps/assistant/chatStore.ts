import { create } from 'zustand'
import { content } from '../../data/content'
import { playSound } from '../../lib/sound'
import { readJSON, writeJSON } from '../../lib/storage'
import { useIsland } from '../../state/island'
import { apiUrl, streamAnswer, type AnswerMode, type ChatTurn } from './client'

export interface ChatMessage extends ChatTurn {
  id: string
  status: 'streaming' | 'done' | 'stopped'
  mode?: AnswerMode
}

interface ChatState {
  messages: ChatMessage[]
  streaming: boolean
  /** How the latest answer was produced (badge in the header). */
  mode: AnswerMode
  ask: (question: string) => void
  stop: () => void
  clear: () => void
}

const STORAGE_KEY = 'jos.assistant.chat.v1'
const ISLAND_ID = 'ai'

let seq = 0
const newId = () => `m${Date.now().toString(36)}${(seq++).toString(36)}`
let controller: AbortController | null = null

function load(): ChatMessage[] {
  const saved = readJSON<ChatMessage[]>(STORAGE_KEY, [], 'session')
  if (!Array.isArray(saved)) return []
  return saved
    .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .map((m) => (m.status === 'streaming' ? { ...m, status: m.content ? 'done' : 'stopped' } : m))
}

const persist = (messages: ChatMessage[]) => writeJSON(STORAGE_KEY, messages.slice(-40), 'session')

export const useChat = create<ChatState>()((set, get) => ({
  messages: load(),
  streaming: false,
  mode: apiUrl ? 'live' : 'offline',

  ask: (raw) => {
    const question = raw.trim().slice(0, 1000)
    if (!question) return
    if (get().streaming) get().stop()

    const user: ChatMessage = { id: newId(), role: 'user', content: question, status: 'done' }
    const answer: ChatMessage = { id: newId(), role: 'assistant', content: '', status: 'streaming' }
    const history: ChatTurn[] = [...get().messages, user]
      .filter((m) => m.content)
      .map(({ role, content: text }) => ({ role, content: text }))
    set({ messages: [...get().messages, user, answer], streaming: true })
    playSound('send')
    useIsland.getState().setActivity({ id: ISLAND_ID, kind: 'ai', priority: 30, title: 'Ask Jignesh is thinking…', icon: 'assistant' })

    const ctrl = new AbortController()
    controller = ctrl
    const patch = (fn: (m: ChatMessage) => ChatMessage) =>
      set({ messages: get().messages.map((m) => (m.id === answer.id ? fn(m) : m)) })

    void (async () => {
      try {
        for await (const evt of streamAnswer(history, ctrl.signal)) {
          if (evt.type === 'mode') {
            set({ mode: evt.mode })
            patch((m) => ({ ...m, mode: evt.mode }))
          } else if (evt.type === 'reset') patch((m) => ({ ...m, content: '' }))
          else patch((m) => ({ ...m, content: m.content + evt.text }))
        }
        patch((m) => ({ ...m, status: 'done' }))
      } catch {
        patch((m) => ({
          ...m,
          status: 'stopped',
          content: m.content || (ctrl.signal.aborted ? '' : content.assistant.unknownAnswer),
        }))
      } finally {
        if (controller === ctrl) {
          controller = null
          set({ streaming: false })
          useIsland.getState().clearActivity(ISLAND_ID)
        }
        persist(get().messages)
      }
    })()
  },

  stop: () => {
    controller?.abort()
    controller = null
    set({
      streaming: false,
      messages: get().messages.map((m) => (m.status === 'streaming' ? { ...m, status: 'stopped' } : m)),
    })
    useIsland.getState().clearActivity(ISLAND_ID)
    persist(get().messages)
  },

  clear: () => {
    get().stop()
    set({ messages: [] })
    persist([])
  },
}))
