import { Search } from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { fileIconUrl, folderIconUrl } from '../../assets/icons'
import { content } from '../../data/content'
import { askJignesh, launch } from '../../lib/launch'
import type { Platform } from '../../lib/platform'
import { search, type ResultIcon, type SearchResponse, type SearchResult } from '../../lib/search'
import { apps, appName } from '../../apps/registry'
import type { AppId } from '../../apps/types'
import { useSystem } from '../../state/system'
import { AppIcon } from './AppIcon'
import './Spotlight.css'

/** Spotlight search (⌘/Ctrl+Space on macOS, pull-down on the iOS home screen). */
export function Spotlight({ platform }: { platform: Platform }) {
  const open = useSystem((s) => s.spotlight.open)
  if (!open) return null
  return platform === 'mac' ? <MacSpotlight /> : <IosSpotlight />
}

function useSpotlight(platform: Platform) {
  const query = useSystem((s) => s.spotlight.query)
  const setQuery = useSystem((s) => s.setSpotlightQuery)
  const close = useSystem((s) => s.closeSpotlight)
  const results = useMemo(() => search(query, platform), [query, platform])
  const [selected, setSelected] = useState(0)
  useEffect(() => setSelected(0), [query])

  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        close()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [close])

  const run = (r: SearchResult | undefined) => {
    if (!r) return
    close()
    r.run()
  }

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    const n = results.flat.length
    if (e.key === 'ArrowDown' && n) {
      e.preventDefault()
      setSelected((i) => (i + 1) % n)
    } else if (e.key === 'ArrowUp' && n) {
      e.preventDefault()
      setSelected((i) => (i - 1 + n) % n)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      run(results.flat[selected])
    }
  }

  return { query, setQuery, close, results, selected, setSelected, run, onKeyDown }
}

export function ResultIconView({ icon, size }: { icon: ResultIcon; size: number }) {
  switch (icon.type) {
    case 'app':
      return <AppIcon id={icon.id} size={size} />
    case 'ask':
      return <AppIcon id="assistant" size={size} />
    case 'folder':
      return <img className="spot-icon-img" src={folderIconUrl(icon.emblem)} alt="" style={{ width: size, height: size }} draggable={false} />
    case 'file':
      return <img className="spot-icon-img" src={fileIconUrl(icon.kind)} alt="" style={{ width: size, height: size }} draggable={false} />
    case 'cover':
      return (
        <span
          className="spot-icon-cover"
          style={{ width: size, height: size, fontSize: size * 0.56, background: `linear-gradient(135deg, ${icon.from}, ${icon.to})` }}
          aria-hidden="true"
        >
          {icon.glyph}
        </span>
      )
    case 'emoji':
      return (
        <span className="spot-icon-emoji" style={{ width: size, height: size, fontSize: size * 0.72 }} aria-hidden="true">
          {icon.value}
        </span>
      )
  }
}

/* ───────────────────────────── macOS ───────────────────────────── */

function MacSpotlight() {
  const s = useSpotlight('mac')
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    listRef.current?.querySelector('[data-selected="true"]')?.scrollIntoView({ block: 'nearest' })
  }, [s.selected])

  const index = new Map(s.results.flat.map((r, i) => [r, i]))
  const row = (r: SearchResult, big = false) => {
    const i = index.get(r) ?? -1
    return (
      <div
        key={r.id}
        role="option"
        id={`spot-opt-${i}`}
        aria-selected={i === s.selected}
        data-selected={i === s.selected}
        className={`spot-row${big ? ' spot-row--big' : ''}`}
        onPointerMove={() => i !== s.selected && s.setSelected(i)}
        onClick={() => s.run(r)}
      >
        <span className="spot-row__icon">
          <ResultIconView icon={r.icon} size={big ? 38 : 24} />
        </span>
        {big ? (
          <span className="spot-row__text">
            <span className="spot-row__title">{r.title}</span>
            <span className="spot-row__sub">{r.subtitle}</span>
          </span>
        ) : (
          <span className="spot-row__text spot-row__text--inline">
            <span className="spot-row__title">{r.title}</span>
            {r.subtitle && <span className="spot-row__sub"> — {r.subtitle}</span>}
          </span>
        )}
      </div>
    )
  }

  const hasResults = s.results.flat.length > 0
  return (
    <div className="spot-mac" onPointerDown={(e) => e.target === e.currentTarget && s.close()}>
      <div className="spot-mac__panel" role="dialog" aria-label="Spotlight Search">
        <div className="spot-mac__bar">
          <Search className="spot-mac__glass" size={22} strokeWidth={2.2} aria-hidden="true" />
          <input
            ref={inputRef}
            className="spot-mac__input"
            value={s.query}
            onChange={(e) => s.setQuery(e.target.value)}
            onKeyDown={s.onKeyDown}
            placeholder="Spotlight Search"
            aria-label="Spotlight Search"
            role="combobox"
            aria-expanded={hasResults}
            aria-controls="spot-mac-results"
            aria-activedescendant={hasResults ? `spot-opt-${s.selected}` : undefined}
            spellCheck={false}
            autoComplete="off"
          />
        </div>
        {hasResults && (
          <div className="spot-mac__results scroll" id="spot-mac-results" role="listbox" ref={listRef}>
            <MacGroups results={s.results} row={row} />
          </div>
        )}
      </div>
    </div>
  )
}

function MacGroups({ results, row }: { results: SearchResponse; row: (r: SearchResult, big?: boolean) => ReactNode }) {
  return (
    <>
      {results.askFirst && results.ask && (
        <section className="spot-group">
          <div className="spot-group__label">Ask Jignesh</div>
          {row(results.ask, true)}
        </section>
      )}
      {results.topHit && (
        <section className="spot-group">
          <div className="spot-group__label">Top Hit</div>
          {row(results.topHit, true)}
        </section>
      )}
      {!results.askFirst && results.ask && (
        <section className="spot-group">
          <div className="spot-group__label">Ask Jignesh</div>
          {row(results.ask)}
        </section>
      )}
      {results.groups.map((g) => (
        <section className="spot-group" key={g.id}>
          <div className="spot-group__label">{g.label}</div>
          {g.results.map((r) => row(r))}
        </section>
      ))}
    </>
  )
}

/* ────────────────────────────── iOS ────────────────────────────── */

const SUGGESTED_APPS: AppId[] = ['assistant', 'safari', 'mail', 'notes']

function IosSpotlight() {
  const s = useSpotlight('ios')
  const inputRef = useRef<HTMLInputElement>(null)
  const [closing, setClosing] = useState(false)

  useEffect(() => {
    const t = window.setTimeout(() => inputRef.current?.focus(), 60)
    return () => window.clearTimeout(t)
  }, [])

  const dismiss = () => {
    setClosing(true)
    window.setTimeout(s.close, 160)
  }

  const cell = (r: SearchResult, big = false) => (
    <button key={r.id} className={`spot-ios__cell${big ? ' spot-ios__cell--big' : ''}`} onClick={() => s.run(r)}>
      <span className="spot-ios__cell-icon">
        <ResultIconView icon={r.icon} size={big ? 46 : 32} />
      </span>
      <span className="spot-ios__cell-text">
        <span className="spot-ios__cell-title">{r.title}</span>
        {r.subtitle && <span className="spot-ios__cell-sub">{r.subtitle}</span>}
      </span>
    </button>
  )

  const empty = !s.query.trim()
  return (
    <div className={`spot-ios${closing ? ' spot-ios--closing' : ''}`} role="dialog" aria-label="Search">
      <div className="spot-ios__top">
        <label className="spot-ios__field">
          <Search size={17} strokeWidth={2.4} aria-hidden="true" />
          <input
            ref={inputRef}
            value={s.query}
            onChange={(e) => s.setQuery(e.target.value)}
            onKeyDown={s.onKeyDown}
            placeholder="Search"
            aria-label="Search"
            enterKeyHint="search"
            spellCheck={false}
            autoComplete="off"
          />
        </label>
        <button className="spot-ios__cancel" onClick={dismiss}>
          Cancel
        </button>
      </div>
      <div className="spot-ios__body scroll" onPointerDown={(e) => e.target === e.currentTarget && dismiss()}>
        {empty ? (
          <>
            <div className="spot-ios__label">Siri Suggestions</div>
            <div className="spot-ios__apps">
              {SUGGESTED_APPS.filter((id) => apps[id].home).map((id) => (
                <button key={id} className="spot-ios__app" onClick={() => (s.close(), launch(id))}>
                  <AppIcon id={apps[id].icon} size={58} />
                  <span>{appName(id, 'ios')}</span>
                </button>
              ))}
            </div>
            <div className="spot-ios__label">Ask Jignesh</div>
            <div className="spot-ios__section">
              {content.assistant.starters.slice(0, 4).map((q) => (
                <button key={q} className="spot-ios__cell" onClick={() => (s.close(), askJignesh(q))}>
                  <span className="spot-ios__cell-icon">
                    <AppIcon id="assistant" size={32} />
                  </span>
                  <span className="spot-ios__cell-text">
                    <span className="spot-ios__cell-title">{q}</span>
                  </span>
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            {(s.results.askFirst || s.results.topHit) && (
              <>
                <div className="spot-ios__label">{s.results.askFirst ? 'Ask Jignesh' : 'Top Hit'}</div>
                <div className="spot-ios__section">
                  {s.results.askFirst && s.results.ask ? cell(s.results.ask, true) : s.results.topHit && cell(s.results.topHit, true)}
                </div>
              </>
            )}
            {!s.results.askFirst && s.results.ask && (
              <>
                <div className="spot-ios__label">Ask Jignesh</div>
                <div className="spot-ios__section">{cell(s.results.ask)}</div>
              </>
            )}
            {s.results.groups.map((g) => (
              <div key={g.id}>
                <div className="spot-ios__label">{g.label}</div>
                <div className="spot-ios__section">{g.results.map((r) => cell(r))}</div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  )
}
