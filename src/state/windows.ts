import { create } from 'zustand'
import type { AppId, AppParams } from '../apps/types'
import { apps } from '../apps/registry'

/** macOS window manager state. Geometry is in CSS pixels relative to the viewport. */
export const MENUBAR_HEIGHT = 28
/** Space kept free at the bottom for the Dock when windows are zoomed. */
export const DOCK_RESERVE = 84

export interface Bounds {
  x: number
  y: number
  w: number
  h: number
}

export interface WindowState extends Bounds {
  id: string
  appId: AppId
  title: string
  z: number
  minimized: boolean
  maximized: boolean
  /** Bounds to restore when un-zooming. */
  restore?: Bounds
  params?: AppParams
  /** 'closing' plays the close animation before removal. */
  status: 'open' | 'closing'
  createdAt: number
}

interface WindowStore {
  windows: WindowState[]
  focusedId: string | null
  zTop: number
  /** Opens a new window, or focuses (and re-targets) a singleton app's existing window. */
  open: (appId: AppId, params?: AppParams) => string
  /** Starts the close animation; the window is removed shortly after. */
  close: (id: string) => void
  remove: (id: string) => void
  focus: (id: string) => void
  minimize: (id: string) => void
  unminimize: (id: string) => void
  toggleMaximize: (id: string) => void
  setBounds: (id: string, bounds: Partial<Bounds>) => void
  setTitle: (id: string, title: string) => void
  /** Closes every window of an app ("Quit"). */
  quitApp: (appId: AppId) => void
  /** Dock click: focus the app's frontmost window (restoring if minimized) or open one. */
  activateApp: (appId: AppId) => void
}

let counter = 0

export function workArea() {
  const vw = typeof window === 'undefined' ? 1440 : window.innerWidth
  const vh = typeof window === 'undefined' ? 900 : window.innerHeight
  return { x: 0, y: MENUBAR_HEIGHT, w: vw, h: vh - MENUBAR_HEIGHT - DOCK_RESERVE }
}

function initialBounds(appId: AppId, existing: WindowState[]): Bounds {
  const def = apps[appId]
  const area = workArea()
  const w = Math.min(def.window.w, area.w - 40)
  const h = Math.min(def.window.h, area.h - 24)
  const visible = existing.filter((win) => win.status === 'open' && !win.minimized).length
  const offset = (visible % 7) * 26
  const x = Math.max(8, Math.round(area.x + (area.w - w) / 2 - 90 + offset))
  const y = Math.max(area.y + 8, Math.round(area.y + Math.max(12, (area.h - h) / 2.4) + offset))
  return { x, y, w, h }
}

export const useWindows = create<WindowStore>()((set, get) => ({
  windows: [],
  focusedId: null,
  zTop: 10,

  open: (appId, params) => {
    const def = apps[appId]
    const { windows, zTop } = get()
    const stamped = params ? { ...params, nonce: Date.now() + Math.random() } : undefined
    if (def.singleton) {
      const existing = windows.find((w) => w.appId === appId && w.status === 'open')
      if (existing) {
        set({
          windows: windows.map((w) =>
            w.id === existing.id ? { ...w, minimized: false, z: zTop + 1, params: stamped ?? w.params } : w,
          ),
          focusedId: existing.id,
          zTop: zTop + 1,
        })
        return existing.id
      }
    }
    const id = `${appId}-${++counter}`
    const win: WindowState = {
      id,
      appId,
      title: def.name,
      ...initialBounds(appId, windows),
      z: zTop + 1,
      minimized: false,
      maximized: false,
      params: stamped,
      status: 'open',
      createdAt: Date.now(),
    }
    set({ windows: [...windows, win], focusedId: id, zTop: zTop + 1 })
    return id
  },

  close: (id) => {
    set((s) => ({
      windows: s.windows.map((w) => (w.id === id ? { ...w, status: 'closing' } : w)),
    }))
    const next = topWindow(get().windows.filter((w) => w.id !== id))
    set({ focusedId: next?.id ?? null })
    window.setTimeout(() => get().remove(id), 200)
  },

  remove: (id) => set((s) => ({ windows: s.windows.filter((w) => w.id !== id) })),

  focus: (id) => {
    const { windows, zTop, focusedId } = get()
    const win = windows.find((w) => w.id === id)
    if (!win) return
    if (focusedId === id && win.z === zTop) return
    set({
      windows: windows.map((w) => (w.id === id ? { ...w, z: zTop + 1, minimized: false } : w)),
      focusedId: id,
      zTop: zTop + 1,
    })
  },

  minimize: (id) => {
    set((s) => ({ windows: s.windows.map((w) => (w.id === id ? { ...w, minimized: true } : w)) }))
    const next = topWindow(get().windows)
    set({ focusedId: next?.id ?? null })
  },

  unminimize: (id) => get().focus(id),

  toggleMaximize: (id) => {
    const area = workArea()
    set((s) => ({
      windows: s.windows.map((w) => {
        if (w.id !== id) return w
        if (w.maximized && w.restore) return { ...w, ...w.restore, maximized: false, restore: undefined }
        return {
          ...w,
          restore: { x: w.x, y: w.y, w: w.w, h: w.h },
          x: area.x,
          y: area.y,
          w: area.w,
          h: area.h,
          maximized: true,
        }
      }),
    }))
  },

  setBounds: (id, bounds) =>
    set((s) => ({ windows: s.windows.map((w) => (w.id === id ? { ...w, ...bounds } : w)) })),

  setTitle: (id, title) =>
    set((s) => ({ windows: s.windows.map((w) => (w.id === id && w.title !== title ? { ...w, title } : w)) })),

  quitApp: (appId) => {
    for (const w of get().windows) if (w.appId === appId && w.status === 'open') get().close(w.id)
  },

  activateApp: (appId) => {
    const own = get().windows.filter((w) => w.appId === appId && w.status === 'open')
    if (!own.length) {
      get().open(appId)
      return
    }
    const target = own.reduce((a, b) => (b.z > a.z ? b : a))
    get().focus(target.id)
  },
}))

function topWindow(windows: WindowState[]) {
  return windows
    .filter((w) => w.status === 'open' && !w.minimized)
    .reduce<WindowState | undefined>((a, b) => (!a || b.z > a.z ? b : a), undefined)
}

/** The app whose name shows in the menu bar (Finder when nothing is focused). */
export function useActiveAppId(): AppId {
  return useWindows((s) => s.windows.find((w) => w.id === s.focusedId)?.appId ?? 'finder')
}
