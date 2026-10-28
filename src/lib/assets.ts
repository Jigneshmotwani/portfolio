/**
 * Resolves paths to files in /public. The build uses a relative base, so in
 * production we derive the site root from this module's own URL (every built
 * chunk lives in /assets, so "../" is the root). This keeps working on a
 * GitHub Pages sub-path, a custom domain, and the /resume/ page alike.
 */
const ROOT = import.meta.env.DEV ? '/' : new URL('../', import.meta.url).href

export function asset(path: string): string {
  if (!path) return path
  if (/^(https?:|data:|blob:|mailto:|tel:)/.test(path)) return path
  return ROOT + path.replace(/^\.?\//, '')
}

export const siteRoot = ROOT
