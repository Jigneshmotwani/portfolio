/**
 * Tiny, safe markdown renderer for notes: #/##/### headings, - or * bullets,
 * 1. numbered lists, paragraphs, **bold**, *italic* / _italic_, `code` and
 * [links](url). Produces React elements only (no innerHTML).
 */
import type { MouseEvent, ReactNode } from 'react'
import { composeMail, openUrl } from '../../lib/launch'

type Block =
  | { kind: 'h'; level: 1 | 2 | 3; text: string }
  | { kind: 'p'; text: string }
  | { kind: 'ul' | 'ol'; items: string[] }

export function parseBlocks(source: string): Block[] {
  const blocks: Block[] = []
  let para: string[] = []
  let list: { kind: 'ul' | 'ol'; items: string[] } | null = null
  const flushPara = () => {
    if (para.length) blocks.push({ kind: 'p', text: para.join(' ') })
    para = []
  }
  const flushList = () => {
    if (list) blocks.push(list)
    list = null
  }
  for (const raw of source.replace(/\r\n?/g, '\n').split('\n')) {
    const line = raw.trimEnd()
    const h = /^(#{1,3})\s+(.+)$/.exec(line)
    const ul = /^\s*[-*•]\s+(.+)$/.exec(line)
    const ol = /^\s*\d+[.)]\s+(.+)$/.exec(line)
    if (!line.trim()) {
      flushPara()
      flushList()
    } else if (h) {
      flushPara()
      flushList()
      blocks.push({ kind: 'h', level: h[1].length as 1 | 2 | 3, text: h[2] })
    } else if (ul || ol) {
      flushPara()
      const kind = ul ? 'ul' : 'ol'
      if (!list || list.kind !== kind) {
        flushList()
        list = { kind, items: [] }
      }
      list.items.push((ul ?? ol)![1])
    } else {
      flushList()
      para.push(line.trim())
    }
  }
  flushPara()
  flushList()
  return blocks
}

const INLINE = /(\*\*([^*]+)\*\*)|(`([^`]+)`)|(\[([^\]]+)\]\(([^)\s]+)\))|(\*([^*\s][^*]*)\*)|(_([^_\s][^_]*)_)/

function handleLink(e: MouseEvent, url: string) {
  if (e.metaKey || e.ctrlKey || e.shiftKey) return
  e.preventDefault()
  if (url.startsWith('mailto:')) composeMail({ to: url.slice(7) })
  else openUrl(url)
}

export function renderInline(text: string, keyPrefix = 'i'): ReactNode[] {
  const out: ReactNode[] = []
  let rest = text
  let i = 0
  while (rest) {
    const m = INLINE.exec(rest)
    if (!m) {
      out.push(rest)
      break
    }
    if (m.index > 0) out.push(rest.slice(0, m.index))
    const key = `${keyPrefix}-${i++}`
    if (m[1]) out.push(<strong key={key}>{renderInline(m[2], key)}</strong>)
    else if (m[3]) out.push(<code key={key}>{m[4]}</code>)
    else if (m[5]) {
      const url = m[7]
      const safe = /^(https?:|mailto:)/i.test(url)
      out.push(
        safe ? (
          <a key={key} href={url} target="_blank" rel="noopener noreferrer" onClick={(e) => handleLink(e, url)}>
            {renderInline(m[6], key)}
          </a>
        ) : (
          <span key={key}>{m[6]}</span>
        ),
      )
    } else if (m[8]) out.push(<em key={key}>{renderInline(m[9], key)}</em>)
    else if (m[10]) out.push(<em key={key}>{renderInline(m[11], key)}</em>)
    rest = rest.slice(m.index + m[0].length)
  }
  return out
}

export function Markdown({ source, className }: { source: string; className?: string }) {
  return (
    <div className={className}>
      {parseBlocks(source).map((b, i) => {
        const key = `b${i}`
        if (b.kind === 'h') {
          const Tag = (`h${b.level}` as 'h1' | 'h2' | 'h3')
          return <Tag key={key}>{renderInline(b.text, key)}</Tag>
        }
        if (b.kind === 'p') return <p key={key}>{renderInline(b.text, key)}</p>
        const List = b.kind
        return (
          <List key={key}>
            {b.items.map((item, j) => (
              <li key={j}>{renderInline(item, `${key}-${j}`)}</li>
            ))}
          </List>
        )
      })}
    </div>
  )
}

/** Plain-text preview: first body line without markdown, for list snippets. */
export function snippet(source: string, max = 90): string {
  const blocks = parseBlocks(source).filter((b) => b.kind !== 'h' || b.level > 1)
  const first = blocks.find((b) => b.kind !== 'h') ?? blocks[0]
  if (!first) return ''
  const text = first.kind === 'ul' || first.kind === 'ol' ? first.items.join(' · ') : first.text
  const plain = text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[*_`]/g, '')
    .trim()
  return plain.length > max ? `${plain.slice(0, max - 1).trimEnd()}…` : plain
}
