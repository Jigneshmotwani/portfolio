import { ArrowUpRight, Code2, Globe, MessageCircle, Search } from 'lucide-react'
import { useEffect, useState } from 'react'
import { content } from '../../data/content'
import type { Project } from '../../data/types'
import { asset } from '../../lib/assets'
import { projectCoverUrl } from '../../lib/covers'
import { hostOf } from '../../lib/format'
import { askJignesh } from '../../lib/launch'
import { shown, T } from '../../lib/todo'
import { hostColor, projectFor, projectUrl, titleFor } from './url'

type Navigate = (url: string) => void

const STATUS_COLORS: Record<Project['status'], string> = {
  Active: 'var(--green)',
  Shipped: 'var(--blue)',
  Prototype: 'var(--orange)',
  Archived: 'var(--gray)',
}

export function projectImage(p: Project) {
  return p.screenshots?.length ? asset(p.screenshots[0]) : projectCoverUrl(p)
}

function ProjectCard({ project, navigate }: { project: Project; navigate: Navigate }) {
  return (
    <button className="safari-pcard" onClick={() => navigate(projectUrl(project))}>
      <img src={projectImage(project)} alt="" draggable={false} loading="lazy" />
      <span className="safari-pcard__text">
        <strong>{project.name}</strong>
        <span>{project.tagline}</span>
      </span>
    </button>
  )
}

export function StartPage({ navigate }: { navigate: Navigate }) {
  const cb = content.currentlyBuilding
  const featured = content.projects.filter((p) => p.featured)
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
  return (
    <div className="safari-page safari-start">
      <div className="safari-start__inner">
        <h1 className="safari-start__hello">{greeting}</h1>
        <p className="safari-start__sub">Welcome to {content.profile.firstName}’s corner of the web.</p>

        <section className="safari-section">
          <h2>Favourites</h2>
          <div className="safari-favs">
            {content.bookmarks.map((b) => (
              <button key={b.url} className="safari-fav" onClick={() => navigate(b.url)} title={b.url}>
                <span className="safari-fav__tile" style={{ background: b.color ?? hostColor(hostOf(b.url)) }}>
                  {b.glyph ?? b.title[0]}
                </span>
                <span className="safari-fav__label">{b.title}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="safari-section">
          <div className="safari-section__head">
            <h2>Projects</h2>
            <button className="safari-link" onClick={() => navigate('jignesh://projects')}>
              Show all
            </button>
          </div>
          <div className="safari-pgrid">
            {featured.map((p) => (
              <ProjectCard key={p.id} project={p} navigate={navigate} />
            ))}
          </div>
        </section>

        <section className="safari-section">
          <h2>Currently building</h2>
          <div className="safari-now">
            <div className="safari-now__text">
              <strong>{cb.title}</strong>
              <p>{cb.description}</p>
              <div className="safari-chips">
                {cb.stack.map((s) => (
                  <span key={s} className="safari-chip">
                    {s}
                  </span>
                ))}
              </div>
            </div>
            {cb.link && (
              <a className="btn btn--primary btn--lg safari-now__btn" href={cb.link} target="_blank" rel="noopener noreferrer">
                Follow along <ArrowUpRight size={15} />
              </a>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}

export function ProjectsIndex({ navigate }: { navigate: Navigate }) {
  return (
    <div className="safari-page safari-doc">
      <div className="safari-doc__inner">
        <p className="safari-eyebrow">jignesh://projects</p>
        <h1 className="safari-doc__title">Projects</h1>
        <p className="safari-doc__lede">
          {content.projects.length} things {content.profile.firstName} has built, from hackathon prototypes to systems he still works on.
        </p>
        <div className="safari-pgrid safari-pgrid--wide">
          {content.projects.map((p) => (
            <ProjectCard key={p.id} project={p} navigate={navigate} />
          ))}
        </div>
      </div>
    </div>
  )
}

export function ProjectPage({ project: p, navigate }: { project: Project; navigate: Navigate }) {
  const others = content.projects.filter((o) => o.id !== p.id && o.featured).slice(0, 3)
  return (
    <div className="safari-page safari-doc">
      <article className="safari-doc__inner">
        <button className="safari-link safari-back" onClick={() => navigate('jignesh://projects')}>
          ← All projects
        </button>
        <img className="safari-hero" src={projectImage(p)} alt={`${p.name} cover`} draggable={false} />
        <div className="safari-meta">
          <span className="safari-status" style={{ color: STATUS_COLORS[p.status] }}>
            <i style={{ background: STATUS_COLORS[p.status] }} />
            {p.status}
          </span>
          <span>{p.context}</span>
          <span>{p.year}</span>
          {p.role && <span>{p.role}</span>}
        </div>
        <h1 className="safari-doc__title">{p.name}</h1>
        <p className="safari-doc__lede">{p.tagline}</p>
        <div className="safari-actions">
          {p.links.github && (
            <a className="btn btn--lg btn--primary" href={p.links.github} target="_blank" rel="noopener noreferrer">
              <Code2 size={15} /> View source
            </a>
          )}
          {p.links.demo &&
            (p.embeddable ? (
              <button className="btn btn--lg" onClick={() => navigate(p.links.demo!)}>
                <Globe size={15} /> Live demo
              </button>
            ) : (
              <a className="btn btn--lg" href={p.links.demo} target="_blank" rel="noopener noreferrer">
                <Globe size={15} /> Live demo
              </a>
            ))}
          {p.links.article && (
            <a className="btn btn--lg" href={p.links.article} target="_blank" rel="noopener noreferrer">
              Read more <ArrowUpRight size={15} />
            </a>
          )}
          <button className="btn btn--lg" onClick={() => askJignesh(`Tell me about ${p.name}`)}>
            <MessageCircle size={15} /> Ask about it
          </button>
        </div>
        <p className="safari-doc__body">{p.description}</p>
        {shown(p.highlights).length > 0 && (
          <>
            <h2>Highlights</h2>
            <ul className="safari-list">
              {shown(p.highlights).map((h) => (
                <li key={h}>
                  <T>{h}</T>
                </li>
              ))}
            </ul>
          </>
        )}
        <h2>Built with</h2>
        <div className="safari-chips">
          {p.tech.map((t) => (
            <span key={t} className="safari-chip">
              {t}
            </span>
          ))}
        </div>
        {others.length > 0 && (
          <>
            <h2>More projects</h2>
            <div className="safari-pgrid">
              {others.map((o) => (
                <ProjectCard key={o.id} project={o} navigate={navigate} />
              ))}
            </div>
          </>
        )}
      </article>
    </div>
  )
}

export function SearchPage({ query, navigate }: { query: string; navigate: Navigate }) {
  const q = query.toLowerCase()
  const words = q.split(/\s+/).filter(Boolean)
  const hit = (s: string) => words.every((w) => s.toLowerCase().includes(w))
  const projects = content.projects.filter((p) => hit([p.name, p.tagline, p.description, ...p.tech, ...p.tags, p.context].join(' ')))
  const bookmarks = content.bookmarks.filter((b) => hit(`${b.title} ${b.url}`))
  return (
    <div className="safari-page safari-doc">
      <div className="safari-doc__inner">
        <p className="safari-eyebrow">
          <Search size={13} /> Search results
        </p>
        <h1 className="safari-doc__title">“{query}”</h1>
        {projects.length + bookmarks.length === 0 ? (
          <p className="safari-doc__lede">Nothing on this site matches. This browser only searches Jignesh’s portfolio.</p>
        ) : (
          <p className="safari-doc__lede">
            {projects.length + bookmarks.length} result{projects.length + bookmarks.length === 1 ? '' : 's'} on this site.
          </p>
        )}
        <div className="safari-actions">
          <button className="btn btn--lg btn--primary" onClick={() => askJignesh(query)}>
            <MessageCircle size={15} /> Ask Jignesh: {query}
          </button>
        </div>
        {projects.length > 0 && (
          <div className="safari-pgrid safari-pgrid--wide">
            {projects.map((p) => (
              <ProjectCard key={p.id} project={p} navigate={navigate} />
            ))}
          </div>
        )}
        {bookmarks.length > 0 && (
          <ul className="safari-results">
            {bookmarks.map((b) => (
              <li key={b.url}>
                <button className="safari-link" onClick={() => navigate(b.url)}>
                  {b.title}
                </button>
                <span>{hostOf(b.url)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

export function MissingPage({ url, navigate }: { url: string; navigate: Navigate }) {
  return (
    <div className="safari-page safari-center">
      <div className="safari-card">
        <h1>Safari can’t find this page</h1>
        <p>
          <code>{url}</code> doesn’t exist on this site.
        </p>
        <button className="btn btn--lg btn--primary" onClick={() => navigate('jignesh://start')}>
          Go to Start Page
        </button>
      </div>
    </div>
  )
}

/** An external page: framed when the host allows it, otherwise a fallback card. */
export function WebPage({ url, frameable, reloadKey, navigate }: { url: string; frameable: boolean; reloadKey: number; navigate: Navigate }) {
  const [state, setState] = useState<'loading' | 'loaded' | 'slow'>('loading')
  useEffect(() => {
    setState('loading')
    const t = window.setTimeout(() => setState((s) => (s === 'loading' ? 'slow' : s)), 7000)
    return () => window.clearTimeout(t)
  }, [url, reloadKey])

  if (!frameable) return <FallbackCard url={url} navigate={navigate} />
  return (
    <div className="safari-web">
      <iframe
        key={reloadKey}
        src={url}
        title={titleFor(url)}
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
        referrerPolicy="no-referrer"
        onLoad={() => setState('loaded')}
      />
      {state !== 'loaded' && (
        <div className={`safari-web__overlay${state === 'slow' ? ' is-slow' : ''}`}>
          {state === 'loading' ? (
            <div className="spinner" />
          ) : (
            <div className="safari-card">
              <h1>This page is taking a while</h1>
              <p>
                <strong>{hostOf(url)}</strong> may not allow being shown inside another page.
              </p>
              <a className="btn btn--lg btn--primary" href={url} target="_blank" rel="noopener noreferrer">
                Open in new tab <ArrowUpRight size={15} />
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function FallbackCard({ url, navigate }: { url: string; navigate: Navigate }) {
  const host = hostOf(url)
  const project = projectFor(url)
  const title = titleFor(url)
  const initial = host === 'linkedin.com' ? 'in' : host === 'github.com' ? 'GH' : host.replace(/^www\./, '')[0]?.toUpperCase()
  const color = content.bookmarks.find((b) => hostOf(b.url) === host)?.color ?? hostColor(host)
  return (
    <div className="safari-page safari-center">
      <div className="safari-card safari-fallback">
        <span className="safari-fallback__tile" style={{ background: color }}>
          {initial}
        </span>
        <h1>{title}</h1>
        <p className="safari-fallback__url">{url.replace(/^https?:\/\//, '')}</p>
        <p>
          {host} doesn’t allow its pages to be shown inside other websites, so this one opens in a real browser tab instead.
        </p>
        <a className="btn btn--lg btn--primary" href={url} target="_blank" rel="noopener noreferrer">
          Open {host} <ArrowUpRight size={15} />
        </a>
        {project && (
          <div className="safari-fallback__project">
            <img src={projectImage(project)} alt="" />
            <div>
              <strong>{project.name}</strong>
              <span>{project.tagline}</span>
            </div>
            <button className="btn" onClick={() => navigate(projectUrl(project))}>
              Project page
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

