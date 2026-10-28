import { content } from '../../data/content'
import { readJSON, writeJSON } from '../../lib/storage'

export type MailboxId = 'inbox' | 'sent' | 'drafts'
export type MailAction = 'resume' | 'projects' | 'assistant' | 'reply' | 'building'

export interface Message {
  id: string
  mailbox: MailboxId
  fromName: string
  fromEmail: string
  to: string
  subject: string
  body: string
  time: number
  read: boolean
  actions?: MailAction[]
  /** Sent items: how the message left ("Sent", "Opened in your mail app"). */
  status?: string
}

export interface Draft {
  to: string
  from: string
  subject: string
  body: string
}

const { profile, contact, currentlyBuilding, site } = content
const KEY = 'jos.mail.v1'
const sessionStart = Date.now()

function seed(): Message[] {
  const [y, m] = currentlyBuilding.updated.split('-').map(Number)
  return [
    {
      id: 'welcome',
      mailbox: 'inbox',
      fromName: profile.name,
      fromEmail: contact.email,
      to: 'you',
      subject: 'Welcome to my portfolio 👋',
      body: `Hi there,

Thanks for stopping by! I'm ${profile.firstName}, ${profile.headline.replace(' @ ', ' at ')} in ${profile.location}.

This site is a tiny operating system. A few things worth trying:

• Open the Resume button in the menu bar for a plain one-page resume.
• Browse my Projects folder in Finder.
• Ask my AI assistant anything about my work.
• Or just hit Reply. This message comes straight to my inbox.

Cheers,
${profile.firstName}`,
      time: sessionStart,
      read: false,
      actions: ['resume', 'projects', 'assistant', 'reply'],
    },
    {
      id: 'building',
      mailbox: 'inbox',
      fromName: profile.name,
      fromEmail: contact.email,
      to: 'you',
      subject: `What I'm building: ${currentlyBuilding.title}`,
      body: `${currentlyBuilding.description}

Stack: ${currentlyBuilding.stack.join(', ')}.${currentlyBuilding.link ? `\n\nFollow along: ${currentlyBuilding.link}` : ''}`,
      time: new Date(y || 2026, (m || 1) - 1, 1).getTime(),
      read: false,
      actions: ['building', 'reply'],
    },
  ]
}

export function loadMessages(): Message[] {
  const saved = readJSON<{ read: string[]; extra: Message[] } | null>(KEY, null, 'session')
  const base = seed().map((msg) => ({ ...msg, read: saved?.read.includes(msg.id) ?? false }))
  return [...base, ...(saved?.extra ?? [])]
}

export function saveMessages(messages: Message[]) {
  writeJSON(
    KEY,
    {
      read: messages.filter((msg) => msg.mailbox === 'inbox' && msg.read).map((msg) => msg.id),
      extra: messages.filter((msg) => msg.mailbox !== 'inbox'),
    },
    'session',
  )
}

export const emptyDraft = (fields: Partial<Draft> = {}): Draft => ({
  to: fields.to ?? contact.email,
  from: fields.from ?? '',
  subject: fields.subject ?? '',
  body: fields.body ?? '',
})

export const replyDraft = (msg: Message): Draft =>
  emptyDraft({ to: msg.fromEmail, subject: msg.id === 'welcome' ? site.welcomeMessage.subject : `Re: ${msg.subject}` })

export function isValidEmail(s: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim())
}

export function mailtoUrl(d: Draft): string {
  const body = d.from.trim() ? `${d.body}\n\n(Reply to: ${d.from.trim()})` : d.body
  const q = [
    d.subject && `subject=${encodeURIComponent(d.subject)}`,
    body && `body=${encodeURIComponent(body)}`,
  ].filter(Boolean)
  return `mailto:${d.to.trim()}${q.length ? `?${q.join('&')}` : ''}`
}

export type SendResult = { mode: 'form'; ok: boolean; error?: string } | { mode: 'mailto' }

export async function sendDraft(d: Draft): Promise<SendResult> {
  if (contact.formEndpoint) {
    try {
      const res = await fetch(contact.formEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ to: d.to, email: d.from || undefined, _replyto: d.from || undefined, subject: d.subject, message: d.body }),
      })
      return res.ok ? { mode: 'form', ok: true } : { mode: 'form', ok: false, error: `The form service answered ${res.status}.` }
    } catch {
      return { mode: 'form', ok: false, error: "Couldn't reach the form service. Check your connection." }
    }
  }
  openMailto(d)
  return { mode: 'mailto' }
}

export function openMailto(d: Draft) {
  const a = document.createElement('a')
  a.href = mailtoUrl(d)
  a.rel = 'noopener'
  document.body.appendChild(a)
  a.click()
  a.remove()
}

export function formatMailDate(time: number, long = false) {
  const d = new Date(time)
  const today = new Date()
  const sameDay = d.toDateString() === today.toDateString()
  if (long) return d.toLocaleString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  if (sameDay) return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: d.getFullYear() === today.getFullYear() ? undefined : 'numeric' })
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}
