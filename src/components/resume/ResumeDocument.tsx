import { content } from '../../data/content'
import type { Credential, ResumeEntry } from '../../data/types'
import { formatRange } from '../../lib/format'
import { isTodo, real } from '../../lib/todo'
import './ResumeDocument.css'

/**
 * Plain one-page resume, laid out like public/resume.pdf. Which roles,
 * projects and bullets appear comes from `content.resume`; titles and dates
 * come from the matching experience / project / education entries.
 * Used by the in-app overlay, the /resume/ page and Preview.
 * Placeholders ("TODO: ...") are never shown here.
 */

function stripProtocol(url: string): string {
  return url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')
}

function pick<T extends { id: string }>(items: T[], entries: ResumeEntry[]) {
  return entries
    .map((entry) => ({ entry, item: items.find((i) => i.id === entry.id) }))
    .filter((x): x is { entry: ResumeEntry; item: T } => x.item !== undefined)
}

/** Renders **bold** spans from the resume bullets in content.ts. */
function Rich({ text }: { text: string }) {
  return (
    <>
      {text.split(/\*\*(.+?)\*\*/g).map((part, i) => (i % 2 ? <strong key={i}>{part}</strong> : part))}
    </>
  )
}

function Bullets({ items }: { items: string[] }) {
  const lines = real(items)
  if (!lines.length) return null
  return (
    <ul className="resume-doc__bullets">
      {lines.map((b) => (
        <li key={b}>
          <Rich text={b} />
        </li>
      ))}
    </ul>
  )
}

export function ResumeDocument({ className = '' }: { className?: string }) {
  const { profile, contact, experience, education, projects, credentials, resume } = content

  type ContactItem = { label: string; value: string; href: string }
  const present = (c: ContactItem | null): c is ContactItem => c !== null
  // Two lines, like the PDF: phone + email, then the profile links.
  const contactLines: ContactItem[][] = [
    [
      contact.phone && !isTodo(contact.phone) ? { label: 'Mobile', value: contact.phone, href: `tel:${contact.phone.replace(/\s/g, '')}` } : null,
      { label: 'Email', value: contact.email, href: `mailto:${contact.email}` },
    ].filter(present),
    [
      { label: 'LinkedIn', value: stripProtocol(contact.linkedin), href: contact.linkedin },
      { label: 'GitHub', value: stripProtocol(contact.github), href: contact.github },
      contact.website ? { label: 'Portfolio', value: stripProtocol(contact.website), href: contact.website } : null,
    ].filter(present),
  ]

  const certs = resume.certifications
    .map((id) => credentials.find((c) => c.id === id))
    .filter((c): c is Credential => c !== undefined && !isTodo(c.name))

  return (
    <article className={`resume-doc ${className}`} aria-label={`${profile.name} resume`}>
      <header className="resume-doc__header">
        <h1 className="resume-doc__name">{profile.name}</h1>
        {contactLines.map((line) => (
          <ul key={line[0].label} className="resume-doc__contact">
            {line.map((c) => (
              <li key={c.href}>
                <strong>{c.label}:</strong>{' '}
                <a href={c.href} target={c.href.startsWith('http') ? '_blank' : undefined} rel="noreferrer">
                  {c.value}
                </a>
              </li>
            ))}
          </ul>
        ))}
      </header>

      <section className="resume-doc__section">
        <h2>Education</h2>
        {pick(education, resume.education).map(({ entry, item }) => (
          <div key={item.id} className="resume-doc__entry">
            <div className="resume-doc__row">
              <h3>{entry.title ?? item.school}</h3>
              <span className="resume-doc__date">{formatRange(item.start, item.end)}</span>
            </div>
            <Bullets items={entry.bullets} />
          </div>
        ))}
      </section>

      <section className="resume-doc__section">
        <h2>Skills</h2>
        <ul className="resume-doc__skills">
          {resume.skills.map((s) => (
            <li key={s.label}>
              <strong>{s.label}:</strong> {s.items}
            </li>
          ))}
        </ul>
      </section>

      <section className="resume-doc__section">
        <h2>Work experience</h2>
        {pick(experience, resume.experience).map(({ entry, item }) => (
          <div key={item.id} className="resume-doc__entry">
            <div className="resume-doc__row">
              <h3>{entry.title ?? `${item.role}${item.team ? ` (${item.team})` : ''}, ${item.company}`}</h3>
              <span className="resume-doc__date">{formatRange(item.start, item.end)}</span>
            </div>
            <Bullets items={entry.bullets} />
          </div>
        ))}
      </section>

      <section className="resume-doc__section">
        <h2>Projects</h2>
        {pick(projects, resume.projects).map(({ entry, item }) => (
          <div key={item.id} className="resume-doc__entry">
            <div className="resume-doc__row">
              <h3>
                {entry.title ?? item.name}
                {item.links.github && (
                  <>
                    {' | '}
                    <a className="resume-doc__link" href={item.links.github} target="_blank" rel="noreferrer">
                      GitHub
                    </a>
                  </>
                )}
              </h3>
            </div>
            <Bullets items={entry.bullets} />
          </div>
        ))}
      </section>

      {certs.length > 0 && (
        <section className="resume-doc__section">
          <h2>Certifications</h2>
          <ul className="resume-doc__bullets">
            {certs.map((c) => (
              <li key={c.id}>
                <strong>{c.name}</strong>
                {c.url && (
                  <>
                    {' | '}
                    <a className="resume-doc__link" href={c.url} target="_blank" rel="noreferrer">
                      Credential
                    </a>
                  </>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  )
}

export default ResumeDocument
