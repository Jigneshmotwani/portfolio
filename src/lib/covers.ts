import { svgUrl } from '../assets/icons'
import type { Project } from '../data/types'

/**
 * Generated cover art for a project (16:10 SVG data URI). Used by Photos,
 * Safari, Finder and Preview until real screenshots are added to
 * `project.screenshots` in content.ts.
 */

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/** Small deterministic PRNG so each project gets a stable layout. */
function rng(seed: string) {
  let h = 2166136261
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619)
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507)
    h = Math.imul(h ^ (h >>> 13), 3266489909)
    h ^= h >>> 16
    return (h >>> 0) / 4294967296
  }
}

function wrap(text: string, max: number, lines: number): string[] {
  const words = text.split(/\s+/)
  const out: string[] = []
  let line = ''
  for (const w of words) {
    if ((line + ' ' + w).trim().length > max) {
      out.push(line.trim())
      line = w
      if (out.length === lines) break
    } else line += ' ' + w
  }
  if (out.length < lines && line.trim()) out.push(line.trim())
  if (out.length === lines && words.join(' ').length > out.join(' ').length) {
    out[lines - 1] = out[lines - 1].replace(/[,.;:]?$/, '…')
  }
  return out
}

const FONT = `-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Helvetica Neue', Inter, 'Segoe UI', Roboto, sans-serif`

export function projectCoverSvg(p: Project): string {
  const r = rng(p.id)
  const { from, to, glyph } = p.cover
  const blobs = Array.from({ length: 4 }, (_, i) => {
    const cx = Math.round(80 + r() * 640)
    const cy = Math.round(40 + r() * 420)
    const rad = Math.round(90 + r() * 170)
    return `<circle cx="${cx}" cy="${cy}" r="${rad}" fill="#fff" opacity="${(0.05 + r() * 0.08).toFixed(2)}"${i % 2 ? ' filter="url(#soft)"' : ''}/>`
  }).join('')
  const rings = Array.from({ length: 5 }, (_, i) =>
    `<circle cx="640" cy="170" r="${70 + i * 46}" fill="none" stroke="#fff" stroke-opacity="${(0.16 - i * 0.025).toFixed(3)}" stroke-width="1.5"/>`,
  ).join('')
  const tagline = wrap(p.tagline, 40, 2)
  const nameSize = p.name.length > 22 ? 40 : p.name.length > 14 ? 48 : 58
  const chip = esc(`${p.context} · ${p.year}`)
  const chipW = Math.round(chip.length * 7.6 + 32)

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" width="800" height="500">
<defs>
<linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient>
<linearGradient id="shade" x1="0" y1="0" x2="0" y2="1"><stop offset=".45" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".38"/></linearGradient>
<linearGradient id="tile" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".34"/><stop offset="1" stop-color="#fff" stop-opacity=".12"/></linearGradient>
<pattern id="dots" width="22" height="22" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.4" fill="#fff" opacity=".16"/></pattern>
<filter id="soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="24"/></filter>
<filter id="drop" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="10" stdDeviation="14" flood-color="#000" flood-opacity=".25"/></filter>
</defs>
<rect width="800" height="500" fill="url(#g)"/>
${blobs}
<rect width="800" height="500" fill="url(#dots)"/>
${rings}
<g filter="url(#drop)">
<rect x="565" y="95" width="150" height="150" rx="36" fill="url(#tile)" stroke="#fff" stroke-opacity=".45" stroke-width="1.5"/>
</g>
<text x="640" y="172" font-size="78" text-anchor="middle" dominant-baseline="central" font-family="'Apple Color Emoji','Segoe UI Emoji','Noto Color Emoji',sans-serif">${esc(glyph)}</text>
<rect width="800" height="500" fill="url(#shade)"/>
<rect x="48" y="44" width="${chipW}" height="34" rx="17" fill="#fff" fill-opacity=".2" stroke="#fff" stroke-opacity=".35"/>
<text x="${48 + chipW / 2}" y="66" font-size="15" font-weight="600" text-anchor="middle" fill="#fff" font-family="${FONT}">${chip}</text>
<text x="48" y="${tagline.length > 1 ? 352 : 384}" font-size="${nameSize}" font-weight="800" fill="#fff" letter-spacing="-1" font-family="${FONT}">${esc(p.name)}</text>
${tagline
  .map(
    (line, i) =>
      `<text x="50" y="${(tagline.length > 1 ? 398 : 430) + i * 32}" font-size="24" font-weight="500" fill="#fff" fill-opacity=".9" font-family="${FONT}">${esc(line)}</text>`,
  )
  .join('')}
</svg>`
}

const cache = new Map<string, string>()

/** Generated cover art for a project (data: URI). */
export function projectCoverUrl(p: Project): string {
  let url = cache.get(p.id)
  if (!url) {
    url = svgUrl(projectCoverSvg(p))
    cache.set(p.id, url)
  }
  return url
}
