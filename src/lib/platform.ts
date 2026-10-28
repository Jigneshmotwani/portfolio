import { useMediaQuery } from './hooks'

export type Platform = 'mac' | 'ios'

/** Viewports narrower than this get the iOS experience. */
export const MOBILE_BREAKPOINT = 768

export function usePlatform(): Platform {
  return useMediaQuery(`(min-width: ${MOBILE_BREAKPOINT}px)`) ? 'mac' : 'ios'
}

export function currentPlatform(): Platform {
  return typeof window !== 'undefined' && window.innerWidth >= MOBILE_BREAKPOINT ? 'mac' : 'ios'
}

export const isApplePlatform =
  typeof navigator !== 'undefined' && /Mac|iPhone|iPad|iPod/i.test(navigator.platform || navigator.userAgent)

/** "⌘" on Apple devices, "Ctrl" elsewhere. */
export const modKey = isApplePlatform ? '⌘' : 'Ctrl'
