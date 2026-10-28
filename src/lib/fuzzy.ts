/**
 * Small fuzzy matcher for Spotlight. Scores are 0 (no match) to 1 (exact).
 * Order of preference: exact > prefix > word-prefix > substring > all query
 * words matched (with 1-edit typo tolerance for words of 4+ chars) >
 * in-order subsequence with a gap penalty.
 */

export function normalize(s: string): string {
  return s
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9+#.\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function words(s: string): string[] {
  return normalize(s)
    .split(' ')
    .map((w) => w.replace(/^\.+|\.+$/g, ''))
    .filter(Boolean)
}

/** Optimal string alignment distance (Levenshtein + adjacent transpositions), capped at `max + 1`. */
export function editDistance(a: string, b: string, max = 2): number {
  if (a === b) return 0
  if (Math.abs(a.length - b.length) > max) return max + 1
  const rows = a.length + 1
  const cols = b.length + 1
  const d: number[][] = Array.from({ length: rows }, (_, i) => {
    const row = new Array<number>(cols).fill(0)
    row[0] = i
    return row
  })
  for (let j = 0; j < cols; j++) d[0][j] = j
  for (let i = 1; i < rows; i++) {
    let rowMin = Infinity
    for (let j = 1; j < cols; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      let v = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost)
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) v = Math.min(v, d[i - 2][j - 2] + 1)
      d[i][j] = v
      if (v < rowMin) rowMin = v
    }
    if (rowMin > max) return max + 1
  }
  return d[a.length][b.length]
}

/** How well a single query token matches a single word (0..1). */
export function tokenScore(token: string, word: string): number {
  if (!token || !word) return 0
  if (word === token) return 1
  if (word.startsWith(token)) return 0.85 + 0.1 * (token.length / word.length)
  if (token.length >= 3 && word.includes(token)) return 0.6
  if (token.length >= 4) {
    if (editDistance(token, word, 1) <= 1) return 0.55
    // Typo inside a prefix: "keppl" ~ "keppel", "pyth" ~ "python"
    for (const len of [token.length - 1, token.length, token.length + 1]) {
      if (len >= 3 && len < word.length && editDistance(token, word.slice(0, len), 1) <= 1) return 0.5
    }
  }
  return 0
}

/** In-order subsequence match with a gap penalty (0..~0.45). */
function subsequenceScore(q: string, t: string): number {
  const query = q.replace(/\s/g, '')
  if (query.length < 2) return 0
  let ti = 0
  let first = -1
  let last = -1
  let gaps = 0
  let prev = -1
  for (const ch of query) {
    const found = t.indexOf(ch, ti)
    if (found === -1) return 0
    if (first === -1) first = found
    if (prev !== -1 && found > prev + 1) gaps++
    prev = found
    last = found
    ti = found + 1
  }
  const span = last - first + 1
  const density = query.length / span
  const startBonus = first === 0 || t[first - 1] === ' ' ? 0.06 : 0
  return Math.max(0, 0.22 + 0.2 * density + startBonus - 0.025 * gaps)
}

/** Fuzzy score of `query` against `text` (0..1). */
export function fuzzyScore(query: string, text: string): number {
  const q = normalize(query)
  const t = normalize(text)
  if (!q || !t) return 0
  if (t === q) return 1
  const ratio = q.length / t.length
  if (t.startsWith(q)) return 0.9 + 0.08 * ratio
  const tw = t.split(' ')
  if (tw.some((w) => w.startsWith(q)) || t.includes(` ${q}`)) return 0.8 + 0.08 * ratio
  if (q.length >= 2 && t.includes(q)) return 0.66 + 0.06 * ratio

  // Every query word must match some word of the text.
  const qw = q.split(' ').filter(Boolean)
  let total = 0
  let all = true
  for (const token of qw) {
    let best = 0
    for (const w of tw) {
      const s = tokenScore(token, w)
      if (s > best) best = s
      if (best === 1) break
    }
    if (best === 0) {
      all = false
      break
    }
    total += best
  }
  if (all && qw.length) return 0.42 + 0.2 * (total / qw.length)

  return subsequenceScore(q, t)
}

/** Best score of `query` across several weighted fields. */
export function bestFieldScore(query: string, fields: { text: string; weight: number }[]): number {
  let best = 0
  for (const f of fields) {
    if (!f.text) continue
    const s = fuzzyScore(query, f.text) * f.weight
    if (s > best) best = s
  }
  return best
}
