import { ArrowUpRight, GitFork, MapPin, RotateCw, Search, Star, Users } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { content } from '../../data/content'
import { asset } from '../../lib/assets'
import { formatRelative } from '../../lib/format'
import { openUrl } from '../../lib/launch'
import { useApp } from '../types'
import { initialData, isFresh, languageColor, loadGitHub, username, type GitHubData, type Repo } from './data'
import './github.css'

type Sort = 'updated' | 'name' | 'stars'

export default function GitHubApp() {
  const { platform, active } = useApp()
  const [data, setData] = useState<GitHubData>(initialData)
  const [loading, setLoading] = useState(() => !isFresh(initialData()))
  const [query, setQuery] = useState('')
  const [lang, setLang] = useState<string | null>(null)
  const [sort, setSort] = useState<Sort>('updated')
  const [hideForks, setHideForks] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)

  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    if (reloadKey === 0 && isFresh(initialData())) return
    let cancelled = false
    const ctrl = new AbortController()
    setLoading(true)
    loadGitHub(ctrl.signal).then((d) => {
      if (cancelled) return
      setData(d)
      setLoading(false)
    })
    return () => {
      cancelled = true
      ctrl.abort()
    }
  }, [reloadKey])

  const refresh = () => setReloadKey((k) => k + 1)

  useEffect(() => {
    if (!active || platform !== 'mac') return
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'f') {
        e.preventDefault()
        searchRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [active, platform])

  const languages = useMemo(() => {
    const counts = new Map<string, number>()
    for (const r of data.repos) if (r.language) counts.set(r.language, (counts.get(r.language) ?? 0) + 1)
    return [...counts.entries()].sort((a, b) => b[1] - a[1])
  }, [data.repos])

  const repos = useMemo(() => {
    const q = query.trim().toLowerCase()
    const list = data.repos.filter(
      (r) =>
        (!hideForks || !r.fork) &&
        (!lang || r.language === lang) &&
        (!q || r.name.toLowerCase().includes(q) || (r.description ?? '').toLowerCase().includes(q) || (r.language ?? '').toLowerCase().includes(q)),
    )
    return list.sort((a, b) =>
      sort === 'name'
        ? a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
        : sort === 'stars'
          ? b.stars - a.stars || Date.parse(b.pushedAt) - Date.parse(a.pushedAt)
          : Date.parse(b.pushedAt) - Date.parse(a.pushedAt),
    )
  }, [data.repos, query, lang, sort, hideForks])

  const badge =
    data.source === 'live' ? null : (
      <span className="gh-badge" title={`Snapshot from ${new Date(data.fetchedAt).toLocaleString()}`}>
        {loading ? 'Updating…' : data.source === 'cache' ? `Showing cached data · ${formatRelative(data.fetchedAt)}` : 'Showing cached data'}
      </span>
    )

  const controls = (
    <div className="gh-controls">
      <select className="gh-select" value={sort} onChange={(e) => setSort(e.target.value as Sort)} aria-label="Sort repositories">
        <option value="updated">Recently updated</option>
        <option value="name">Name</option>
        <option value="stars">Stars</option>
      </select>
      <label className="gh-toggle">
        <input type="checkbox" checked={hideForks} onChange={(e) => setHideForks(e.target.checked)} />
        Hide forks
      </label>
    </div>
  )

  const list = (
    <div className="gh-list" role="list">
      {repos.map((r) => (
        <RepoCard key={r.name} repo={r} />
      ))}
      {!repos.length && <div className="gh-empty">No repositories match “{query || lang}”.</div>}
    </div>
  )

  if (platform === 'ios') {
    return (
      <div className="gh gh--ios">
        <div className="gh-ios-scroll scroll">
          <h1 className="gh-ios-title">GitHub</h1>
          <ProfileCard data={data} compact />
          <div className="gh-ios-search">
            <Search size={16} aria-hidden />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search repositories" aria-label="Search repositories" />
          </div>
          <div className="gh-chips" role="toolbar" aria-label="Filter by language">
            <button className={`gh-chip${!lang ? ' is-on' : ''}`} onClick={() => setLang(null)}>
              All
            </button>
            {languages.map(([l, n]) => (
              <button key={l} className={`gh-chip${lang === l ? ' is-on' : ''}`} onClick={() => setLang(lang === l ? null : l)}>
                <i style={{ background: languageColor(l) }} />
                {l} <span>{n}</span>
              </button>
            ))}
          </div>
          <div className="gh-ios-bar">
            {controls}
            {badge}
          </div>
          {list}
        </div>
      </div>
    )
  }

  return (
    <div className="gh gh--mac">
      <header className="gh-toolbar" data-drag>
        <div className="gh-toolbar__title" data-drag>
          <strong>GitHub</strong>
          <span>@{data.profile.login || username}</span>
        </div>
        <div className="gh-search">
          <Search size={14} aria-hidden />
          <input ref={searchRef} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search repositories" aria-label="Search repositories" />
        </div>
        <button className="gh-icon-btn" onClick={refresh} title="Refresh" aria-label="Refresh">
          <RotateCw size={15} className={loading ? 'gh-spin' : undefined} />
        </button>
        <a className="gh-icon-btn" href={data.profile.url} target="_blank" rel="noopener noreferrer" title="Open on github.com" aria-label="Open on github.com">
          <ArrowUpRight size={16} />
        </a>
      </header>
      <div className="gh-body">
        <aside className="gh-side scroll">
          <ProfileCard data={data} />
          <nav className="gh-langs" aria-label="Filter by language">
            <h3>Languages</h3>
            <button className={`gh-lang${!lang ? ' is-on' : ''}`} onClick={() => setLang(null)}>
              <i style={{ background: 'var(--fg-tertiary)' }} />
              All repositories <span>{data.repos.length}</span>
            </button>
            {languages.map(([l, n]) => (
              <button key={l} className={`gh-lang${lang === l ? ' is-on' : ''}`} onClick={() => setLang(lang === l ? null : l)}>
                <i style={{ background: languageColor(l) }} />
                {l} <span>{n}</span>
              </button>
            ))}
          </nav>
        </aside>
        <main className="gh-main scroll">
          <div className="gh-main__head">
            <h2>
              {lang ?? 'Repositories'} <span>{repos.length}</span>
            </h2>
            {badge}
            {controls}
          </div>
          {list}
        </main>
      </div>
    </div>
  )
}

function ProfileCard({ data, compact = false }: { data: GitHubData; compact?: boolean }) {
  const [avatar, setAvatar] = useState(data.profile.avatarUrl || `https://avatars.githubusercontent.com/${username}`)
  const p = data.profile
  return (
    <section className={`gh-profile${compact ? ' gh-profile--compact' : ''}`}>
      <img
        className="gh-profile__avatar"
        src={avatar}
        alt=""
        onError={() => setAvatar(asset(content.profile.photo))}
        draggable={false}
      />
      <div className="gh-profile__text">
        <h2>{p.name ?? content.profile.name}</h2>
        <p className="gh-profile__login">{p.login}</p>
        {p.bio && <p className="gh-profile__bio">{p.bio}</p>}
        <ul className="gh-profile__meta">
          {p.location && (
            <li>
              <MapPin size={13} aria-hidden /> {p.location}
            </li>
          )}
          <li>
            <BookIcon /> {p.publicRepos ?? data.repos.length} repositories
          </li>
          {p.followers != null && (
            <li>
              <Users size={13} aria-hidden /> {p.followers} followers · {p.following ?? 0} following
            </li>
          )}
        </ul>
        <a className="btn gh-profile__btn" href={p.url} target="_blank" rel="noopener noreferrer">
          View profile on GitHub
        </a>
      </div>
    </section>
  )
}

function BookIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" aria-hidden fill="currentColor">
      <path d="M2 2.5A2.5 2.5 0 0 1 4.5 0h8.75a.75.75 0 0 1 .75.75v12.5a.75.75 0 0 1-.75.75h-2.5a.75.75 0 0 1 0-1.5h1.75v-2h-8a1 1 0 0 0-.714 1.7.75.75 0 1 1-1.072 1.05A2.495 2.495 0 0 1 2 11.5Zm10.5-1h-8a1 1 0 0 0-1 1v6.708A2.486 2.486 0 0 1 4.5 9h8ZM5 12.25a.25.25 0 0 1 .25-.25h3.5a.25.25 0 0 1 .25.25v3.25a.25.25 0 0 1-.4.2l-1.45-1.087a.249.249 0 0 0-.3 0L5.4 15.7a.25.25 0 0 1-.4-.2Z" />
    </svg>
  )
}

function RepoCard({ repo }: { repo: Repo }) {
  const open = () => openUrl(repo.url)
  return (
    <article
      className="gh-repo"
      role="listitem"
      tabIndex={0}
      onClick={open}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          open()
        }
      }}
      aria-label={`${repo.name}${repo.description ? `: ${repo.description}` : ''}`}
    >
      <div className="gh-repo__head">
        <BookIcon />
        <h3>{repo.name}</h3>
        {repo.fork && <span className="gh-repo__tag">Fork</span>}
        {repo.archived && <span className="gh-repo__tag">Archived</span>}
        <a
          className="gh-repo__ext"
          href={repo.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          title="Open on github.com"
          aria-label={`Open ${repo.name} on github.com`}
        >
          <ArrowUpRight size={15} />
        </a>
      </div>
      <p className={`gh-repo__desc${repo.description ? '' : ' is-empty'}`}>{repo.description ?? 'No description provided.'}</p>
      <div className="gh-repo__meta">
        {repo.language && (
          <span>
            <i style={{ background: languageColor(repo.language) }} />
            {repo.language}
          </span>
        )}
        {repo.stars > 0 && (
          <span>
            <Star size={13} aria-hidden /> {repo.stars}
          </span>
        )}
        {repo.forks > 0 && (
          <span>
            <GitFork size={13} aria-hidden /> {repo.forks}
          </span>
        )}
        <span>Updated {formatUpdated(repo.pushedAt)}</span>
      </div>
    </article>
  )
}

function formatUpdated(iso: string) {
  const t = Date.parse(iso)
  if (Number.isNaN(t)) return ''
  const days = (Date.now() - t) / 86400000
  if (days < 30) return formatRelative(t)
  return `on ${new Date(t).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`
}
