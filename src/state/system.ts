import { create } from 'zustand'
import { readJSON, writeJSON } from '../lib/storage'

/**
 * Session-level UI state shared by both shells: boot/lock phases and which
 * system overlays are open. Overlays are mutually exclusive-ish: opening one
 * closes the others via `closeOverlays`.
 */
export type MacPhase = 'boot' | 'login' | 'desktop'
export type IosPhase = 'lock' | 'home'

const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams()
/** ?skipboot (or a previous login this session) jumps straight to the desktop / home screen. */
const skipBoot = params.has('skipboot') || params.has('open') || readJSON('jos.loggedIn', false, 'session')

interface SystemState {
  macPhase: MacPhase
  iosPhase: IosPhase
  resumeOpen: boolean
  spotlight: { open: boolean; query: string }
  controlCenter: boolean
  notificationCenter: boolean
  missionControl: boolean
  siri: { open: boolean; query: string; nonce: number }
  setMacPhase: (phase: MacPhase) => void
  setIosPhase: (phase: IosPhase) => void
  /** Called once the user reaches the desktop / home screen. */
  markLoggedIn: () => void
  openResume: () => void
  closeResume: () => void
  openSpotlight: (query?: string) => void
  closeSpotlight: () => void
  setSpotlightQuery: (query: string) => void
  toggleControlCenter: (open?: boolean) => void
  toggleNotificationCenter: (open?: boolean) => void
  toggleMissionControl: (open?: boolean) => void
  /** iOS Siri-style overlay for Ask Jignesh. */
  openSiri: (query?: string) => void
  closeSiri: () => void
  closeOverlays: () => void
}

const closed = {
  spotlight: { open: false, query: '' },
  controlCenter: false,
  notificationCenter: false,
  missionControl: false,
}

export const useSystem = create<SystemState>()((set, get) => ({
  macPhase: skipBoot ? 'desktop' : 'boot',
  iosPhase: skipBoot ? 'home' : 'lock',
  resumeOpen: false,
  ...closed,
  siri: { open: false, query: '', nonce: 0 },
  setMacPhase: (macPhase) => set({ macPhase }),
  setIosPhase: (iosPhase) => set({ iosPhase }),
  markLoggedIn: () => writeJSON('jos.loggedIn', true, 'session'),
  openResume: () => set({ ...closed, resumeOpen: true }),
  closeResume: () => set({ resumeOpen: false }),
  openSpotlight: (query = '') => set({ ...closed, spotlight: { open: true, query } }),
  closeSpotlight: () => set({ spotlight: { open: false, query: '' } }),
  setSpotlightQuery: (query) => set({ spotlight: { open: true, query } }),
  toggleControlCenter: (open) => set({ ...closed, controlCenter: open ?? !get().controlCenter }),
  toggleNotificationCenter: (open) => set({ ...closed, notificationCenter: open ?? !get().notificationCenter }),
  toggleMissionControl: (open) => set({ ...closed, missionControl: open ?? !get().missionControl }),
  openSiri: (query = '') => set({ ...closed, siri: { open: true, query, nonce: Date.now() } }),
  closeSiri: () => set({ siri: { ...get().siri, open: false } }),
  closeOverlays: () => set(closed),
}))

/** URL params read once at startup (dev/testing helpers and deep links). */
export const startupParams = {
  open: params.get('open'),
  harness: params.get('harness'),
}
