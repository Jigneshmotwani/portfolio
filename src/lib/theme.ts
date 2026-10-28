import { useEffect, useSyncExternalStore } from 'react'
import { ACCENTS, useSettings } from '../state/settings'
import { useMediaQuery } from './hooks'

/**
 * The "system" theme: an explicit data-theme on <html> set by a host page
 * (e.g. an embedding viewer) wins, otherwise prefers-color-scheme.
 */
function subscribeHostTheme(cb: () => void) {
  const obs = new MutationObserver(cb)
  obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
  return () => obs.disconnect()
}

export function useResolvedTheme(): 'light' | 'dark' {
  const pref = useSettings((s) => s.theme)
  const osDark = useMediaQuery('(prefers-color-scheme: dark)')
  const host = useSyncExternalStore(
    subscribeHostTheme,
    () => document.documentElement.getAttribute('data-theme'),
    () => null,
  )
  if (pref !== 'auto') return pref
  if (host === 'dark' || host === 'light') return host
  return osDark ? 'dark' : 'light'
}

export function useReducedMotion(): boolean {
  const pref = useSettings((s) => s.reduceMotion)
  const os = useMediaQuery('(prefers-reduced-motion: reduce)')
  return pref ?? os
}

/** Applies theme, accent and reduce-motion to <html>. Mount once. */
export function useThemeSync() {
  const theme = useResolvedTheme()
  const accent = useSettings((s) => s.accent)
  const reduce = useReducedMotion()
  useEffect(() => {
    const root = document.documentElement
    root.setAttribute('data-os-theme', theme)
    root.style.colorScheme = theme
    const color = ACCENTS[accent][theme]
    root.style.setProperty('--accent', color)
    root.style.setProperty('--accent-contrast', accent === 'yellow' ? '#1d1d1f' : '#ffffff')
    root.style.setProperty('--accent-soft', `color-mix(in srgb, ${color} 16%, transparent)`)
    root.classList.toggle('reduce-motion', reduce)
  }, [theme, accent, reduce])
}
