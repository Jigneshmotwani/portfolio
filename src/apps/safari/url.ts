import { content } from '../../data/content'
import type { Project } from '../../data/types'
import { hostOf } from '../../lib/format'

/** Internal pages live on the "jignesh://" scheme and are rendered by React. */
export const START_URL = 'jignesh://start'

export type Route =
  | { kind: 'start' }
  | { kind: 'projects' }
  | { kind: 'project'; project: Project }
  | { kind: 'search'; query: string }
  | { kind: 'missing'; url: string }
  | { kind: 'web'; url: string; frameable: boolean }

export const isInternal = (url: string) => url.startsWith('jignesh://')

export function projectUrl(p: Project) {
  return `jignesh://projects/${p.id}`
}

/** Address-bar input → URL. Plain words become an internal search. */
export function normalizeInput(raw: string): string {
  const input = raw.trim()
  if (!input) return START_URL
  if (/^jignesh:\/\//i.test(input)) return input.toLowerCase()
  if (/^https?:\/\//i.test(input)) return input
  if (!/\s/.test(input) && /^[\w-]+(\.[\w-]+)+(:\d+)?(\/.*)?$/.test(input)) return `https://${input}`
  if (/^localhost(:\d+)?(\/.*)?$/.test(input)) return `http://${input}`
  return `jignesh://search?q=${encodeURIComponent(input)}`
}

function demoProject(url: string) {
  return content.projects.find((p) => p.links.demo && p.embeddable && sameUrl(p.links.demo, url))
}

function sameUrl(a: string, b: string) {
  const strip = (s: string) => s.replace(/\/+$/, '').replace(/^https?:\/\//, '')
  return strip(a) === strip(b)
}

/** Only hosts known to allow being framed are shown in an iframe. */
export function isFrameable(url: string): boolean {
  try {
    const u = new URL(url)
    if (u.protocol !== 'https:' && u.protocol !== 'http:') return false
    const host = u.hostname
    if (host === 'localhost' || host === '127.0.0.1') return true
    if (typeof window !== 'undefined' && host === window.location.hostname) return true
    if (host.endsWith('.github.io')) return true
    return !!demoProject(url)
  } catch {
    return false
  }
}

export function route(url: string): Route {
  if (!isInternal(url)) return { kind: 'web', url, frameable: isFrameable(url) }
  const rest = url.slice('jignesh://'.length)
  const [path, query = ''] = rest.split('?')
  const parts = path.split('/').filter(Boolean)
  if (!parts.length || parts[0] === 'start') return { kind: 'start' }
  if (parts[0] === 'projects') {
    if (parts.length === 1) return { kind: 'projects' }
    const project = content.projects.find((p) => p.id === parts[1])
    return project ? { kind: 'project', project } : { kind: 'missing', url }
  }
  if (parts[0] === 'search') return { kind: 'search', query: new URLSearchParams(query).get('q') ?? '' }
  return { kind: 'missing', url }
}

/** Friendly page title for tabs. */
export function titleFor(url: string): string {
  const r = route(url)
  switch (r.kind) {
    case 'start':
      return 'Start Page'
    case 'projects':
      return 'Projects'
    case 'project':
      return r.project.name
    case 'search':
      return `“${r.query}”`
    case 'missing':
      return 'Page Not Found'
    case 'web': {
      const project = content.projects.find((p) => p.links.github && sameUrl(p.links.github, url))
      const host = hostOf(url)
      if (host === 'github.com') {
        const path = new URL(url).pathname.split('/').filter(Boolean)
        if (project) return `${path.join('/')} · GitHub`
        return path.length ? `${path.join('/')} · GitHub` : 'GitHub'
      }
      if (host === 'linkedin.com') return `${content.profile.name} | LinkedIn`
      const bookmark = content.bookmarks.find((b) => sameUrl(b.url, url))
      return bookmark?.title ?? host
    }
  }
}

/** What the address bar shows while not editing. */
export function displayUrl(url: string): string {
  if (url === START_URL) return ''
  if (isInternal(url)) return url
  return hostOf(url)
}

/** The project a URL is about (internal page or its GitHub repo), if any. */
export function projectFor(url: string): Project | undefined {
  const r = route(url)
  if (r.kind === 'project') return r.project
  return content.projects.find((p) => (p.links.github && sameUrl(p.links.github, url)) || (p.links.demo && sameUrl(p.links.demo, url)))
}

/** A real https URL for sharing / opening outside the simulator. */
export function shareableUrl(url: string): string {
  if (!isInternal(url)) return url
  const p = projectFor(url)
  return p?.links.github ?? p?.links.demo ?? content.site.url
}

/** Stable colour for a host's tile. */
export function hostColor(host: string) {
  const palette = ['#0A84FF', '#5E5CE6', '#BF5AF2', '#FF375F', '#FF9F0A', '#30D158', '#64D2FF', '#AC8E68']
  let h = 0
  for (const c of host) h = (h * 31 + c.charCodeAt(0)) >>> 0
  return palette[h % palette.length]
}
