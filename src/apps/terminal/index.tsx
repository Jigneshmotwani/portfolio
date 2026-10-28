import { useCallback, useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent } from 'react'
import { displayPath, getNode, openNode } from '../../data/vfs'
import { askJignesh, composeMail, launch, openResume, openUrl } from '../../lib/launch'
import { useSettings, type WallpaperId } from '../../state/settings'
import { useApp } from '../types'
import { complete, initialState, runCommand, WELCOME, type Effect, type Line, type TermState } from './commands'
import './Terminal.css'

type Entry = { id: number; prompt?: { cwd: string; text: string }; line?: Line }

const MAX_ENTRIES = 600
const QUICK = ['help', 'whoami', 'ls', 'projects', 'skills', 'experience', 'contact', 'neofetch', 'clear']
let seq = 0
const entry = (e: Omit<Entry, 'id'>): Entry => ({ id: ++seq, ...e })

function Prompt({ cwd }: { cwd: string }) {
  return (
    <span className="term-prompt" aria-hidden="true">
      <span className="term-t-green">jignesh@portfolio</span> <span className="term-t-blue">{displayPath(cwd)}</span> %{' '}
    </span>
  )
}

export default function Terminal() {
  const { platform, params, close, active } = useApp()
  const [entries, setEntries] = useState<Entry[]>(() => WELCOME.map((line) => entry({ line })))
  const [state, setState] = useState<TermState>(initialState)
  const [input, setInput] = useState('')
  const [histIdx, setHistIdx] = useState<number | null>(null)
  const stateRef = useRef(state)
  stateRef.current = state
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const append = (items: Entry[], reset = false) =>
    setEntries((prev) => {
      const next = reset ? items : [...prev, ...items]
      return next.length > MAX_ENTRIES ? next.slice(-MAX_ENTRIES) : next
    })

  const applyEffects = useCallback(
    (effects: Effect[]) => {
      if (!effects.length) return
      // Let the output paint before another window steals focus.
      window.setTimeout(() => {
        for (const fx of effects) {
          switch (fx.type) {
            case 'launch':
              launch(fx.appId, fx.params)
              break
            case 'open': {
              const node = getNode(fx.path)
              if (node) openNode(node)
              break
            }
            case 'url':
              if (fx.url.startsWith('mailto:')) composeMail({ to: fx.url.slice(7) })
              else openUrl(fx.url)
              break
            case 'resume':
              openResume()
              break
            case 'theme':
              useSettings.getState().update({ theme: fx.value })
              break
            case 'wallpaper':
              useSettings.getState().update({ wallpaper: fx.id as WallpaperId })
              break
            case 'ask':
              askJignesh(fx.query)
              break
            case 'close':
              close()
              break
          }
        }
      }, 120)
    },
    [close],
  )

  const execute = useCallback(
    (text: string) => {
      const before = stateRef.current
      const res = runCommand(text, before)
      stateRef.current = res.state
      setState(res.state)
      setHistIdx(null)
      const echo = entry({ prompt: { cwd: before.cwd, text } })
      if (res.clear) append([], true)
      else append([echo, ...res.lines.map((line) => entry({ line }))])
      applyEffects(res.effects)
    },
    [applyEffects],
  )

  // Run a command passed in by a launch (e.g. Spotlight → "Run in Terminal").
  const nonce = params?.nonce
  const command = params?.command
  const handled = useRef<number | undefined>(undefined)
  useEffect(() => {
    if (!command || handled.current === nonce) return
    handled.current = nonce
    execute(command)
  }, [nonce, command, execute])

  useLayoutEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [entries])

  useEffect(() => {
    if (active && platform === 'mac') inputRef.current?.focus({ preventScroll: true })
  }, [active, platform])

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    const hist = state.history
    if (e.key === 'Enter') {
      e.preventDefault()
      const text = input
      setInput('')
      execute(text)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (!hist.length) return
      const i = histIdx === null ? hist.length - 1 : Math.max(0, histIdx - 1)
      setHistIdx(i)
      setInput(hist[i])
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (histIdx === null) return
      const i = histIdx + 1
      if (i >= hist.length) {
        setHistIdx(null)
        setInput('')
      } else {
        setHistIdx(i)
        setInput(hist[i])
      }
    } else if (e.key === 'Tab') {
      e.preventDefault()
      const res = complete(input, state)
      if (res.options.length > 1) {
        append([entry({ prompt: { cwd: state.cwd, text: input } }), entry({ line: [{ text: res.options.join('   '), tone: 'dim' }] })])
      }
      setInput(res.input)
    } else if (e.ctrlKey && (e.key === 'c' || e.key === 'C')) {
      e.preventDefault()
      append([entry({ prompt: { cwd: state.cwd, text: `${input}^C` } })])
      setInput('')
      setHistIdx(null)
    } else if (e.ctrlKey && (e.key === 'l' || e.key === 'L')) {
      e.preventDefault()
      append([], true)
    } else if (e.ctrlKey && (e.key === 'u' || e.key === 'U')) {
      e.preventDefault()
      setInput('')
    }
  }

  const focusInput = () => {
    if (window.getSelection()?.toString()) return
    inputRef.current?.focus({ preventScroll: platform !== 'ios' })
  }

  return (
    <div className={`term term--${platform}`} onClick={focusInput}>
      <div ref={scrollRef} className="term-scroll scroll" role="log" aria-live="polite" aria-label="Terminal output">
        {entries.map((e) =>
          e.prompt ? (
            <div key={e.id} className="term-line">
              <Prompt cwd={e.prompt.cwd} />
              <span>{e.prompt.text}</span>
            </div>
          ) : (
            <div key={e.id} className="term-line">
              {e.line!.length === 0 ? ' ' : e.line!.map((seg, i) => <Segment key={i} seg={seg} run={execute} />)}
            </div>
          ),
        )}
        <div className="term-line term-input-line">
          <Prompt cwd={state.cwd} />
          <input
            ref={inputRef}
            id="terminal-input"
            className="term-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            onFocus={() => platform === 'ios' && window.setTimeout(() => inputRef.current?.scrollIntoView({ block: 'end' }), 300)}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            enterKeyHint="go"
            aria-label="Command"
          />
        </div>
      </div>
      {platform === 'ios' && (
        <div className="term-quick scroll" aria-label="Quick commands">
          {QUICK.map((c) => (
            <button
              key={c}
              onClick={(e) => {
                e.stopPropagation()
                execute(c)
              }}
            >
              {c}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function Segment({ seg, run }: { seg: Line[number]; run: (cmd: string) => void }) {
  const cls = seg.tone ? `term-t-${seg.tone}` : undefined
  if (seg.href) {
    return (
      <a
        className={`term-link ${cls ?? ''}`}
        href={seg.href}
        target={seg.href.startsWith('http') ? '_blank' : undefined}
        rel="noreferrer"
        onClick={(e) => {
          e.stopPropagation()
          if (seg.href!.startsWith('mailto:')) {
            e.preventDefault()
            composeMail({ to: seg.href!.slice(7) })
          }
        }}
      >
        {seg.text}
      </a>
    )
  }
  if (seg.cmd) {
    return (
      <button
        className={`term-cmd ${cls ?? ''}`}
        onClick={(e) => {
          e.stopPropagation()
          run(seg.cmd!)
        }}
        title={`Run: ${seg.cmd}`}
      >
        {seg.text}
      </button>
    )
  }
  return <span className={cls}>{seg.text}</span>
}
