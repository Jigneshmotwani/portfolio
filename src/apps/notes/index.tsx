import { Folder, Share, SquarePen } from 'lucide-react'
import { useEffect, useMemo, useState, type KeyboardEvent } from 'react'
import { content } from '../../data/content'
import type { Note } from '../../data/types'
import { copyText, IOSGroup, IOSPage, IOSRow, SearchField, useFlash, useNavStack } from '../settings/kit'
import { useApp } from '../types'
import { Markdown, snippet } from './markdown'
import './Notes.css'

const NOTES = content.notes

function parseDate(d: string) {
  const [y, m, day] = d.split('-').map(Number)
  return new Date(y, (m || 1) - 1, day || 1)
}
const shortDate = (d: string) => parseDate(d).toLocaleDateString('en-GB')
const longDate = (d: string) => parseDate(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

function filterNotes(q: string): Note[] {
  const s = q.trim().toLowerCase()
  return s ? NOTES.filter((n) => `${n.title} ${n.body}`.toLowerCase().includes(s)) : NOTES
}

const noteById = (id: string | undefined) => NOTES.find((n) => n.id === id)

export default function NotesApp() {
  const { platform } = useApp()
  return platform === 'ios' ? <IOSNotes /> : <MacNotes />
}

function useShare(note: Note | undefined) {
  const [flash, setFlash] = useFlash()
  const share = async () => {
    if (!note) return
    const ok = await copyText(note.body)
    setFlash(ok ? 'Copied note' : 'Copy failed')
  }
  return { flash, share }
}

/* ── macOS ────────────────────────────────────────────────────────────── */

function MacNotes() {
  const { params, setTitle, active } = useApp()
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<string | undefined>(noteById(params?.note)?.id ?? NOTES[0]?.id)
  const list = useMemo(() => filterNotes(query), [query])
  const note = noteById(selected)
  const { flash, share } = useShare(note)

  useEffect(() => {
    if (noteById(params?.note)) {
      setSelected(params!.note)
      setQuery('')
    }
  }, [params?.nonce])

  useEffect(() => setTitle(note ? note.title : 'Notes'), [note, setTitle])

  const onListKey = (e: KeyboardEvent) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return
    e.preventDefault()
    const i = list.findIndex((n) => n.id === selected)
    const next = list[Math.min(list.length - 1, Math.max(0, i + (e.key === 'ArrowDown' ? 1 : -1)))]
    if (next) setSelected(next.id)
  }

  return (
    <div className={`notes-mac${active ? '' : ' is-inactive'}`}>
      <aside className="notes-folders">
        <div className="notes-folders__top" data-drag />
        <div className="notes-folders__heading">iCloud</div>
        <button type="button" className="notes-folder is-on" onClick={() => setQuery('')}>
          <Folder size={15} className="notes-folder__icon" aria-hidden />
          <span>Notes</span>
          <span className="notes-folder__count">{NOTES.length}</span>
        </button>
      </aside>
      <section className="notes-list" aria-label="Notes">
        <header className="notes-list__toolbar" data-drag>
          <div className="notes-list__title">
            <strong>Notes</strong>
            <span>{NOTES.length} notes</span>
          </div>
        </header>
        <div className="notes-list__search">
          <SearchField id="notes-search" value={query} onChange={setQuery} placeholder="Search" />
        </div>
        <div className="notes-list__items scroll" role="listbox" aria-label="Notes" tabIndex={0} onKeyDown={onListKey}>
          {list.map((n) => (
            <button
              key={n.id}
              type="button"
              role="option"
              aria-selected={n.id === selected}
              className={`notes-item${n.id === selected ? ' is-on' : ''}`}
              onClick={() => setSelected(n.id)}
            >
              <strong>{n.title}</strong>
              <span>
                <time>{shortDate(n.date)}</time> {snippet(n.body, 60)}
              </span>
            </button>
          ))}
          {!list.length && <p className="notes-list__empty">No notes match “{query}”.</p>}
        </div>
      </section>
      <main className="notes-editor">
        <header className="notes-editor__toolbar" data-drag>
          {flash && <span className="notes-flash">{flash}</span>}
          <button type="button" className="notes-tool" aria-label="Copy note text" title="Copy note text" onClick={share} disabled={!note}>
            <Share size={16} />
          </button>
          <button type="button" className="notes-tool" aria-label="New note (read-only)" title="These notes are read-only" disabled>
            <SquarePen size={16} />
          </button>
        </header>
        <div className="notes-editor__body scroll">
          {note ? (
            <article className="notes-paper">
              <p className="notes-paper__date">{longDate(note.date)}</p>
              <Markdown source={note.body} className="notes-md" />
            </article>
          ) : (
            <p className="notes-editor__empty">No note selected</p>
          )}
        </div>
      </main>
    </div>
  )
}

/* ── iOS ──────────────────────────────────────────────────────────────── */

const NOTES_TINT = '#e0a800'

function IOSNotes() {
  const { params } = useApp()
  const initial = noteById(params?.note)
  const nav = useNavStack(initial ? ['root', initial.id] : ['root'])
  const [query, setQuery] = useState('')
  const list = useMemo(() => filterNotes(query), [query])
  const current = nav.top === 'root' ? undefined : noteById(nav.top)
  const { flash, share } = useShare(current)

  useEffect(() => {
    if (noteById(params?.note)) nav.reset(['root', params!.note!])
  }, [params?.nonce])

  if (current) {
    return (
      <IOSPage
        key={current.id}
        dir={nav.dir}
        tone="plain"
        title=""
        large={false}
        tint={NOTES_TINT}
        back={{ label: 'Notes', onClick: nav.pop }}
        trailing={
          <button type="button" aria-label="Copy note text" onClick={share}>
            <Share size={21} />
          </button>
        }
      >
        <article className="notes-paper notes-paper--ios">
          <p className="notes-paper__date">{longDate(current.date)}</p>
          <Markdown source={current.body} className="notes-md" />
        </article>
        {flash && <div className="notes-toast">{flash}</div>}
      </IOSPage>
    )
  }

  return (
    <IOSPage
      key="root"
      dir={nav.dir}
      title="Notes"
      tint={NOTES_TINT}
      header={<SearchField platform="ios" value={query} onChange={setQuery} />}
      bottomBar={
        <>
          <span className="notes-iosbar__spacer" />
          <span className="notes-iosbar__count">{NOTES.length} Notes</span>
          <SquarePen size={22} className="notes-iosbar__compose" aria-label="Notes are read-only" />
        </>
      }
    >
      <IOSGroup header={query ? 'Results' : 'iCloud'}>
        {list.map((n) => (
          <IOSRow
            key={n.id}
            label={<strong className="notes-iosrow__title">{n.title}</strong>}
            detail={
              <>
                <span className="notes-iosrow__date">{shortDate(n.date)}</span> {snippet(n.body, 70)}
              </>
            }
            chevron={false}
            onClick={() => nav.push(n.id)}
          />
        ))}
        {!list.length && <IOSRow label={`No notes match “${query}”`} />}
      </IOSGroup>
    </IOSPage>
  )
}
