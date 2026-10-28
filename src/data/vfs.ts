/**
 * Virtual file system generated from content.ts. Shared by Finder / Files,
 * Terminal and Preview, so the same "files" show up everywhere.
 *
 * Paths are absolute and rooted at "/" (the home folder, shown as "~" in
 * Terminal). Lookups are case-insensitive and match either a node's file
 * name ("ross.md") or its display label ("ROSS").
 */
import { appList } from '../apps/registry'
import type { AppId } from '../apps/types'
import type { FileKind } from '../assets/icons'
import { formatDuration, formatMonth, formatRange } from '../lib/format'
import { launch, openFolder, openResume, openUrl } from '../lib/launch'
import { content } from './content'
import type { Credential, Education, Experience, Project } from './types'

export type VfsRef =
  | { type: 'project'; id: string }
  | { type: 'credential'; id: string }
  | { type: 'experience'; id: string }
  | { type: 'education'; id: string }
  | { type: 'resume-pdf' }
  | { type: 'resume-web' }
  | { type: 'url'; url: string }
  | { type: 'app'; id: AppId }

export interface VfsNode {
  /** File name used by Terminal ("ross.md"). */
  name: string
  /** Display name used by Finder ("ROSS"). */
  label: string
  path: string
  type: 'folder' | 'file'
  kind?: FileKind
  /** Folder emblem drawn on the folder icon (see folderIconUrl). */
  emblem?: string
  /** Human "Kind" column, e.g. "PDF Document". */
  kindLabel: string
  children?: VfsNode[]
  ref?: VfsRef
  /** Plain-text body for text files (generated files are rendered by nodeText). */
  text?: string
  /** "YYYY", "YYYY-MM" or "YYYY-MM-DD". */
  modified?: string
  /** Approximate size string for list views. */
  size?: string
}

/* ───────────────────────── helpers ───────────────────────── */

const isTodo = (v: unknown) => typeof v === 'string' && /^\s*TODO\b/i.test(v)
const realStr = (v: string | undefined) => (v && !isTodo(v) ? v : '')
const realList = (items: string[]) => items.filter((i) => !isTodo(i))

/** "Singapore University of Technology and Design (SUTD)" → "SUTD". */
export function shortName(name: string): string {
  const m = /\(([^)]+)\)\s*$/.exec(name)
  return m ? m[1] : name
}

const SITE_DATE = '2026-10-28'

function byteSize(text: string): string {
  const bytes = new TextEncoder().encode(text).length
  return bytes < 1024 ? `${bytes} bytes` : `${(bytes / 1024).toFixed(1)} KB`
}

function wrap(text: string, width = 72): string {
  const out: string[] = []
  for (const para of text.split('\n')) {
    if (para.length <= width) {
      out.push(para)
      continue
    }
    const indent = /^(\s*(?:[•-]\s+)?)/.exec(para)?.[1] ?? ''
    const hang = ' '.repeat(indent.length)
    let line = ''
    for (const word of para.split(/\s+/)) {
      if (!word) continue
      if ((line + ' ' + word).trim().length > width && line.trim()) {
        out.push(line)
        line = hang + word
      } else {
        line = line ? `${line} ${word}` : word
      }
    }
    if (line) out.push(line)
  }
  return out.join('\n')
}

/* ─────────────────────── text generators ─────────────────────── */

export function projectText(p: Project): string {
  const meta = [p.year && `Year: ${p.year}`, p.context && `Context: ${p.context}`, `Status: ${p.status}`]
    .filter(Boolean)
    .join(' · ')
  const lines = [`# ${p.name}`, p.tagline, '', meta, `Tech: ${p.tech.join(', ')}`, '', p.description]
  const hl = realList(p.highlights)
  if (hl.length) lines.push('', 'Highlights:', ...hl.map((h) => `  • ${h}`))
  const links = [p.links.github && `GitHub: ${p.links.github}`, p.links.demo && `Demo:   ${p.links.demo}`, p.links.article && `Read:   ${p.links.article}`].filter(Boolean)
  if (links.length) lines.push('', ...(links as string[]))
  return wrap(lines.join('\n'))
}

export function experienceText(e: Experience): string {
  const lines = [
    `# ${e.role}`,
    `${e.company}${e.team ? ` · ${e.team}` : ''}`,
    `${formatRange(e.start, e.end)} (${formatDuration(e.start, e.end)})${e.location ? ` · ${e.location}` : ''}${e.type ? ` · ${e.type}` : ''}`,
    '',
    realStr(e.summary),
  ]
  const hl = realList(e.highlights)
  if (hl.length) lines.push('', ...hl.map((h) => `  • ${h}`))
  if (e.tech.length) lines.push('', `Tech: ${e.tech.join(', ')}`)
  return wrap(lines.join('\n'))
}

export function educationText(ed: Education): string {
  const lines = [`# ${ed.school}`, ed.degree, `${formatMonth(ed.start)} – ${formatMonth(ed.end)} · ${ed.location}`]
  const det = realList(ed.details)
  if (det.length) lines.push('', ...det.map((d) => `  • ${d}`))
  return wrap(lines.join('\n'))
}

export function credentialText(c: Credential): string {
  const lines = [`# ${c.name}`, `${c.kind} · ${realStr(c.issuer) || 'Issuer not listed'}${realStr(c.date) ? ` · ${c.date}` : ''}`]
  if (realStr(c.description)) lines.push('', c.description!)
  if (c.url) lines.push('', `Credential: ${c.url}`)
  return wrap(lines.join('\n'))
}

function aboutText(): string {
  const p = content.profile
  return wrap(
    [
      `${p.name}`,
      `${p.headline} · ${p.location}`,
      '',
      ...p.summary.flatMap((para) => [para, '']),
      `Interests: ${realList(p.interests).join(', ')}`,
    ].join('\n'),
  )
}

function contactText(): string {
  const c = content.contact
  const rows = [
    ['Email', c.email],
    ['LinkedIn', c.linkedin],
    ['GitHub', c.github],
    ['Website', c.website ?? ''],
    ['Phone', c.phone ?? ''],
    ['Location', content.profile.location],
  ].filter(([, v]) => v && !isTodo(v))
  return rows.map(([k, v]) => `${(k + ':').padEnd(10)} ${v}`).join('\n')
}

function skillsText(): string {
  return content.skills.map((g) => wrap(`${g.name}:\n  ${realList(g.items).join(', ')}`)).join('\n\n')
}

const trashFiles: { name: string; text: string; modified: string }[] = [
  {
    name: 'old-portfolio-v1.html',
    modified: '2023-03-06',
    text: `<!-- portfolio v1, a.k.a. "the marquee years" -->
<html>
  <body bgcolor="#00ff00">
    <marquee>Welcome to my website!!!</marquee>
    <p>Under construction 🚧 (since 2023)</p>
  </body>
</html>`,
  },
  {
    name: 'bugs.txt',
    modified: '2026-10-27',
    text: `Known bugs:
  1. Works on my machine.
  2. See 1.

Fixed bugs:
  - The one where Tetris pieces fell upwards. Gravity has been restored.`,
  },
  {
    name: 'todo-final-FINAL.md',
    modified: '2026-10-26',
    text: `# TODO (final) (final) (FINAL)

- [x] Build a portfolio
- [x] Turn it into an operating system, obviously
- [ ] Touch grass
- [ ] Stop opening Terminal to type "ls" for fun`,
  },
  {
    name: 'node_modules.zip',
    modified: '2024-05-23',
    text: 'Binary file, 4.2 GB. It was compressed out of respect for your disk.',
  },
]

/* ─────────────────────────── tree ─────────────────────────── */

function file(parent: string, name: string, label: string, kind: FileKind, kindLabel: string, extra: Partial<VfsNode> = {}): VfsNode {
  return { name, label, path: `${parent === '/' ? '' : parent}/${name}`, type: 'file', kind, kindLabel, ...extra }
}

function folder(name: string, emblem: string, children: (parent: string) => VfsNode[], extra: Partial<VfsNode> = {}): VfsNode {
  const path = `/${name}`
  return { name, label: name, path, type: 'folder', emblem, kindLabel: 'Folder', children: children(path), ...extra }
}

function build(): VfsNode {
  const projects = folder('Projects', 'projects', (dir) =>
    content.projects.map((p) => {
      const text = projectText(p)
      return file(dir, `${p.id}.md`, p.name, 'project', 'Project', {
        ref: { type: 'project', id: p.id },
        modified: p.year.slice(0, 4),
        size: byteSize(text),
      })
    }),
  )

  const resume = folder('Resume', 'resume', (dir) => [
    file(dir, 'Jignesh_Motwani_Resume.pdf', 'Jignesh_Motwani_Resume.pdf', 'pdf', 'PDF Document', {
      ref: { type: 'resume-pdf' },
      modified: SITE_DATE,
      size: '140 KB',
    }),
    file(dir, 'Resume.webloc', 'Resume (web)', 'link', 'Web Location', {
      ref: { type: 'resume-web' },
      modified: SITE_DATE,
      size: '1 KB',
    }),
  ])

  const certifications = folder('Certifications', 'certifications', (dir) =>
    content.credentials.map((c) =>
      file(dir, `${c.id}.md`, c.name, 'cert', c.kind === 'Certification' ? 'Certificate' : c.kind, {
        ref: { type: 'credential', id: c.id },
        modified: realStr(c.date) ? c.date.slice(0, 4) : undefined,
        size: byteSize(credentialText(c)),
      }),
    ),
  )

  const experience = folder('Experience', 'experience', (dir) =>
    content.experience.map((e) =>
      file(dir, `${e.id}.md`, `${shortName(e.company)} — ${e.role}`, 'job', 'Role', {
        ref: { type: 'experience', id: e.id },
        modified: e.start,
        size: byteSize(experienceText(e)),
      }),
    ),
  )

  const education = folder('Education', 'education', (dir) =>
    content.education.map((ed) =>
      file(dir, `${ed.id}.md`, shortName(ed.school), 'doc', 'Education', {
        ref: { type: 'education', id: ed.id },
        modified: ed.end,
        size: byteSize(educationText(ed)),
      }),
    ),
  )

  const applications = folder('Applications', 'none', (dir) =>
    appList
      .filter((a) => a.dock || a.id === 'preview')
      .map((a) => file(dir, `${a.name}.app`, a.name, 'app', 'Application', { ref: { type: 'app', id: a.id }, size: '—' })),
  )

  const trash = folder('Trash', 'none', (dir) =>
    trashFiles.map((t) => file(dir, t.name, t.name, 'text', 'Plain Text', { text: t.text, modified: t.modified, size: byteSize(t.text) })),
  )

  const about = aboutText()
  const contact = contactText()
  const skills = skillsText()

  return {
    name: '',
    label: 'jignesh',
    path: '/',
    type: 'folder',
    kindLabel: 'Folder',
    children: [
      projects,
      resume,
      certifications,
      experience,
      education,
      applications,
      trash,
      file('/', 'about.txt', 'about.txt', 'text', 'Plain Text', { text: about, modified: SITE_DATE, size: byteSize(about) }),
      file('/', 'contact.txt', 'contact.txt', 'text', 'Plain Text', { text: contact, modified: SITE_DATE, size: byteSize(contact) }),
      file('/', 'skills.txt', 'skills.txt', 'text', 'Plain Text', { text: skills, modified: SITE_DATE, size: byteSize(skills) }),
    ],
  }
}

export const ROOT: VfsNode = build()
export const HOME = '/'

/* ───────────────────────── lookups ───────────────────────── */

/** Absolute prefix shown by `pwd` and accepted by path resolution. */
export const HOME_PREFIX = '/Users/jignesh'

/** Pure path math: returns a normalized absolute path (no existence check). */
export function normalizePath(cwd: string, input: string): string {
  let raw = input.trim()
  if (raw === '' || raw === '~') return '/'
  if (raw.startsWith('~/')) raw = '/' + raw.slice(2)
  else if (raw.toLowerCase() === HOME_PREFIX.toLowerCase()) raw = '/'
  else if (raw.toLowerCase().startsWith(HOME_PREFIX.toLowerCase() + '/')) raw = raw.slice(HOME_PREFIX.length)
  else if (!raw.startsWith('/')) raw = `${cwd.replace(/\/$/, '')}/${raw}`
  const parts: string[] = []
  for (const part of raw.split('/')) {
    if (!part || part === '.') continue
    if (part === '..') parts.pop()
    else parts.push(part)
  }
  return '/' + parts.join('/')
}

function findChild(dir: VfsNode, segment: string): VfsNode | undefined {
  const s = segment.toLowerCase()
  const kids = dir.children ?? []
  return kids.find((c) => c.name.toLowerCase() === s) ?? kids.find((c) => c.label.toLowerCase() === s)
}

/** Case-insensitive lookup of an absolute path. */
export function getNode(path: string): VfsNode | null {
  const norm = normalizePath('/', path)
  if (norm === '/') return ROOT
  let node: VfsNode | undefined = ROOT
  for (const seg of norm.split('/').filter(Boolean)) {
    if (!node || node.type !== 'folder') return null
    node = findChild(node, seg)
  }
  return node ?? null
}

/** Resolves user input against a working directory; returns the canonical path or null. */
export function resolvePath(cwd: string, input: string): string | null {
  return getNode(normalizePath(cwd, input))?.path ?? null
}

export function listDir(path: string): VfsNode[] {
  const node = getNode(path)
  return node?.type === 'folder' ? (node.children ?? []) : []
}

export function parentPath(path: string): string {
  return normalizePath(path, '..')
}

/** "~/Projects" style display path for prompts. */
export function displayPath(path: string): string {
  return path === '/' ? '~' : `~${path}`
}

/** Every node in the tree (depth-first), for search. */
export function allNodes(node: VfsNode = ROOT): VfsNode[] {
  const out: VfsNode[] = []
  const walk = (n: VfsNode) => {
    for (const c of n.children ?? []) {
      out.push(c)
      if (c.type === 'folder') walk(c)
    }
  }
  walk(node)
  return out
}

/** Text for `cat` and the plain-text preview. Returns null for binary files and folders. */
export function nodeText(node: VfsNode): string | null {
  if (node.type === 'folder') return null
  if (node.text != null) return node.text
  const ref = node.ref
  if (!ref) return null
  switch (ref.type) {
    case 'project': {
      const p = content.projects.find((x) => x.id === ref.id)
      return p ? projectText(p) : null
    }
    case 'experience': {
      const e = content.experience.find((x) => x.id === ref.id)
      return e ? experienceText(e) : null
    }
    case 'education': {
      const ed = content.education.find((x) => x.id === ref.id)
      return ed ? educationText(ed) : null
    }
    case 'credential': {
      const c = content.credentials.find((x) => x.id === ref.id)
      return c ? credentialText(c) : null
    }
    case 'resume-web':
      return `[InternetShortcut]\nURL=${content.site.url}resume/`
    case 'url':
      return `[InternetShortcut]\nURL=${ref.url}`
    default:
      return null
  }
}

/** Formats `modified` for list views: "28 Oct 2026", "Jan 2026", "2024". */
export function formatModified(value?: string): string {
  if (!value) return '—'
  const d = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (d) return new Date(Number(d[1]), Number(d[2]) - 1, Number(d[3])).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  return formatMonth(value)
}

/* ───────────────────────── opening ───────────────────────── */

/** Double-click / tap behaviour shared by Finder, Files and Terminal `open`. */
export function openNode(node: VfsNode): void {
  if (node.type === 'folder') {
    openFolder(node.path)
    return
  }
  switch (node.ref?.type) {
    case 'resume-web':
      openResume()
      return
    case 'url':
      openUrl(node.ref.url)
      return
    case 'app':
      launch(node.ref.id)
      return
    default:
      launch('preview', { path: node.path })
  }
}

/** Looks up the content item behind a file (for Preview). */
export function nodeItem(node: VfsNode) {
  const ref = node.ref
  if (!ref) return null
  switch (ref.type) {
    case 'project':
      return { type: 'project' as const, item: content.projects.find((x) => x.id === ref.id) }
    case 'experience':
      return { type: 'experience' as const, item: content.experience.find((x) => x.id === ref.id) }
    case 'education':
      return { type: 'education' as const, item: content.education.find((x) => x.id === ref.id) }
    case 'credential':
      return { type: 'credential' as const, item: content.credentials.find((x) => x.id === ref.id) }
    default:
      return null
  }
}

