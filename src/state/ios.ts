import { create } from 'zustand'
import type { AppId, AppParams } from '../apps/types'

/** iOS app lifecycle: running apps stay mounted so the App Switcher shows live cards. */
export interface RunningApp {
  appId: AppId
  params?: AppParams
  lastActive: number
}

export interface Rect {
  x: number
  y: number
  w: number
  h: number
}

interface IOSStore {
  running: RunningApp[]
  /** Foreground app, or null on the home screen. */
  active: AppId | null
  switcher: boolean
  /** Screen rect of the icon the app launched from (for the zoom animation). */
  origin: Rect | null
  open: (appId: AppId, params?: AppParams, origin?: Rect | null) => void
  goHome: () => void
  kill: (appId: AppId) => void
  setSwitcher: (open: boolean) => void
}

export const useIOS = create<IOSStore>()((set, get) => ({
  running: [],
  active: null,
  switcher: false,
  origin: null,
  open: (appId, params, origin = null) => {
    const stamped = params ? { ...params, nonce: Date.now() + Math.random() } : undefined
    const others = get().running.filter((r) => r.appId !== appId)
    const prev = get().running.find((r) => r.appId === appId)
    set({
      running: [...others, { appId, params: stamped ?? prev?.params, lastActive: Date.now() }],
      active: appId,
      switcher: false,
      origin: origin ?? get().origin,
    })
  },
  goHome: () => set({ active: null, switcher: false }),
  kill: (appId) =>
    set((s) => ({
      running: s.running.filter((r) => r.appId !== appId),
      active: s.active === appId ? null : s.active,
    })),
  setSwitcher: (switcher) => set({ switcher }),
}))
