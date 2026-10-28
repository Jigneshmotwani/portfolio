import { Award, ChevronLeft, Download, ExternalLink, Globe, Link as LinkIcon } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { ResumeDocument } from '../../components/resume/ResumeDocument'
import { appIconUrl } from '../../assets/icons'
import { content } from '../../data/content'
import type { Credential, Education, Experience, Project } from '../../data/types'
import { getNode, nodeItem, nodeText, shortName, type VfsNode } from '../../data/vfs'
import { asset } from '../../lib/assets'
import { projectCoverUrl } from '../../lib/covers'
import { formatDuration, formatMonth, formatRange, hostOf } from '../../lib/format'
import { launch, openUrl } from '../../lib/launch'
import { shown, T } from '../../lib/todo'
import { apps } from '../registry'
import { useApp } from '../types'
import './Preview.css'

const DEFAULT_PATH = '/Resume/Jignesh_Motwani_Resume.pdf'

/** Preview / Quick Look: renders any file from the virtual file system. */
export default function Preview() {
  const { params, platform, setTitle } = useApp()
  const node = getNode(params?.path ?? DEFAULT_PATH)
  const title = node?.label ?? 'Preview'
  useEffect(() => setTitle(title), [title, setTitle])

  const ios = platform === 'ios'
  const actions = node ? <Actions node={node} ios={ios} /> : null

  return (
    <div className={`preview preview--${platform}`}>
      {ios ? (
        <header className="preview__iosbar">
          <button className="preview__iosback" onClick={() => launch('finder')}>
            <ChevronLeft size={24} strokeWidth={2.4} aria-hidden="true" />
            Files
          </button>
          <span className="preview__iostitle">{title}</span>
          <span className="preview__iosactions">{actions}</span>
        </header>
      ) : (
        actions && <div className="preview__toolbar">{actions}</div>
      )}
      <div className="preview__body scroll">{node ? <Body node={node} ios={ios} /> : <p className="preview__missing">This file couldn't be found.</p>}</div>
    </div>
  )
}

function Body({ node, ios }: { node: VfsNode; ios: boolean }) {
  if (node.kind === 'pdf') return <PdfView ios={ios} />
  if (node.ref?.type === 'app') return <AppView node={node} />
  const ref = nodeItem(node)
  if (ref?.type === 'project' && ref.item) return <ProjectView p={ref.item} />
  if (ref?.type === 'experience' && ref.item) return <JobView e={ref.item} />
  if (ref?.type === 'education' && ref.item) return <EducationView ed={ref.item} />
  if (ref?.type === 'credential' && ref.item) return <CredentialView c={ref.item} />
  return <pre className="preview__text">{nodeText(node) ?? 'No preview available.'}</pre>
}

/* ───────────── toolbar actions ───────────── */

function Actions({ node, ios }: { node: VfsNode; ios: boolean }) {
  const size = ios ? 20 : 15
  if (node.kind === 'pdf') {
    const pdf = asset(content.site.resumePdf)
    return (
      <>
        <a className="preview__action" href={pdf} target="_blank" rel="noreferrer" title="Open PDF in a new tab">
          <ExternalLink size={size} />
          {!ios && <span>Open PDF</span>}
        </a>
        <a className="preview__action" href={pdf} download="Jignesh_Motwani_Resume.pdf" title="Download PDF">
          <Download size={size} />
          {!ios && <span>Download</span>}
        </a>
      </>
    )
  }
  const ref = nodeItem(node)
  if (ref?.type === 'project' && ref.item) {
    const p = ref.item
    return (
      <>
        <button className="preview__action" onClick={() => openUrl(`jignesh://projects/${p.id}`)} title="Open project page in Safari">
          <Globe size={size} />
          {!ios && <span>Project page</span>}
        </button>
        {p.links.github && (
          <button className="preview__action" onClick={() => openUrl(p.links.github!)} title="View on GitHub">
            <LinkIcon size={size} />
            {!ios && <span>GitHub</span>}
          </button>
        )}
      </>
    )
  }
  return null
}

/* ───────────── PDF ───────────── */

function PdfView({ ios }: { ios: boolean }) {
  const pdf = asset(content.site.resumePdf)
  const [mode, setMode] = useState<'pdf' | 'web'>(ios ? 'web' : 'pdf')
  const [available, setAvailable] = useState<boolean | null>(ios ? false : null)

  useEffect(() => {
    if (ios) return
    let alive = true
    fetch(pdf, { method: 'HEAD' })
      .then((r) => alive && setAvailable(r.ok && !(r.headers.get('content-type') ?? '').includes('text/html')))
      .catch(() => alive && setAvailable(false))
    return () => {
      alive = false
    }
  }, [pdf, ios])

  const showPdf = mode === 'pdf' && available === true
  return (
    <div className="preview__pdf">
      {!ios && (
        <div className="preview__seg" role="group" aria-label="Resume format">
          <button className={mode === 'pdf' ? 'is-on' : ''} onClick={() => setMode('pdf')} aria-pressed={mode === 'pdf'}>
            PDF
          </button>
          <button className={mode === 'web' ? 'is-on' : ''} onClick={() => setMode('web')} aria-pressed={mode === 'web'}>
            Web
          </button>
        </div>
      )}
      {mode === 'pdf' && available === null && (
        <div className="preview__loading">
          <div className="spinner" />
        </div>
      )}
      {showPdf ? (
        <iframe className="preview__frame" src={`${pdf}#view=FitH&toolbar=1`} title="Jignesh Motwani resume (PDF)" />
      ) : (
        (mode === 'web' || available === false) && (
          <div className="preview__paper">
            {mode === 'pdf' && available === false && <p className="preview__note">The PDF can't be shown here, so this is the web version.</p>}
            <ResumeDocument />
          </div>
        )
      )}
    </div>
  )
}

/* ───────────── documents ───────────── */

function Chips({ items }: { items: string[] }) {
  if (!items.length) return null
  return (
    <ul className="preview__chips">
      {items.map((t) => (
        <li key={t} className="chip">
          {t}
        </li>
      ))}
    </ul>
  )
}

function Bullets({ items }: { items: string[] }) {
  const list = shown(items)
  if (!list.length) return null
  return (
    <ul className="preview__bullets">
      {list.map((h) => (
        <li key={h}>
          <T>{h}</T>
        </li>
      ))}
    </ul>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="preview__section">
      <h2>{title}</h2>
      {children}
    </section>
  )
}

const STATUS_COLOR: Record<Project['status'], string> = {
  Active: 'var(--green)',
  Shipped: 'var(--blue)',
  Prototype: 'var(--orange)',
  Archived: 'var(--gray)',
}

function ProjectView({ p }: { p: Project }) {
  const shots = p.screenshots ?? []
  return (
    <article className="preview__doc">
      <img className="preview__cover" src={shots.length ? asset(shots[0]) : projectCoverUrl(p)} alt={`${p.name} cover`} />
      <header className="preview__head">
        <h1>{p.name}</h1>
        <p className="preview__sub">{p.tagline}</p>
        <div className="preview__meta">
          <span className="chip">
            <i className="preview__dot" style={{ background: STATUS_COLOR[p.status] }} />
            {p.status}
          </span>
          <span className="chip">{p.year}</span>
          <span className="chip">{p.context}</span>
          {p.role && <span className="chip">{p.role}</span>}
        </div>
      </header>
      <p className="preview__lead">{p.description}</p>
      <Section title="Highlights">
        <Bullets items={p.highlights} />
      </Section>
      <Section title="Built with">
        <Chips items={p.tech} />
      </Section>
      {shots.length > 1 && (
        <Section title="Screenshots">
          <div className="preview__shots">
            {shots.slice(1).map((s) => (
              <img key={s} src={asset(s)} alt={`${p.name} screenshot`} />
            ))}
          </div>
        </Section>
      )}
      <div className="preview__buttons">
        <button className="btn btn--primary btn--lg" onClick={() => openUrl(`jignesh://projects/${p.id}`)}>
          <Globe size={15} /> Project page
        </button>
        {p.links.github && (
          <button className="btn btn--lg" onClick={() => openUrl(p.links.github!)}>
            <LinkIcon size={15} /> View on GitHub
          </button>
        )}
        {p.links.demo && (
          <button className="btn btn--lg" onClick={() => openUrl(p.links.demo!)}>
            <ExternalLink size={15} /> Open demo
          </button>
        )}
      </div>
    </article>
  )
}

function initials(name: string) {
  const words = shortName(name).split(/\s+/).filter(Boolean)
  if (words.length === 1) return words[0].length <= 4 && words[0] === words[0].toUpperCase() ? words[0] : words[0].slice(0, 2)
  return words
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
}

function Monogram({ name, color, logo }: { name: string; color: string; logo?: string }) {
  if (logo) return <img className="preview__mono preview__mono--img" src={asset(logo)} alt="" />
  const text = initials(name)
  return (
    <span className="preview__mono" style={{ background: color, fontSize: text.length > 2 ? 15 : 22 }} aria-hidden="true">
      {text}
    </span>
  )
}

function JobView({ e }: { e: Experience }) {
  return (
    <article className="preview__doc preview__doc--narrow">
      <header className="preview__head preview__head--row">
        <Monogram name={e.company} color={e.color} logo={e.logo} />
        <div>
          <h1>{e.role}</h1>
          <p className="preview__sub">
            {e.company}
            {e.team ? ` · ${e.team}` : ''}
          </p>
          <p className="preview__dates">
            {formatRange(e.start, e.end)} · {formatDuration(e.start, e.end)}
            {e.location ? ` · ${e.location}` : ''}
            {e.type ? ` · ${e.type}` : ''}
          </p>
        </div>
      </header>
      <p className="preview__lead">
        <T>{e.summary}</T>
      </p>
      {shown(e.highlights).length > 0 && (
        <Section title="Highlights">
          <Bullets items={e.highlights} />
        </Section>
      )}
      {e.tech.length > 0 && (
        <Section title="Tech">
          <Chips items={e.tech} />
        </Section>
      )}
    </article>
  )
}

function EducationView({ ed }: { ed: Education }) {
  return (
    <article className="preview__doc preview__doc--narrow">
      <header className="preview__head preview__head--row">
        <Monogram name={ed.school} color={ed.color} />
        <div>
          <h1>{ed.school}</h1>
          <p className="preview__sub">{ed.degree}</p>
          <p className="preview__dates">
            {formatMonth(ed.start)} – {formatMonth(ed.end)} · {ed.location}
          </p>
        </div>
      </header>
      {shown(ed.details).length > 0 && (
        <Section title="Details">
          <Bullets items={ed.details} />
        </Section>
      )}
    </article>
  )
}

function CredentialView({ c }: { c: Credential }) {
  return (
    <article className="preview__cert">
      <div className="preview__cert-inner">
        <span className="preview__cert-seal" aria-hidden="true">
          <Award size={34} strokeWidth={1.8} />
        </span>
        <p className="preview__cert-kind">{c.kind}</p>
        <h1>{c.name}</h1>
        <p className="preview__cert-issuer">
          <T fallback="Issuer not listed">{c.issuer}</T>
        </p>
        <p className="preview__cert-date">
          <T>{c.date}</T>
        </p>
        {c.description && (
          <p className="preview__cert-desc">
            <T>{c.description}</T>
          </p>
        )}
        {c.url && (
          <button className="btn btn--primary btn--lg" onClick={() => openUrl(c.url!)}>
            <ExternalLink size={15} /> View credential ({hostOf(c.url)})
          </button>
        )}
      </div>
    </article>
  )
}

function AppView({ node }: { node: VfsNode }) {
  if (node.ref?.type !== 'app') return null
  const id = node.ref.id
  const def = apps[id]
  return (
    <div className="preview__app">
      <img src={appIconUrl(def.icon)} alt="" width={96} height={96} />
      <h1>{def.name}</h1>
      <p>{def.description}</p>
      <button className="btn btn--primary btn--lg" onClick={() => launch(id)}>
        Open {def.name}
      </button>
    </div>
  )
}
