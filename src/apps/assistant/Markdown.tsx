import { Fragment, type ReactNode } from 'react'

/** Tiny, safe markdown for chat answers: paragraphs, bullets, **bold**, *italic*, `code`, [links](url). */
const SAFE_URL = /^(https?:|mailto:)/i

function inline(text: string, key: string): ReactNode[] {
  const out: ReactNode[] = []
  const re = /\*\*([^*]+)\*\*|\*([^*\s][^*]*)\*|`([^`]+)`|\[([^\]]+)\]\(([^)\s]+)\)|(https?:\/\/[^\s)]+)/g
  let last = 0
  let m: RegExpExecArray | null
  let i = 0
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index))
    const k = `${key}-${i++}`
    if (m[1] != null) out.push(<strong key={k}>{m[1]}</strong>)
    else if (m[2] != null) out.push(<em key={k}>{m[2]}</em>)
    else if (m[3] != null) out.push(<code key={k}>{m[3]}</code>)
    else if (m[4] != null) {
      const href = m[5]
      out.push(
        SAFE_URL.test(href) ? (
          <a key={k} href={href} target="_blank" rel="noopener noreferrer">
            {m[4]}
          </a>
        ) : (
          <Fragment key={k}>{m[4]}</Fragment>
        ),
      )
    } else if (m[6] != null) {
      out.push(
        <a key={k} href={m[6]} target="_blank" rel="noopener noreferrer">
          {m[6].replace(/^https?:\/\//, '')}
        </a>,
      )
    }
    last = re.lastIndex
  }
  if (last < text.length) out.push(text.slice(last))
  return out
}

export function Markdown({ text }: { text: string }) {
  const blocks: ReactNode[] = []
  const lines = text.split('\n')
  let para: string[] = []
  let list: string[] = []
  const flushPara = () => {
    if (para.length) blocks.push(<p key={`p${blocks.length}`}>{inline(para.join(' '), `p${blocks.length}`)}</p>)
    para = []
  }
  const flushList = () => {
    if (list.length)
      blocks.push(
        <ul key={`u${blocks.length}`}>
          {list.map((item, i) => (
            <li key={i}>{inline(item, `l${blocks.length}-${i}`)}</li>
          ))}
        </ul>,
      )
    list = []
  }
  for (const raw of lines) {
    const line = raw.trimEnd()
    const bullet = /^\s*(?:[-*•]|\d+[.)])\s+(.*)$/.exec(line)
    if (bullet) {
      flushPara()
      list.push(bullet[1])
    } else if (!line.trim()) {
      flushPara()
      flushList()
    } else {
      flushList()
      para.push(line.replace(/^#+\s*/, ''))
    }
  }
  flushPara()
  flushList()
  return <>{blocks}</>
}
