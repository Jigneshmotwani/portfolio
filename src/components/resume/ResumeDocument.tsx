import { content } from '../../data/content'
import type { Experience } from '../../data/types'
import { formatMonth, formatRange, hostOf } from '../../lib/format'
import { isTodo, real } from '../../lib/todo'
import './ResumeDocument.css'

/**
 * Plain one-page resume built from src/data/content.ts. Used by the
 * in-app overlay, the /resume/ page, Preview, and the PDF generator.
 * Placeholders ("TODO: ...") are never shown here.
 */

const STOP = new Set(
  'the and for with from that this into over your their them they have been were which while using used able about across through'.split(
    ' ',
  ),
)

function keywords(s: string): Set<string> {
  return new Set(
    s
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((w) => w.length > 3 && !STOP.has(w))
      .map((w) => w.replace(/s$/, '')),
  )
}

/** Summary first, then highlights that add something new; at most `max` bullets. */
function bulletsFor(exp: Experience, max = 3): string[] {
  const out: string[] = []
  const seen: Set<string>[] = []
  for (const line of [exp.summary, ...exp.highlights]) {
    if (!line || isTodo(line)) continue
    const words = keywords(line)
    const repeats = seen.some((prev) => {
      let shared = 0
      for (const w of words) if (prev.has(w)) shared++
      return words.size > 0 && shared / words.size >= 0.5
    })
    if (repeats) continue
    out.push(line)
    seen.push(words)
    if (out.length >= max) break
  }
  return out
}

/** "Singapore University of Technology and Design (SUTD)" → "SUTD" to keep rows on one line. */
function shortOrg(name: string): string {
  return /\(([A-Z][A-Za-z]{1,6})\)\s*$/.exec(name)?.[1] ?? name
}

function maxBullets(exp: Experience): number {
  return exp.type === 'Teaching' || exp.type === 'Research' ? 1 : 2
}

/** Skill items without parenthetical notes (those live under certifications). */
function plainSkill(item: string): string {
  return item.replace(/\s*\([^)]*\)/g, '')
}

function stripProtocol(url: string): string {
  return url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')
}

function yearRange(start: string, end: string): string {
  const s = start.slice(0, 4)
  const e = end.slice(0, 4)
  return s === e ? s : `${s} – ${e}`
}

export function ResumeDocument({ className = '' }: { className?: string }) {
  const { profile, contact, experience, education, projects, skills, credentials } = content

  const contactItems = [
    { label: contact.email, href: `mailto:${contact.email}` },
    { label: stripProtocol(contact.linkedin), href: contact.linkedin },
    { label: stripProtocol(contact.github), href: contact.github },
    contact.website ? { label: stripProtocol(contact.website), href: contact.website } : null,
    contact.phone && !isTodo(contact.phone) ? { label: contact.phone, href: `tel:${contact.phone.replace(/\s/g, '')}` } : null,
  ].filter((c): c is { label: string; href: string } => c !== null)

  const selectedProjects = projects.filter((p) => p.featured && p.links.github).slice(0, 4)
  const creds = credentials.filter((c) => !isTodo(c.name))

  return (
    <article className={`resume-doc ${className}`} aria-label={`${profile.name} resume`}>
      <header className="resume-doc__header">
        <div className="resume-doc__identity">
          <h1 className="resume-doc__name">{profile.name}</h1>
          <p className="resume-doc__headline">
            {profile.headline}
            <span className="resume-doc__dot" aria-hidden="true">
              ·
            </span>
            {profile.location}
          </p>
        </div>
        <ul className="resume-doc__contact">
          {contactItems.map((c) => (
            <li key={c.href}>
              <a href={c.href} target={c.href.startsWith('http') ? '_blank' : undefined} rel="noreferrer">
                {c.label}
              </a>
            </li>
          ))}
        </ul>
      </header>

      <p className="resume-doc__summary">{profile.tagline}</p>

      <section className="resume-doc__section">
        <h2>Experience</h2>
        <ol className="resume-doc__list">
          {experience.map((exp) => (
            <li key={exp.id} className="resume-doc__entry">
              <div className="resume-doc__row">
                <h3>
                  {exp.role}
                  <span className="resume-doc__org">
                    {shortOrg(exp.company)}
                    {exp.team ? `, ${exp.team}` : ''}
                  </span>
                </h3>
                <span className="resume-doc__date">{formatRange(exp.start, exp.end)}</span>
              </div>
              <ul className="resume-doc__bullets">
                {bulletsFor(exp, maxBullets(exp)).map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      </section>

      <section className="resume-doc__section">
        <h2>Selected projects</h2>
        <ul className="resume-doc__list resume-doc__projects">
          {selectedProjects.map((p) => (
            <li key={p.id} className="resume-doc__row">
              <h3>
                {p.name}
                <span className="resume-doc__org">{p.tagline}</span>
              </h3>
              {p.links.github && (
                <a className="resume-doc__date" href={p.links.github} target="_blank" rel="noreferrer">
                  GitHub/{p.links.github.replace(/\/$/, '').split('/').pop()}
                </a>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section className="resume-doc__section">
        <h2>Skills</h2>
        <dl className="resume-doc__skills">
          {skills.map((g) => (
            <div key={g.id} className="resume-doc__skill">
              <dt>{g.name}</dt>
              <dd>{real(g.items).map(plainSkill).join(', ')}</dd>
            </div>
          ))}
        </dl>
      </section>

      <div className="resume-doc__columns">
        <section className="resume-doc__section">
          <h2>Education</h2>
          <ul className="resume-doc__list">
            {education.map((ed) => (
              <li key={ed.id} className="resume-doc__entry resume-doc__entry--tight">
                <div className="resume-doc__row">
                  <h3>{shortOrg(ed.school)}</h3>
                  <span className="resume-doc__date">{yearRange(ed.start, ed.end)}</span>
                </div>
                <p>
                  {ed.degree}
                  {real(ed.details).length > 0 && ed.id !== 'sutd' ? ` · ${real(ed.details).join(' ')}` : ''}
                </p>
              </li>
            ))}
          </ul>
        </section>

        <section className="resume-doc__section">
          <h2>Certifications &amp; awards</h2>
          <ul className="resume-doc__list resume-doc__creds">
            {creds.map((c) => (
              <li key={c.id} className="resume-doc__row">
                <span>
                  {c.name}
                  {!isTodo(c.issuer) && !c.name.includes(c.issuer) && (
                    <span className="resume-doc__issuer">, {c.issuer}</span>
                  )}
                </span>
                {!isTodo(c.date) && <span className="resume-doc__date">{formatMonth(c.date)}</span>}
              </li>
            ))}
          </ul>
        </section>
      </div>

      <footer className="resume-doc__footer">
        Interactive portfolio: <a href={content.site.url}>{hostOf(content.site.url)}{new URL(content.site.url).pathname.replace(/\/$/, '')}</a>
      </footer>
    </article>
  )
}

export default ResumeDocument
