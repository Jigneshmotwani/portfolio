import { ArrowUpRight, BookOpen, ChevronLeft, ChevronRight, Lock, Plus, RotateCw, Search, Share, SquareStack, X } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { content } from '../../data/content'
import { hostOf } from '../../lib/format'
import { useApp } from '../types'
import { MissingPage, ProjectPage, ProjectsIndex, SearchPage, StartPage, WebPage, projectImage } from './pages'
import { START_URL, displayUrl, hostColor, isInternal, normalizeInput, projectFor, route, shareableUrl, titleFor } from './url'
import './safari.css'

interface Tab {
  id: string
  history: string[]
  index: number
  reloadKey: number
}

let tabSeq = 0
const makeTab = (url: string): Tab => ({ id: `t${++tabSeq}`, history: [url], index: 0, reloadKey: 0 })
const urlOf = (t: Tab) => t.history[t.index]
const isBlank = (t: Tab) => t.history.length === 1 && urlOf(t) === START_URL

interface State {
  tabs: Tab[]
  activeId: string
}

function initialState(url?: string): State {
  const tab = makeTab(url ? normalizeInput(url) : START_URL)
  return { tabs: [tab], activeId: tab.id }
}

export default function Safari() {
  const { platform, params, active, setTitle, close } = useApp()
  const [state, setState] = useState<State>(() => initialState(params?.url))
  const [overview, setOverview] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const handled = useRef(params?.nonce)

  const { tabs, activeId } = state
  const tab = tabs.find((t) => t.id === activeId) ?? tabs[0]
  const url = urlOf(tab)

  const patchTab = useCallback((id: string, fn: (t: Tab) => Tab) => {
    setState((s) => ({ ...s, tabs: s.tabs.map((t) => (t.id === id ? fn(t) : t)) }))
  }, [])

  const navigate = useCallback(
    (next: string) => {
      const target = normalizeInput(next)
      setState((s) => ({
        ...s,
        tabs: s.tabs.map((t) =>
          t.id === s.activeId
            ? urlOf(t) === target
              ? { ...t, reloadKey: t.reloadKey + 1 }
              : { ...t, history: [...t.history.slice(0, t.index + 1), target], index: t.index + 1 }
            : t,
        ),
      }))
      setOverview(false)
    },
    [],
  )

  const openTab = useCallback((next = START_URL) => {
    const target = normalizeInput(next)
    setState((s) => {
      const current = s.tabs.find((t) => t.id === s.activeId)
      if (current && isBlank(current) && target !== START_URL) {
        return { ...s, tabs: s.tabs.map((t) => (t.id === current.id ? { ...t, history: [target], index: 0 } : t)) }
      }
      const tab = makeTab(target)
      return { tabs: [...s.tabs, tab], activeId: tab.id }
    })
    setOverview(false)
  }, [])

  const closeTab = (id: string) => {
    if (tabs.length === 1) {
      if (platform === 'mac') close()
      else setState(initialState())
      return
    }
    setState((s) => {
      const i = s.tabs.findIndex((t) => t.id === id)
      const rest = s.tabs.filter((t) => t.id !== id)
      const activeId = s.activeId === id ? rest[Math.min(i, rest.length - 1)].id : s.activeId
      return { tabs: rest, activeId }
    })
  }

  // New launch intents (e.g. "Open in Safari" from GitHub / Finder) open a tab.
  useEffect(() => {
    if (!params?.url || params.nonce === handled.current) return
    handled.current = params.nonce
    openTab(params.url)
  }, [params?.nonce, params?.url, openTab])

  useEffect(() => {
    if (platform === 'mac') setTitle(titleFor(url))
  }, [platform, setTitle, url])

  useEffect(() => {
    if (!toast) return
    const t = window.setTimeout(() => setToast(null), 1800)
    return () => window.clearTimeout(t)
  }, [toast])

  const back = () => patchTab(tab.id, (t) => ({ ...t, index: Math.max(0, t.index - 1) }))
  const forward = () => patchTab(tab.id, (t) => ({ ...t, index: Math.min(t.history.length - 1, t.index + 1) }))
  const reload = () => patchTab(tab.id, (t) => ({ ...t, reloadKey: t.reloadKey + 1 }))
  const canBack = tab.index > 0
  const canForward = tab.index < tab.history.length - 1

  const share = async () => {
    const link = shareableUrl(url)
    try {
      await navigator.clipboard.writeText(link)
      setToast('Link copied')
    } catch {
      setToast(link)
    }
  }

  // Keyboard shortcuts that browsers don't reserve.
  useEffect(() => {
    if (!active || platform !== 'mac') return
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey
      if (mod && e.key === '[') back()
      else if (mod && e.key === ']') forward()
      else if (mod && e.altKey && e.key.toLowerCase() === 'r') reload()
      else return
      e.preventDefault()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const viewport = (
    <div className="safari-viewport">
      {tabs.map((t) => (
        <div key={t.id} className="safari-tabview" hidden={t.id !== tab.id}>
          <TabContent key={`${t.index}:${urlOf(t)}`} url={urlOf(t)} reloadKey={t.reloadKey} navigate={navigate} />
        </div>
      ))}
      {toast && <div className="safari-toast" role="status">{toast}</div>}
    </div>
  )

  if (platform === 'ios') {
    return (
      <div className="safari safari--ios">
        {viewport}
        <IOSBar
          url={url}
          canBack={canBack}
          canForward={canForward}
          tabCount={tabs.length}
          onSubmit={navigate}
          onBack={back}
          onForward={forward}
          onReload={reload}
          onShare={share}
          onHome={() => navigate(START_URL)}
          onTabs={() => setOverview(true)}
        />
        {overview && (
          <TabOverview
            tabs={tabs}
            activeId={tab.id}
            onPick={(id) => {
              setState((s) => ({ ...s, activeId: id }))
              setOverview(false)
            }}
            onClose={closeTab}
            onNew={() => openTab()}
            onDone={() => setOverview(false)}
          />
        )}
      </div>
    )
  }

  return (
    <div className="safari safari--mac">
      <header className="safari-toolbar" data-drag>
        <div className="safari-nav">
          <button className="safari-tbtn" onClick={back} disabled={!canBack} aria-label="Back" title="Back">
            <ChevronLeft size={20} />
          </button>
          <button className="safari-tbtn" onClick={forward} disabled={!canForward} aria-label="Forward" title="Forward">
            <ChevronRight size={20} />
          </button>
        </div>
        <AddressField url={url} onSubmit={navigate} onReload={reload} />
        <div className="safari-nav">
          {!isInternal(url) && (
            <a className="safari-tbtn" href={url} target="_blank" rel="noopener noreferrer" aria-label="Open in a real browser tab" title="Open in a real browser tab">
              <ArrowUpRight size={18} />
            </a>
          )}
          <button className="safari-tbtn" onClick={share} aria-label="Copy link" title="Copy link">
            <Share size={16} />
          </button>
          <button className="safari-tbtn" onClick={() => openTab()} aria-label="New tab" title="New tab">
            <Plus size={19} />
          </button>
        </div>
      </header>
      <div className="safari-tabs" role="tablist" data-drag>
        {tabs.map((t) => (
          <div
            key={t.id}
            role="tab"
            aria-selected={t.id === tab.id}
            tabIndex={0}
            className={`safari-tab${t.id === tab.id ? ' is-active' : ''}`}
            onClick={() => setState((s) => ({ ...s, activeId: t.id }))}
            onKeyDown={(e) => e.key === 'Enter' && setState((s) => ({ ...s, activeId: t.id }))}
            onAuxClick={(e) => e.button === 1 && closeTab(t.id)}
            title={titleFor(urlOf(t))}
          >
            <button
              className="safari-tab__close"
              onClick={(e) => {
                e.stopPropagation()
                closeTab(t.id)
              }}
              aria-label={`Close ${titleFor(urlOf(t))}`}
            >
              <X size={12} strokeWidth={2.5} />
            </button>
            <Favicon url={urlOf(t)} />
            <span className="safari-tab__title">{titleFor(urlOf(t))}</span>
          </div>
        ))}
        <button className="safari-tabs__add" onClick={() => openTab()} aria-label="New tab" title="New tab">
          <Plus size={15} />
        </button>
      </div>
      {viewport}
    </div>
  )
}

function TabContent({ url, reloadKey, navigate }: { url: string; reloadKey: number; navigate: (u: string) => void }) {
  const r = useMemo(() => route(url), [url])
  return (
    <div className="safari-scroll scroll" key={r.kind === 'web' ? undefined : reloadKey}>
      {r.kind === 'start' && <StartPage navigate={navigate} />}
      {r.kind === 'projects' && <ProjectsIndex navigate={navigate} />}
      {r.kind === 'project' && <ProjectPage project={r.project} navigate={navigate} />}
      {r.kind === 'search' && <SearchPage query={r.query} navigate={navigate} />}
      {r.kind === 'missing' && <MissingPage url={r.url} navigate={navigate} />}
      {r.kind === 'web' && <WebPage url={r.url} frameable={r.frameable} reloadKey={reloadKey} navigate={navigate} />}
    </div>
  )
}

function Favicon({ url }: { url: string }) {
  const project = projectFor(url)
  if (url === START_URL || url === 'jignesh://projects') return <span className="safari-favicon safari-favicon--j">j</span>
  if (project && isInternal(url)) return <span className="safari-favicon safari-favicon--glyph">{project.cover.glyph}</span>
  if (isInternal(url)) return <span className="safari-favicon safari-favicon--j">j</span>
  const host = hostOf(url)
  const bm = content.bookmarks.find((b) => hostOf(b.url) === host)
  return (
    <span className="safari-favicon" style={{ background: bm?.color ?? hostColor(host) }}>
      {host[0]?.toUpperCase()}
    </span>
  )
}

function AddressField({ url, onSubmit, onReload }: { url: string; onSubmit: (u: string) => void; onReload: () => void }) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState('')
  const ref = useRef<HTMLInputElement>(null)
  const secure = url.startsWith('https://')
  return (
    <form
      className={`safari-address${editing ? ' is-editing' : ''}`}
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit(value)
        ref.current?.blur()
      }}
    >
      {!editing && (secure ? <Lock size={11} className="safari-address__lock" aria-label="Secure connection" /> : isInternal(url) && url !== START_URL ? <span className="safari-address__j">j</span> : <Search size={13} className="safari-address__lock" />)}
      <input
        ref={ref}
        value={editing ? value : displayUrl(url)}
        placeholder="Search or enter website name"
        aria-label="Address and search bar"
        spellCheck={false}
        autoCapitalize="off"
        autoCorrect="off"
        onFocus={(e) => {
          setEditing(true)
          setValue(url === START_URL ? '' : url)
          requestAnimationFrame(() => e.target.select())
        }}
        onBlur={() => setEditing(false)}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => e.key === 'Escape' && ref.current?.blur()}
      />
      {!editing && url !== START_URL && (
        <button type="button" className="safari-address__reload" onClick={onReload} aria-label="Reload page" title="Reload page">
          <RotateCw size={12} />
        </button>
      )}
    </form>
  )
}

function IOSBar(props: {
  url: string
  canBack: boolean
  canForward: boolean
  tabCount: number
  onSubmit: (u: string) => void
  onBack: () => void
  onForward: () => void
  onReload: () => void
  onShare: () => void
  onHome: () => void
  onTabs: () => void
}) {
  const { url } = props
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState('')
  const ref = useRef<HTMLInputElement>(null)
  const secure = url.startsWith('https://')
  const label = url === START_URL ? 'Search or enter website' : isInternal(url) ? url.replace('jignesh://', 'jignesh/') : hostOf(url)

  return (
    <footer className={`safari-iosbar${editing ? ' is-editing' : ''}`}>
      <form
        className="safari-iosbar__field"
        onSubmit={(e) => {
          e.preventDefault()
          props.onSubmit(value)
          ref.current?.blur()
        }}
      >
        {editing ? (
          <>
            <Search size={16} className="safari-iosbar__icon" />
            <input
              ref={ref}
              autoFocus
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onBlur={() => setEditing(false)}
              placeholder="Search or enter website"
              aria-label="Address and search bar"
              spellCheck={false}
              autoCapitalize="off"
              autoCorrect="off"
              enterKeyHint="go"
            />
            <button type="button" className="safari-iosbar__cancel" onMouseDown={(e) => e.preventDefault()} onClick={() => ref.current?.blur()}>
              Cancel
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              className="safari-iosbar__pill"
              onClick={() => {
                setValue(url === START_URL ? '' : url)
                setEditing(true)
              }}
            >
              {secure ? <Lock size={12} /> : url === START_URL ? <Search size={14} /> : null}
              <span>{label}</span>
            </button>
            {url !== START_URL && (
              <button type="button" className="safari-iosbar__reload" onClick={props.onReload} aria-label="Reload">
                <RotateCw size={16} />
              </button>
            )}
          </>
        )}
      </form>
      <nav className="safari-iosbar__tools" aria-label="Browser controls">
        <button onClick={props.onBack} disabled={!props.canBack} aria-label="Back">
          <ChevronLeft size={26} />
        </button>
        <button onClick={props.onForward} disabled={!props.canForward} aria-label="Forward">
          <ChevronRight size={26} />
        </button>
        <button onClick={props.onShare} aria-label="Copy link">
          <Share size={21} />
        </button>
        <button onClick={props.onHome} aria-label="Start page">
          <BookOpen size={22} />
        </button>
        <button onClick={props.onTabs} aria-label={`Show tabs (${props.tabCount})`} className="safari-iosbar__tabs">
          <SquareStack size={22} />
        </button>
      </nav>
    </footer>
  )
}

function TabOverview(props: {
  tabs: Tab[]
  activeId: string
  onPick: (id: string) => void
  onClose: (id: string) => void
  onNew: () => void
  onDone: () => void
}) {
  return (
    <div className="safari-overview" role="dialog" aria-label="Tabs">
      <div className="safari-overview__grid scroll">
        {props.tabs.map((t) => {
          const u = urlOf(t)
          const project = projectFor(u)
          const r = route(u)
          return (
            <div key={t.id} className={`safari-ocard${t.id === props.activeId ? ' is-active' : ''}`}>
              <button className="safari-ocard__body" onClick={() => props.onPick(t.id)}>
                <span className="safari-ocard__head">
                  <Favicon url={u} />
                  <span>{titleFor(u)}</span>
                </span>
                <span className="safari-ocard__thumb">
                  {project ? (
                    <img src={projectImage(project)} alt="" />
                  ) : r.kind === 'start' ? (
                    <span className="safari-ocard__start">Start Page</span>
                  ) : (
                    <span className="safari-ocard__host" style={{ background: hostColor(hostOf(u)) }}>
                      {hostOf(u)}
                    </span>
                  )}
                </span>
              </button>
              <button className="safari-ocard__close" onClick={() => props.onClose(t.id)} aria-label={`Close ${titleFor(u)}`}>
                <X size={14} strokeWidth={2.6} />
              </button>
            </div>
          )
        })}
      </div>
      <div className="safari-overview__bar">
        <button onClick={props.onNew} aria-label="New tab">
          <Plus size={26} />
        </button>
        <span>
          {props.tabs.length} Tab{props.tabs.length === 1 ? '' : 's'}
        </span>
        <button onClick={props.onDone} className="safari-overview__done">
          Done
        </button>
      </div>
    </div>
  )
}

