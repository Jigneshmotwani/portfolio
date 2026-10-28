import { content } from '../../data/content'
import bundled from '../../data/github-cache.json'
import { readJSON, writeJSON } from '../../lib/storage'

export interface Repo {
  name: string
  description: string | null
  language: string | null
  stars: number
  forks: number
  fork: boolean
  archived: boolean
  url: string
  homepage: string | null
  pushedAt: string
  topics: string[]
}

export interface GitHubProfile {
  login: string
  name: string | null
  bio: string | null
  location: string | null
  publicRepos: number | null
  followers: number | null
  following: number | null
  avatarUrl: string
  url: string
}

export type DataSource = 'live' | 'cache' | 'bundled'

export interface GitHubData {
  profile: GitHubProfile
  repos: Repo[]
  source: DataSource
  fetchedAt: number
}

/* Raw shapes shared by the GitHub REST API and github-cache.json. */
interface RawRepo {
  name: string
  description: string | null
  language: string | null
  stargazers_count: number
  forks_count: number
  fork: boolean
  archived?: boolean
  html_url: string
  homepage?: string | null
  pushed_at: string
  topics?: string[]
}

interface RawProfile {
  login: string
  name: string | null
  bio: string | null
  location: string | null
  public_repos: number | null
  followers: number | null
  following: number | null
  avatar_url: string
  html_url: string
}

const CACHE_KEY = 'jos.github.v1'
const TTL = 60 * 60 * 1000
export const username = content.contact.githubUsername

const toRepo = (r: RawRepo): Repo => ({
  name: r.name,
  description: r.description,
  language: r.language,
  stars: r.stargazers_count ?? 0,
  forks: r.forks_count ?? 0,
  fork: !!r.fork,
  archived: !!r.archived,
  url: r.html_url,
  homepage: r.homepage || null,
  pushedAt: r.pushed_at,
  topics: r.topics ?? [],
})

const toProfile = (p: RawProfile): GitHubProfile => ({
  login: p.login,
  name: p.name,
  bio: p.bio,
  location: p.location,
  publicRepos: p.public_repos,
  followers: p.followers,
  following: p.following,
  avatarUrl: p.avatar_url,
  url: p.html_url,
})

interface Cached {
  fetchedAt: number
  profile: GitHubProfile
  repos: Repo[]
}

export function bundledData(): GitHubData {
  return {
    profile: toProfile(bundled.profile as RawProfile),
    repos: (bundled.repos as RawRepo[]).map(toRepo),
    source: 'bundled',
    fetchedAt: Date.parse(bundled.fetchedAt),
  }
}

/** Best data available synchronously: a fresh-enough localStorage copy, else the bundled snapshot. */
export function initialData(): GitHubData {
  const cached = readJSON<Cached | null>(CACHE_KEY, null)
  if (cached?.repos?.length) return { ...cached, source: 'cache' }
  return bundledData()
}

export function isFresh(data: GitHubData) {
  return data.source !== 'bundled' && Date.now() - data.fetchedAt < TTL
}

async function getJSON<T>(path: string, signal: AbortSignal): Promise<T> {
  const res = await fetch(`https://api.github.com${path}`, {
    headers: { Accept: 'application/vnd.github+json' },
    signal,
  })
  if (!res.ok) throw new Error(`GitHub API ${res.status}`)
  return res.json() as Promise<T>
}

/** Fetches live data (8s timeout). Falls back to the cached / bundled copy on any failure. */
export async function loadGitHub(signal?: AbortSignal): Promise<GitHubData> {
  const ctrl = new AbortController()
  const timer = window.setTimeout(() => ctrl.abort(), 8000)
  const onAbort = () => ctrl.abort()
  signal?.addEventListener('abort', onAbort)
  try {
    const [profile, repos] = await Promise.all([
      getJSON<RawProfile>(`/users/${username}`, ctrl.signal),
      getJSON<RawRepo[]>(`/users/${username}/repos?per_page=100&sort=updated`, ctrl.signal),
    ])
    const data: Cached = { fetchedAt: Date.now(), profile: toProfile(profile), repos: repos.map(toRepo) }
    writeJSON(CACHE_KEY, data)
    return { ...data, source: 'live' }
  } catch {
    return initialData()
  } finally {
    window.clearTimeout(timer)
    signal?.removeEventListener('abort', onAbort)
  }
}

export const LANGUAGE_COLORS: Record<string, string> = {
  TypeScript: '#3178c6',
  JavaScript: '#f1e05a',
  Python: '#3572A5',
  Java: '#b07219',
  C: '#555555',
  'C++': '#f34b7d',
  'C#': '#178600',
  Go: '#00ADD8',
  Rust: '#dea584',
  HTML: '#e34c26',
  CSS: '#663399',
  'Jupyter Notebook': '#DA5B0B',
  Shell: '#89e051',
  Kotlin: '#A97BFF',
  Swift: '#F05138',
  Dart: '#00B4AB',
  Ruby: '#701516',
  PHP: '#4F5D95',
  Vue: '#41b883',
  Svelte: '#ff3e00',
}

export const languageColor = (lang: string | null) => (lang ? (LANGUAGE_COLORS[lang] ?? '#8e8e93') : '#8e8e93')
