import { ArrowUp, Copy, FileText, Inbox, Reply, Send, SquarePen, X } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { content } from '../../data/content'
import { askJignesh, FOLDERS, openFolder, openResume, openUrl } from '../../lib/launch'
import { playSound } from '../../lib/sound'
import { copyText, IOSGroup, IOSPage, IOSRow, useFlash, useNavStack } from '../settings/kit'
import { useApp } from '../types'
import {
  emptyDraft,
  formatMailDate,
  initials,
  isValidEmail,
  loadMessages,
  openMailto,
  replyDraft,
  saveMessages,
  sendDraft,
  type Draft,
  type MailAction,
  type MailboxId,
  type Message,
} from './store'
import './Mail.css'

const MAILBOXES: { id: MailboxId; label: string; icon: ReactNode }[] = [
  { id: 'inbox', label: 'Inbox', icon: <Inbox size={15} /> },
  { id: 'sent', label: 'Sent', icon: <Send size={15} /> },
  { id: 'drafts', label: 'Drafts', icon: <FileText size={15} /> },
]

const EMAIL = content.contact.email

type Notice = { tone: 'ok' | 'info' | 'error'; text: string; draft?: Draft }

/** All Mail state + actions, shared by the macOS and iOS layouts. */
function useMail() {
  const { params } = useApp()
  const [messages, setMessages] = useState<Message[]>(loadMessages)
  const [draft, setDraft] = useState<Draft | null>(null)
  const [sending, setSending] = useState(false)
  const [notice, setNotice] = useState<Notice | null>(null)

  useEffect(() => saveMessages(messages), [messages])

  useEffect(() => {
    if (params && (params.to || params.subject || params.body)) {
      setDraft(emptyDraft({ to: params.to, subject: params.subject, body: params.body }))
      setNotice(null)
    }
  }, [params?.nonce]) // re-run on every launch intent

  const markRead = useCallback((id: string) => setMessages((ms) => ms.map((m) => (m.id === id && !m.read ? { ...m, read: true } : m))), [])

  const compose = (d: Draft = emptyDraft()) => {
    setDraft(d)
    setNotice(null)
  }

  const discard = () => {
    if (draft && (draft.body.trim() || draft.subject.trim())) {
      setMessages((ms) => [
        ...ms,
        { id: `draft-${Date.now()}`, mailbox: 'drafts', fromName: 'You', fromEmail: draft.from, to: draft.to, subject: draft.subject || '(No Subject)', body: draft.body, time: Date.now(), read: true },
      ])
    }
    setDraft(null)
  }

  const send = async (): Promise<boolean> => {
    if (!draft) return false
    if (!isValidEmail(draft.to)) {
      setNotice({ tone: 'error', text: 'Add a valid address in the To field.' })
      return false
    }
    if (draft.from.trim() && !isValidEmail(draft.from)) {
      setNotice({ tone: 'error', text: 'Your email address looks incomplete. Fix it or leave it empty.' })
      return false
    }
    setSending(true)
    const result = await sendDraft(draft)
    setSending(false)
    if (result.mode === 'form' && !result.ok) {
      setNotice({ tone: 'error', text: `${result.error ?? 'Sending failed.'} You can open the message in your mail app instead.`, draft })
      playSound('error')
      return false
    }
    playSound('send')
    const status = result.mode === 'form' ? 'Sent' : 'Opened in your mail app'
    setMessages((ms) => [
      ...ms,
      { id: `sent-${Date.now()}`, mailbox: 'sent', fromName: 'You', fromEmail: draft.from, to: draft.to, subject: draft.subject || '(No Subject)', body: draft.body, time: Date.now(), read: true, status },
    ])
    setNotice(
      result.mode === 'form'
        ? { tone: 'ok', text: `Message sent. Thanks${draft.from ? `, I'll reply to ${draft.from}` : ''}!` }
        : { tone: 'info', text: 'Your mail app should open with this message ready to send. If nothing happened, email me directly:' },
    )
    setDraft(null)
    return true
  }

  return { messages, draft, setDraft, sending, notice, setNotice, markRead, compose, discard, send }
}

type MailState = ReturnType<typeof useMail>

function runAction(action: MailAction, msg: Message, mail: MailState) {
  if (action === 'resume') openResume()
  else if (action === 'projects') openFolder(FOLDERS.projects)
  else if (action === 'assistant') askJignesh()
  else if (action === 'building' && content.currentlyBuilding.link) openUrl(content.currentlyBuilding.link)
  else if (action === 'reply') mail.compose(replyDraft(msg))
}

const ACTION_LABEL: Record<MailAction, string> = {
  resume: 'View Resume',
  projects: 'Open Projects',
  assistant: 'Ask Jignesh',
  building: `Open ${content.currentlyBuilding.title}`,
  reply: 'Reply',
}

function NoticeBar({ notice, onClose, platform }: { notice: Notice; onClose: () => void; platform: 'mac' | 'ios' }) {
  const [flash, setFlash] = useFlash()
  return (
    <div className={`mail-notice mail-notice--${notice.tone} mail-notice--${platform}`} role="status">
      <div className="mail-notice__text">
        <span>{notice.text}</span>
        {notice.tone === 'info' && (
          <span className="mail-notice__addr">
            <span className="mail-notice__email">{EMAIL}</span>
            <button type="button" className="mail-notice__copy" onClick={async () => setFlash((await copyText(EMAIL)) ? 'Copied' : 'Select to copy')}>
              <Copy size={12} /> {flash ?? 'Copy'}
            </button>
          </span>
        )}
        {notice.draft && (
          <button type="button" className="mail-notice__copy" onClick={() => openMailto(notice.draft!)}>
            Open in mail app
          </button>
        )}
      </div>
      <button type="button" className="mail-notice__close" aria-label="Dismiss" onClick={onClose}>
        <X size={13} />
      </button>
    </div>
  )
}

function ComposeFields({ mail, platform }: { mail: MailState; platform: 'mac' | 'ios' }) {
  const d = mail.draft!
  const set = (patch: Partial<Draft>) => mail.setDraft({ ...d, ...patch })
  return (
    <div className={`mail-fields mail-fields--${platform}`}>
      <label className="mail-field">
        <span>To:</span>
        <input id="mail-to" type="email" value={d.to} onChange={(e) => set({ to: e.target.value })} autoComplete="off" />
      </label>
      <label className="mail-field">
        <span>From:</span>
        <input id="mail-from" type="email" value={d.from} placeholder="your@email.com (so I can reply)" onChange={(e) => set({ from: e.target.value })} autoComplete="email" />
      </label>
      <label className="mail-field">
        <span>Subject:</span>
        <input id="mail-subject" type="text" value={d.subject} onChange={(e) => set({ subject: e.target.value })} />
      </label>
      <textarea
        id="mail-body"
        className="mail-body-input"
        value={d.body}
        placeholder="Write your message…"
        aria-label="Message"
        autoFocus={platform === 'mac'}
        onChange={(e) => set({ body: e.target.value })}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
            e.preventDefault()
            void mail.send()
          }
        }}
      />
      <p className="mail-compose__hint">
        {content.contact.formEndpoint ? 'Messages go straight to my inbox.' : 'Send opens your email app with this message filled in.'}
      </p>
    </div>
  )
}

function MessageBody({ msg, mail, platform }: { msg: Message; mail: MailState; platform: 'mac' | 'ios' }) {
  return (
    <article className={`mail-message mail-message--${platform}`}>
      <header className="mail-message__head">
        <span className="mail-avatar" aria-hidden>
          {initials(msg.fromName)}
        </span>
        <div className="mail-message__meta">
          <div className="mail-message__row">
            <strong>{msg.fromName}</strong>
            <time>{formatMailDate(msg.time, true)}</time>
          </div>
          <div className="mail-message__subject">{msg.subject}</div>
          <div className="mail-message__to">
            To: {msg.to === 'you' ? 'You' : msg.to}
            {msg.status && <span className="chip">{msg.status}</span>}
          </div>
        </div>
      </header>
      <div className="mail-message__body">{msg.body || <em className="mail-dim">No content</em>}</div>
      {msg.actions && (
        <div className="mail-message__actions">
          {msg.actions.map((a) => (
            <button key={a} type="button" className={platform === 'ios' ? 'mail-iosbtn' : `btn${a === 'reply' ? ' btn--primary' : ''}`} onClick={() => runAction(a, msg, mail)}>
              {ACTION_LABEL[a]}
            </button>
          ))}
        </div>
      )}
    </article>
  )
}

export default function MailApp() {
  const { platform } = useApp()
  const mail = useMail()
  return platform === 'ios' ? <IOSMail mail={mail} /> : <MacMail mail={mail} />
}

/* ── macOS ────────────────────────────────────────────────────────────── */

function MacMail({ mail }: { mail: MailState }) {
  const { active, setTitle } = useApp()
  const [box, setBox] = useState<MailboxId>('inbox')
  const [selected, setSelected] = useState<string | null>('welcome')
  const list = useMemo(() => mail.messages.filter((m) => m.mailbox === box).sort((a, b) => b.time - a.time), [mail.messages, box])
  const msg = list.find((m) => m.id === selected) ?? null
  const unread = mail.messages.filter((m) => m.mailbox === 'inbox' && !m.read).length
  const boxLabel = MAILBOXES.find((b) => b.id === box)!.label

  useEffect(() => {
    if (msg && !msg.read) mail.markRead(msg.id)
  }, [msg, mail.markRead])

  useEffect(() => setTitle(mail.draft ? 'New Message' : `${boxLabel}${unread ? ` (${unread} unread)` : ''}`), [mail.draft, boxLabel, unread, setTitle])

  const select = (id: string) => {
    if (mail.draft) mail.discard()
    setSelected(id)
  }

  return (
    <div className={`mail-mac${active ? '' : ' is-inactive'}`}>
      <aside className="mail-sidebar">
        <div className="mail-sidebar__top" data-drag />
        <div className="mail-sidebar__heading">Favourites</div>
        {MAILBOXES.map((b) => {
          const count = b.id === 'inbox' ? unread : b.id === 'drafts' ? mail.messages.filter((m) => m.mailbox === 'drafts').length : 0
          return (
            <button
              key={b.id}
              type="button"
              className={`mail-box${box === b.id ? ' is-on' : ''}`}
              onClick={() => {
                setBox(b.id)
                setSelected(mail.messages.filter((m) => m.mailbox === b.id).sort((x, y) => y.time - x.time)[0]?.id ?? null)
              }}
            >
              <span className="mail-box__icon">{b.icon}</span>
              <span className="mail-box__label">{b.label}</span>
              {count > 0 && <span className="mail-box__count">{count}</span>}
            </button>
          )
        })}
      </aside>
      <section className="mail-list" aria-label={boxLabel}>
        <header className="mail-list__toolbar" data-drag>
          <div className="mail-list__title">
            <strong>{boxLabel}</strong>
            <span>
              {list.length} message{list.length === 1 ? '' : 's'}
              {box === 'inbox' && unread ? `, ${unread} unread` : ''}
            </span>
          </div>
          <button type="button" className="mail-tool" aria-label="New message" title="New message" onClick={() => mail.compose()}>
            <SquarePen size={17} />
          </button>
        </header>
        <div className="mail-list__items scroll">
          {list.map((m) => (
            <button key={m.id} type="button" className={`mail-item${m.id === selected && !mail.draft ? ' is-on' : ''}`} onClick={() => select(m.id)}>
              <span className={`mail-item__dot${m.read ? '' : ' is-unread'}`} aria-label={m.read ? undefined : 'Unread'} />
              <span className="mail-item__main">
                <span className="mail-item__row">
                  <strong>{m.mailbox === 'inbox' ? m.fromName : `To: ${m.to}`}</strong>
                  <time>{formatMailDate(m.time)}</time>
                </span>
                <span className="mail-item__subject">{m.subject}</span>
                <span className="mail-item__preview">{m.body.replace(/\s+/g, ' ')}</span>
              </span>
            </button>
          ))}
          {!list.length && <p className="mail-list__empty">No messages</p>}
        </div>
      </section>
      <main className="mail-reader">
        <header className="mail-reader__toolbar" data-drag>
          {mail.draft ? (
            <>
              <span className="mail-reader__title">New Message</span>
              <button type="button" className="mail-tool" aria-label="Discard draft" title="Discard (saved to Drafts)" onClick={mail.discard}>
                <X size={17} />
              </button>
              <button type="button" className="btn btn--primary mail-send" disabled={mail.sending} onClick={() => void mail.send()}>
                <Send size={13} /> {mail.sending ? 'Sending…' : 'Send'}
              </button>
            </>
          ) : (
            <>
              <button type="button" className="mail-tool" aria-label="Reply" title="Reply" disabled={!msg} onClick={() => msg && mail.compose(replyDraft(msg))}>
                <Reply size={17} />
              </button>
              <button type="button" className="mail-tool" aria-label="New message" title="New message" onClick={() => mail.compose()}>
                <SquarePen size={17} />
              </button>
            </>
          )}
        </header>
        {mail.notice && <NoticeBar notice={mail.notice} platform="mac" onClose={() => mail.setNotice(null)} />}
        {mail.draft ? (
          <div className="mail-compose">
            <ComposeFields mail={mail} platform="mac" />
          </div>
        ) : msg ? (
          <div className="mail-reader__scroll scroll">
            <MessageBody msg={msg} mail={mail} platform="mac" />
          </div>
        ) : (
          <div className="mail-reader__empty">No Message Selected</div>
        )}
      </main>
    </div>
  )
}

/* ── iOS ──────────────────────────────────────────────────────────────── */

function IOSMail({ mail }: { mail: MailState }) {
  const nav = useNavStack(['mailboxes', 'box:inbox'])
  const top = nav.top
  const unread = mail.messages.filter((m) => m.mailbox === 'inbox' && !m.read).length

  useEffect(() => {
    if (top.startsWith('msg:')) mail.markRead(top.slice(4))
  }, [top, mail.markRead])

  const composeBtn = (
    <button type="button" className="mail-iosbar__btn" aria-label="New message" onClick={() => mail.compose()}>
      <SquarePen size={22} />
    </button>
  )

  let page: ReactNode
  if (top === 'mailboxes') {
    page = (
      <IOSPage key={top} dir={nav.dir} title="Mailboxes" bottomBar={<><span /><span className="mail-iosbar__status">Updated Just Now</span>{composeBtn}</>}>
        <IOSGroup>
          {MAILBOXES.map((b) => {
            const count = b.id === 'inbox' ? unread : mail.messages.filter((m) => m.mailbox === b.id).length
            return <IOSRow key={b.id} icon={<span className="mail-iosboxicon">{b.icon}</span>} label={b.label} value={count || undefined} onClick={() => nav.push(`box:${b.id}`)} />
          })}
        </IOSGroup>
      </IOSPage>
    )
  } else if (top.startsWith('box:')) {
    const id = top.slice(4) as MailboxId
    const label = MAILBOXES.find((b) => b.id === id)!.label
    const list = mail.messages.filter((m) => m.mailbox === id).sort((a, b) => b.time - a.time)
    page = (
      <IOSPage
        key={top}
        dir={nav.dir}
        title={label}
        tone="plain"
        back={{ label: 'Mailboxes', onClick: nav.pop }}
        bottomBar={<><span /><span className="mail-iosbar__status">{id === 'inbox' && unread ? `${unread} Unread` : 'Updated Just Now'}</span>{composeBtn}</>}
      >
        <div className="mail-ioslist">
          {list.map((m) => (
            <button key={m.id} type="button" className="mail-iositem" onClick={() => nav.push(`msg:${m.id}`)}>
              <span className={`mail-item__dot${m.read ? '' : ' is-unread'}`} />
              <span className="mail-item__main">
                <span className="mail-item__row">
                  <strong>{m.mailbox === 'inbox' ? m.fromName : `To: ${m.to}`}</strong>
                  <time>{formatMailDate(m.time)}</time>
                </span>
                <span className="mail-item__subject">{m.subject}</span>
                <span className="mail-item__preview">{m.body.replace(/\s+/g, ' ')}</span>
              </span>
            </button>
          ))}
          {!list.length && <p className="mail-list__empty">No messages</p>}
        </div>
      </IOSPage>
    )
  } else {
    const msg = mail.messages.find((m) => m.id === top.slice(4))
    const parent = nav.stack[nav.stack.length - 2] ?? 'box:inbox'
    page = (
      <IOSPage
        key={top}
        dir={nav.dir}
        title=""
        large={false}
        tone="plain"
        back={{ label: MAILBOXES.find((b) => `box:${b.id}` === parent)?.label ?? 'Inbox', onClick: nav.pop }}
        bottomBar={
          <>
            <button type="button" className="mail-iosbar__btn" aria-label="Reply" disabled={!msg} onClick={() => msg && mail.compose(replyDraft(msg))}>
              <Reply size={22} />
            </button>
            <span />
            {composeBtn}
          </>
        }
      >
        {msg ? <MessageBody msg={msg} mail={mail} platform="ios" /> : <p className="mail-list__empty">Message not found</p>}
      </IOSPage>
    )
  }

  return (
    <div className="mail-ios">
      {page}
      {mail.notice && !mail.draft && (
        <div className="mail-ios__notice">
          <NoticeBar notice={mail.notice} platform="ios" onClose={() => mail.setNotice(null)} />
        </div>
      )}
      {mail.draft && (
        <div className="mail-sheet" role="dialog" aria-modal="true" aria-label="New message">
          <div className="mail-sheet__card">
            <header className="mail-sheet__head">
              <button type="button" className="mail-sheet__cancel" onClick={mail.discard}>
                Cancel
              </button>
              <strong>New Message</strong>
              <button type="button" className="mail-sheet__send" aria-label="Send" disabled={mail.sending} onClick={() => void mail.send()}>
                <ArrowUp size={20} strokeWidth={2.8} />
              </button>
            </header>
            {mail.notice && <NoticeBar notice={mail.notice} platform="ios" onClose={() => mail.setNotice(null)} />}
            <ComposeFields mail={mail} platform="ios" />
          </div>
        </div>
      )}
    </div>
  )
}
