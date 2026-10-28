import type { AppId, AppParams } from '../apps/types'
import { useIOS, type Rect } from '../state/ios'
import { useSystem } from '../state/system'
import { useWindows } from '../state/windows'
import { currentPlatform } from './platform'
import { playSound } from './sound'

/**
 * Opens an app on whichever shell is showing. Use this everywhere (Spotlight,
 * Terminal `open`, notifications, assistant suggestions) instead of touching
 * the window / iOS stores directly.
 */
export function launch(appId: AppId, params?: AppParams, opts: { origin?: Rect | null } = {}) {
  const sys = useSystem.getState()
  sys.closeOverlays()
  if (sys.resumeOpen) sys.closeResume()
  playSound('open')
  if (currentPlatform() === 'mac') {
    useWindows.getState().open(appId, params)
    return
  }
  if (appId === 'assistant') {
    sys.openSiri(params?.query)
    return
  }
  useIOS.getState().open(appId, params, opts.origin)
}

/** Desktop folders / Files locations. */
export const FOLDERS = {
  projects: '/Projects',
  resume: '/Resume',
  certifications: '/Certifications',
  experience: '/Experience',
} as const

export function openFolder(path: string) {
  launch('finder', { path })
}

export function openResume() {
  useSystem.getState().openResume()
}

export function openUrl(url: string) {
  launch('safari', { url })
}

export function composeMail(fields: { to?: string; subject?: string; body?: string } = {}) {
  launch('mail', fields)
}

export function askJignesh(query?: string) {
  launch('assistant', query ? { query } : undefined)
}

/** Rect of a DOM element, for iOS zoom-from-icon animations. */
export function rectOf(el: Element | null | undefined): Rect | null {
  if (!el) return null
  const r = el.getBoundingClientRect()
  return { x: r.left, y: r.top, w: r.width, h: r.height }
}
