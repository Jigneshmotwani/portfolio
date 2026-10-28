#!/usr/bin/env node
/**
 * Refreshes src/data/github-cache.json, the offline fallback used by the
 * GitHub app when the GitHub API is unreachable or rate-limited.
 *
 *   npm run cache:github
 *   GITHUB_TOKEN=ghp_xxx npm run cache:github   # optional, raises the rate limit
 *
 * The username is read from src/data/content.ts (contact.githubUsername).
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const contentSrc = readFileSync(resolve(root, 'src/data/content.ts'), 'utf8')
const username = process.argv[2] || /githubUsername:\s*'([^']+)'/.exec(contentSrc)?.[1]
if (!username) {
  console.error('Could not find contact.githubUsername in src/data/content.ts (or pass a username as an argument).')
  process.exit(1)
}

const headers = { Accept: 'application/vnd.github+json', 'User-Agent': 'jignesh-os-cache-script' }
if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`

async function get(path) {
  const res = await fetch(`https://api.github.com${path}`, { headers })
  if (!res.ok) throw new Error(`GET ${path} → ${res.status} ${res.statusText}`)
  return res.json()
}

try {
  const [user, repos] = await Promise.all([
    get(`/users/${username}`),
    get(`/users/${username}/repos?per_page=100&sort=updated`),
  ])
  const data = {
    fetchedAt: new Date().toISOString(),
    source: 'GitHub REST API snapshot. Regenerate with `npm run cache:github`.',
    profile: {
      login: user.login,
      name: user.name,
      bio: user.bio,
      location: user.location,
      public_repos: user.public_repos,
      followers: user.followers,
      following: user.following,
      avatar_url: user.avatar_url,
      html_url: user.html_url,
      blog: user.blog || null,
    },
    repos: repos.map((r) => ({
      name: r.name,
      description: r.description,
      language: r.language,
      stargazers_count: r.stargazers_count,
      forks_count: r.forks_count,
      fork: r.fork,
      html_url: r.html_url,
      homepage: r.homepage || null,
      pushed_at: r.pushed_at,
      topics: r.topics ?? [],
      archived: r.archived,
    })),
  }
  const out = resolve(root, 'src/data/github-cache.json')
  writeFileSync(out, JSON.stringify(data, null, 2) + '\n')
  console.log(`Cached ${data.repos.length} repos for ${username} → ${out}`)
} catch (err) {
  console.error(`Failed to refresh the GitHub cache: ${err.message}`)
  process.exit(1)
}
