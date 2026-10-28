import { Copy, Download, GitBranch, Globe, Mail, MapPin, MessageCircle, Phone, Share } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { content } from '../../data/content'
import { asset } from '../../lib/assets'
import { hostOf } from '../../lib/format'
import { composeMail } from '../../lib/launch'
import { isTodo, T } from '../../lib/todo'
import { copyText, downloadText, IOSGroup, IOSPage, IOSRow, SearchField, useFlash, useNavStack } from '../settings/kit'
import { useApp } from '../types'
import './Contacts.css'

const { profile, contact } = content
const lastName = profile.name.split(' ').slice(1).join(' ') || profile.name

/** LinkedIn-style "in" glyph (brand icons are not bundled). */
function InGlyph({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      <rect x="2" y="2" width="20" height="20" rx="4" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M7.5 10.5v6M7.5 7.4v.2M11.5 16.5v-6M11.5 13c0-1.6 1-2.6 2.4-2.6s2.1.9 2.1 2.6v3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

interface Field {
  id: string
  label: string
  value: string
  href?: string
  icon: ReactNode
  onClick?: () => void
}

function fields(): Field[] {
  const list: Field[] = [
    { id: 'email', label: 'email', value: contact.email, icon: <Mail size={14} />, onClick: () => composeMail({ to: contact.email }) },
    { id: 'linkedin', label: 'LinkedIn', value: hostOf(contact.linkedin) + new URL(contact.linkedin).pathname.replace(/\/$/, ''), href: contact.linkedin, icon: <InGlyph size={14} /> },
    { id: 'github', label: 'GitHub', value: hostOf(contact.github) + new URL(contact.github).pathname, href: contact.github, icon: <GitBranch size={14} /> },
  ]
  if (contact.website) list.push({ id: 'website', label: 'homepage', value: hostOf(contact.website) + new URL(contact.website).pathname.replace(/\/$/, ''), href: contact.website, icon: <Globe size={14} /> })
  if (contact.phone) list.push({ id: 'phone', label: 'mobile', value: contact.phone, href: `tel:${contact.phone.replace(/\s+/g, '')}`, icon: <Phone size={14} /> })
  list.push({ id: 'location', label: 'location', value: profile.location, icon: <MapPin size={14} /> })
  return list
}

const vcfEscape = (s: string) => s.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/([,;])/g, '\\$1')

export function buildVCard(): string {
  const lines = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `N:${vcfEscape(lastName)};${vcfEscape(profile.firstName)};;;`,
    `FN:${vcfEscape(profile.name)}`,
    `TITLE:${vcfEscape(profile.headline)}`,
    `EMAIL;TYPE=INTERNET,PREF:${contact.email}`,
    contact.phone ? `TEL;TYPE=CELL:${contact.phone}` : '',
    `URL;TYPE=LinkedIn:${contact.linkedin}`,
    `URL;TYPE=GitHub:${contact.github}`,
    contact.website ? `URL;TYPE=Homepage:${contact.website}` : '',
    `ADR;TYPE=WORK:;;;${vcfEscape(profile.location)};;;`,
    `NOTE:${vcfEscape(profile.tagline)}`,
    'END:VCARD',
  ]
  return lines.filter(Boolean).join('\r\n') + '\r\n'
}

function useCardActions() {
  const [flash, setFlash] = useFlash()
  return {
    flash,
    downloadVCard: () => {
      downloadText(`${profile.name.replace(/\s+/g, '_')}.vcf`, buildVCard(), 'text/vcard')
      setFlash('vCard downloaded')
    },
    copyEmail: async () => setFlash((await copyText(contact.email)) ? 'Email copied' : 'Copy failed: select the address instead'),
  }
}

const ACTIONS: { id: string; label: string; icon: ReactNode; href?: string; onClick?: () => void }[] = [
  { id: 'message', label: 'message', icon: <MessageCircle size={16} />, onClick: () => composeMail({ to: contact.email }) },
  { id: 'mail', label: 'mail', icon: <Mail size={16} />, onClick: () => composeMail({ to: contact.email }) },
  { id: 'linkedin', label: 'LinkedIn', icon: <InGlyph size={16} />, href: contact.linkedin },
  { id: 'github', label: 'GitHub', icon: <GitBranch size={16} />, href: contact.github },
]

function ActionButton({ a, className }: { a: (typeof ACTIONS)[number]; className: string }) {
  const inner = (
    <>
      <span className={`${className}__circle`}>{a.icon}</span>
      <span className={`${className}__label`}>{a.label}</span>
    </>
  )
  return a.href ? (
    <a className={className} href={a.href} target="_blank" rel="noopener noreferrer">
      {inner}
    </a>
  ) : (
    <button type="button" className={className} onClick={a.onClick}>
      {inner}
    </button>
  )
}

function FieldValue({ f, className }: { f: Field; className?: string }) {
  if (f.href)
    return (
      <a className={className} href={f.href} target="_blank" rel="noopener noreferrer">
        {f.value}
      </a>
    )
  if (f.onClick)
    return (
      <button type="button" className={className} onClick={f.onClick}>
        {f.value}
      </button>
    )
  return <span className={className}>{f.value}</span>
}

const noteLines = [profile.tagline, profile.openTo].filter((s) => s && (!isTodo(s) || content.site.showPlaceholders))

export default function ContactsApp() {
  const { platform } = useApp()
  return platform === 'ios' ? <IOSContacts /> : <MacContacts />
}

/* ── macOS ────────────────────────────────────────────────────────────── */

function MacContacts() {
  const { active } = useApp()
  const [query, setQuery] = useState('')
  const visible = !query.trim() || `${profile.name} ${contact.email} ${profile.headline}`.toLowerCase().includes(query.trim().toLowerCase())
  const { flash, downloadVCard, copyEmail } = useCardActions()

  return (
    <div className={`contacts-mac${active ? '' : ' is-inactive'}`}>
      <aside className="contacts-sidebar">
        <div className="contacts-sidebar__top" data-drag />
        <div className="contacts-sidebar__search">
          <SearchField id="contacts-search" value={query} onChange={setQuery} />
        </div>
        <div className="contacts-sidebar__heading">All Contacts</div>
        {visible ? (
          <>
            <div className="contacts-sidebar__letter">{lastName[0]}</div>
            <button type="button" className="contacts-sidebar__row is-on">
              <span>
                {profile.firstName} <strong>{lastName}</strong>
              </span>
            </button>
          </>
        ) : (
          <p className="contacts-sidebar__empty">No results</p>
        )}
      </aside>
      <main className="contacts-main">
        <header className="contacts-toolbar" data-drag>
          {flash && <span className="contacts-flash">{flash}</span>}
          <button type="button" className="contacts-tool" title="Download vCard" aria-label="Download vCard" onClick={downloadVCard}>
            <Share size={15} />
          </button>
        </header>
        {visible && (
          <div className="contacts-card scroll">
            <div className="contacts-card__head">
              <img className="contacts-card__photo" src={asset(profile.photo)} alt={profile.name} draggable={false} />
              <div>
                <h1 className="contacts-card__name">{profile.name}</h1>
                <p className="contacts-card__headline">{profile.headline}</p>
                <p className="contacts-card__loc">{profile.location}</p>
              </div>
            </div>
            <div className="contacts-actions">
              {ACTIONS.map((a) => (
                <ActionButton key={a.id} a={a} className="contacts-action" />
              ))}
            </div>
            <dl className="contacts-fields">
              {fields().map((f) => (
                <div key={f.id} className="contacts-field">
                  <dt>{f.label}</dt>
                  <dd>
                    <FieldValue f={f} className="contacts-field__value" />
                  </dd>
                </div>
              ))}
              {noteLines.length > 0 && (
                <div className="contacts-field">
                  <dt>note</dt>
                  <dd className="contacts-field__note">
                    {noteLines.map((n) => (
                      <p key={n}>
                        <T>{n}</T>
                      </p>
                    ))}
                  </dd>
                </div>
              )}
            </dl>
            <div className="contacts-card__footer">
              <button type="button" className="btn" onClick={downloadVCard}>
                <Download size={13} /> Download vCard
              </button>
              <button type="button" className="btn" onClick={copyEmail}>
                <Copy size={13} /> Copy email
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

/* ── iOS ──────────────────────────────────────────────────────────────── */

function IOSContacts() {
  const nav = useNavStack(['list', 'card'])
  const [query, setQuery] = useState('')
  const { flash, downloadVCard, copyEmail } = useCardActions()
  const visible = !query.trim() || profile.name.toLowerCase().includes(query.trim().toLowerCase())

  if (nav.top === 'card') {
    return (
      <IOSPage key="card" dir={nav.dir} title="" large={false} back={{ label: 'Contacts', onClick: nav.pop }}>
        <div className="contacts-ioshead">
          <img className="contacts-ioshead__photo" src={asset(profile.photo)} alt={profile.name} draggable={false} />
          <h1 className="contacts-ioshead__name">{profile.name}</h1>
          <p className="contacts-ioshead__headline">{profile.headline}</p>
        </div>
        <div className="contacts-iosactions">
          {ACTIONS.map((a) => (
            <ActionButton key={a.id} a={a} className="contacts-iosaction" />
          ))}
        </div>
        {fields().map((f) => (
          <IOSGroup key={f.id}>
            <div className="contacts-iosfield">
              <span className="contacts-iosfield__label">{f.label}</span>
              <FieldValue f={f} className={`contacts-iosfield__value${f.href || f.onClick ? ' is-link' : ''}`} />
            </div>
          </IOSGroup>
        ))}
        {noteLines.length > 0 && (
          <IOSGroup>
            <div className="contacts-iosfield">
              <span className="contacts-iosfield__label">notes</span>
              {noteLines.map((n) => (
                <span key={n} className="contacts-iosfield__value">
                  <T>{n}</T>
                </span>
              ))}
            </div>
          </IOSGroup>
        )}
        <IOSGroup>
          <IOSRow label="Share Contact" tinted chevron={false} onClick={downloadVCard} />
          <IOSRow label="Copy Email Address" tinted chevron={false} onClick={copyEmail} />
        </IOSGroup>
        {flash && <div className="contacts-toast">{flash}</div>}
      </IOSPage>
    )
  }

  return (
    <IOSPage key="list" dir={nav.dir} title="Contacts" header={<SearchField platform="ios" value={query} onChange={setQuery} />}>
      {!query && (
        <IOSGroup>
          <IOSRow
            icon={<img className="contacts-iosmycard" src={asset(profile.photo)} alt="" draggable={false} />}
            label={<span className="contacts-iosmycard__name">{profile.name}</span>}
            detail="My Card"
            onClick={() => nav.push('card')}
          />
        </IOSGroup>
      )}
      <IOSGroup header={visible ? lastName[0] : undefined}>
        {visible ? (
          <IOSRow
            label={
              <span>
                {profile.firstName} <strong>{lastName}</strong>
              </span>
            }
            chevron={false}
            onClick={() => nav.push('card')}
          />
        ) : (
          <IOSRow label={`No results for “${query}”`} />
        )}
      </IOSGroup>
    </IOSPage>
  )
}
