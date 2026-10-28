/** fetch() + JSON with a hard timeout. Rejects on non-2xx, network errors and timeouts. */
export async function fetchJSON(url: string, timeoutMs = 8000): Promise<unknown> {
  const ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null
  const timer = setTimeout(() => ctrl?.abort(), timeoutMs)
  try {
    const res = await fetch(url, { signal: ctrl?.signal, headers: { Accept: 'application/json' } })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return await res.json()
  } finally {
    clearTimeout(timer)
  }
}
