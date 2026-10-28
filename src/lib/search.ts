/**
 * Spotlight search index: apps, folders, projects, skills, experience,
 * education, credentials, notes and quick actions, all built from the
 * registry and src/data/content.ts.
 */
import { appList, appName } from '../apps/registry'
import type { AppIconId, FileKind } from '../assets/icons'
import { content } from '../data/content'
import { useSettings } from '../state/settings'
import { useSystem } from '../state/system'
import { formatRange } from './format'
import { bestFieldScore, normalize } from './fuzzy'
import { askJignesh, composeMail, FOLDERS, launch, openFolder, openResume, openUrl } from './launch'
import type { Platform } from './platform'
import { isTodo } from './todo'

export type ResultKind =
  | 'ask'
  | 'app'
  | 'folder'
  | 'project'
  | 'skill'
  | 'experience'
  | 'education'
  | 'credential'
  | 'note'
  | 'contact'
  | 'action'

export type ResultIcon =
  | { type: 'app'; id: AppIconId }
  | { type: 'folder'; emblem: string }
  | { type: 'file'; kind: FileKind }
  | { type: 'cover'; from: string; to: string; glyph: string }
  | { type: 'emoji'; value: string }
  | { type: 'ask' }

export interface SearchResult {
  id: string
  kind: ResultKind
  title: string
  subtitle: string
  icon: ResultIcon
  score: number
  run: () => void
}

export interface SearchGroup {
  id: string
  label: string
  results: SearchResult[]
}

export interface SearchResponse {
  /** "Ask Jignesh: <query>" — present whenever the query is non-empty. */
  ask: SearchResult | null
  /** True when the Ask Jignesh row should be the very first result. */
  askFirst: boolean
  topHit: SearchResult | null
  groups: SearchGroup[]
  /** Everything in display order (top hit / ask first), for keyboard navigation. */
  flat: SearchResult[]
}

interface IndexItem {
  id: string
  kind: ResultKind
  group: string
  title: string
  subtitle: string
  icon: ResultIcon
  fields: { text: string; weight: number }[]
  run: () => void
}

const QUESTION = /^(who|whom|whose|what|whats|what's|when|where|why|how|which|is|are|was|were|does|do|did|can|could|would|will|should|has|have|had|tell|explain|describe)\b/i

/** Heuristic for "this reads like a question for the assistant". */
export function isQuestion(query: string): boolean {
  const q = query.trim()
  if (!q) return false
  if (q.includes('?')) return true
  if (QUESTION.test(q)) return true
  return q.split(/\s+/).filter(Boolean).length >= 5
}

const GROUPS: { id: string; label: string; limit: number }[] = [
  { id: 'apps', label: 'Applications', limit: 5 },
  { id: 'projects', label: 'Projects', limit: 4 },
  { id: 'skills', label: 'Skills', limit: 4 },
  { id: 'folders', label: 'Folders', limit: 4 },
  { id: 'experience', label: 'Experience', limit: 4 },
  { id: 'credentials', label: 'Certifications & Awards', limit: 3 },
  { id: 'notes', label: 'Notes', limit: 3 },
  { id: 'contact', label: 'Contact', limit: 3 },
  { id: 'settings', label: 'Settings', limit: 4 },
]

const SKILL_EMOJI: Record<string, string> = {
  languages: '⌨️',
  frontend: '🎨',
  backend: '🗄️',
  ai: '🧠',
  cloud: '☁️',
  other: '🧩',
}

const clean = (s: string | undefined) => (s && !isTodo(s) ? s : '')

function buildIndex(platform: Platform): IndexItem[] {
  const items: IndexItem[] = []

  for (const app of appList) {
    if (app.id === 'preview') continue
    const name = appName(app.id, platform)
    items.push({
      id: `app:${app.id}`,
      kind: 'app',
      group: 'apps',
      title: name,
      subtitle: app.description,
      icon: { type: 'app', id: app.icon },
      fields: [
        { text: name, weight: 1 },
        { text: app.name, weight: 0.95 },
        { text: app.iosName ?? '', weight: 0.95 },
        { text: app.keywords.join(' '), weight: 0.72 },
        ...app.keywords.map((k) => ({ text: k, weight: 0.74 })),
        { text: app.description, weight: 0.55 },
      ],
      run: () => launch(app.id),
    })
  }

  const folders: { key: keyof typeof FOLDERS; name: string; desc: string; words: string }[] = [
    { key: 'projects', name: 'Projects', desc: 'Folder · things Jignesh has built', words: 'work portfolio code' },
    { key: 'resume', name: 'Resume', desc: 'Folder · resume PDF', words: 'cv curriculum vitae pdf' },
    { key: 'certifications', name: 'Certifications', desc: 'Folder · certifications and awards', words: 'certs awards honours honors' },
    { key: 'experience', name: 'Experience', desc: 'Folder · jobs and roles', words: 'work jobs career employment' },
  ]
  for (const f of folders) {
    items.push({
      id: `folder:${f.key}`,
      kind: 'folder',
      group: 'folders',
      title: f.name,
      subtitle: f.desc,
      icon: { type: 'folder', emblem: f.key },
      fields: [
        { text: f.name, weight: 1 },
        { text: f.words, weight: 0.7 },
      ],
      run: () => openFolder(FOLDERS[f.key]),
    })
  }

  for (const p of content.projects) {
    items.push({
      id: `project:${p.id}`,
      kind: 'project',
      group: 'projects',
      title: p.name,
      subtitle: clean(p.tagline) || p.context,
      icon: { type: 'cover', ...p.cover },
      fields: [
        { text: p.name, weight: 1 },
        { text: p.tagline, weight: 0.62 },
        { text: p.context, weight: 0.55 },
        ...p.tech.map((t) => ({ text: t, weight: 0.6 })),
        ...p.tags.map((t) => ({ text: t, weight: 0.55 })),
        { text: p.description, weight: 0.4 },
      ],
      run: () => openUrl(`jignesh://projects/${p.id}`),
    })
  }

  for (const g of content.skills) {
    for (const skill of g.items) {
      if (isTodo(skill)) continue
      items.push({
        id: `skill:${g.id}:${normalize(skill)}`,
        kind: 'skill',
        group: 'skills',
        title: skill,
        subtitle: `Skill · ${g.name}`,
        icon: { type: 'emoji', value: SKILL_EMOJI[g.id] ?? '✨' },
        fields: [
          { text: skill, weight: 0.97 },
          { text: g.name, weight: 0.45 },
        ],
        run: () => askJignesh(`Has he worked with ${skill.replace(/\s*\(.*\)$/, '')}?`),
      })
    }
  }

  for (const e of content.experience) {
    items.push({
      id: `experience:${e.id}`,
      kind: 'experience',
      group: 'experience',
      title: e.role,
      subtitle: `${e.company} · ${formatRange(e.start, e.end)}`,
      icon: { type: 'file', kind: 'job' },
      fields: [
        { text: e.company, weight: 0.98 },
        { text: e.role, weight: 0.92 },
        { text: e.team ?? '', weight: 0.7 },
        ...e.tech.map((t) => ({ text: t, weight: 0.5 })),
        { text: clean(e.summary), weight: 0.4 },
      ],
      run: () => openFolder(FOLDERS.experience),
    })
  }

  for (const ed of content.education) {
    items.push({
      id: `education:${ed.id}`,
      kind: 'education',
      group: 'experience',
      title: ed.school,
      subtitle: `${ed.degree} · ${ed.start}–${ed.end.slice(0, 4)}`,
      icon: { type: 'folder', emblem: 'education' },
      fields: [
        { text: ed.school, weight: 0.95 },
        { text: ed.degree, weight: 0.75 },
        { text: 'education school university college degree', weight: 0.55 },
      ],
      run: () => openFolder('/Education'),
    })
  }

  for (const c of content.credentials) {
    const issuer = clean(c.issuer)
    items.push({
      id: `credential:${c.id}`,
      kind: 'credential',
      group: 'credentials',
      title: c.name,
      subtitle: [c.kind, issuer, clean(c.date)].filter(Boolean).join(' · '),
      icon: { type: 'file', kind: 'cert' },
      fields: [
        { text: c.name, weight: 0.95 },
        { text: issuer, weight: 0.75 },
        { text: c.kind, weight: 0.6 },
        { text: clean(c.description), weight: 0.4 },
      ],
      run: () => openFolder(FOLDERS.certifications),
    })
  }

  for (const n of content.notes) {
    items.push({
      id: `note:${n.id}`,
      kind: 'note',
      group: 'notes',
      title: n.title,
      subtitle: 'Note',
      icon: { type: 'app', id: 'notes' },
      fields: [
        { text: n.title, weight: 0.95 },
        { text: n.body.replace(/[#*_`[\]()]/g, ' '), weight: 0.35 },
      ],
      run: () => launch('notes', { note: n.id }),
    })
  }

  const { contact } = content
  const contactItems: Omit<IndexItem, 'kind' | 'group'>[] = [
    {
      id: 'contact:email',
      title: 'Email Jignesh',
      subtitle: contact.email,
      icon: { type: 'app', id: 'mail' },
      fields: [
        { text: 'Email Jignesh', weight: 1 },
        { text: 'mail contact message hire reach out', weight: 0.7 },
        { text: contact.email, weight: 0.8 },
      ],
      run: () => composeMail({ to: contact.email }),
    },
    {
      id: 'contact:linkedin',
      title: 'LinkedIn',
      subtitle: contact.linkedin.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, ''),
      icon: { type: 'emoji', value: '💼' },
      fields: [
        { text: 'LinkedIn', weight: 1 },
        { text: 'linkedin profile network connect', weight: 0.7 },
      ],
      run: () => openUrl(contact.linkedin),
    },
    {
      id: 'contact:card',
      title: 'Contact card',
      subtitle: 'Email, LinkedIn, GitHub, location',
      icon: { type: 'app', id: 'contacts' },
      fields: [
        { text: 'Contact card', weight: 0.95 },
        { text: 'phone address location vcard', weight: 0.6 },
      ],
      run: () => launch('contacts'),
    },
  ]
  for (const c of contactItems) items.push({ ...c, kind: 'contact', group: 'contact' })

  const settings = () => useSettings.getState()
  const actions: Omit<IndexItem, 'kind' | 'group'>[] = [
    {
      id: 'action:dark',
      title: 'Dark Mode',
      subtitle: 'Switch appearance to dark',
      icon: { type: 'emoji', value: '🌙' },
      fields: [
        { text: 'Dark Mode', weight: 1 },
        { text: 'dark theme night appearance', weight: 0.75 },
      ],
      run: () => settings().update({ theme: 'dark' }),
    },
    {
      id: 'action:light',
      title: 'Light Mode',
      subtitle: 'Switch appearance to light',
      icon: { type: 'emoji', value: '☀️' },
      fields: [
        { text: 'Light Mode', weight: 1 },
        { text: 'light theme day appearance', weight: 0.75 },
      ],
      run: () => settings().update({ theme: 'light' }),
    },
    {
      id: 'action:auto-theme',
      title: 'Automatic Appearance',
      subtitle: 'Follow the system light/dark setting',
      icon: { type: 'emoji', value: '🌗' },
      fields: [
        { text: 'Automatic Appearance', weight: 0.95 },
        { text: 'auto theme system appearance', weight: 0.7 },
      ],
      run: () => settings().update({ theme: 'auto' }),
    },
    {
      id: 'action:wallpaper',
      title: 'Change Wallpaper',
      subtitle: 'System Settings › Wallpaper',
      icon: { type: 'app', id: 'settings' },
      fields: [
        { text: 'Change Wallpaper', weight: 1 },
        { text: 'wallpaper background desktop picture', weight: 0.8 },
      ],
      run: () => launch('settings', { section: 'wallpaper' }),
    },
    {
      id: 'action:reduce-motion',
      title: 'Reduce Motion',
      subtitle: 'Toggle animations on or off',
      icon: { type: 'emoji', value: '🐢' },
      fields: [
        { text: 'Reduce Motion', weight: 1 },
        { text: 'animations accessibility motion', weight: 0.7 },
      ],
      run: () => {
        const s = settings()
        const os = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
        s.update({ reduceMotion: !(s.reduceMotion ?? os) })
      },
    },
    {
      id: 'action:resume',
      title: 'View Resume',
      subtitle: 'Plain one-page resume with PDF download',
      icon: { type: 'app', id: 'resume' },
      fields: [
        { text: 'View Resume', weight: 1 },
        { text: 'resume cv pdf download', weight: 0.85 },
      ],
      run: () => openResume(),
    },
  ]
  if (platform === 'mac') {
    actions.push({
      id: 'action:mission-control',
      title: 'Mission Control',
      subtitle: 'See all open windows',
      icon: { type: 'app', id: 'missioncontrol' },
      fields: [
        { text: 'Mission Control', weight: 1 },
        { text: 'windows expose overview spaces', weight: 0.7 },
      ],
      run: () => useSystem.getState().toggleMissionControl(true),
    })
  }
  for (const a of actions) items.push({ ...a, kind: 'action', group: 'settings' })

  return items
}

const indexCache: Partial<Record<Platform, IndexItem[]>> = {}
function getIndex(platform: Platform): IndexItem[] {
  return (indexCache[platform] ??= buildIndex(platform))
}

/** Minimum score for a result to be shown. */
export const MIN_SCORE = 0.42

function toResult(item: IndexItem, score: number): SearchResult {
  return { id: item.id, kind: item.kind, title: item.title, subtitle: item.subtitle, icon: item.icon, score, run: item.run }
}

export function search(query: string, platform: Platform): SearchResponse {
  const q = query.trim()
  if (!q) return { ask: null, askFirst: false, topHit: null, groups: [], flat: [] }

  const scored: { item: IndexItem; score: number }[] = []
  for (const item of getIndex(platform)) {
    const score = bestFieldScore(q, item.fields)
    if (score >= MIN_SCORE) scored.push({ item, score })
  }
  scored.sort((a, b) => b.score - a.score || a.item.title.localeCompare(b.item.title))

  const ask: SearchResult = {
    id: 'ask',
    kind: 'ask',
    title: `Ask Jignesh: ${q}`,
    subtitle: 'Answers from his portfolio',
    icon: { type: 'ask' },
    score: 1,
    run: () => askJignesh(q),
  }
  const question = isQuestion(q)
  const askFirst = question || scored.length === 0

  const topHit = !askFirst && scored.length ? toResult(scored[0].item, scored[0].score) : null
  const groups: SearchGroup[] = []
  for (const g of GROUPS) {
    const results = scored
      .filter((s) => s.item.group === g.id && s.item.id !== topHit?.id)
      .slice(0, g.limit)
      .map((s) => toResult(s.item, s.score))
    if (results.length) groups.push({ id: g.id, label: g.label, results })
  }

  const flat: SearchResult[] = []
  if (askFirst) flat.push(ask)
  if (topHit) flat.push(topHit, ask)
  for (const g of groups) flat.push(...g.results)
  return { ask, askFirst, topHit, groups, flat }
}
