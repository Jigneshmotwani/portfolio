import { create } from 'zustand'
import type { AppId, AppParams } from '../apps/types'
import { useSettings } from './settings'

export interface AppNotification {
  id: string
  appId: AppId
  title: string
  body: string
  time: number
  read: boolean
  /** What clicking the banner / list item does. */
  action?: { appId: AppId; params?: AppParams }
}

interface NotificationStore {
  items: AppNotification[]
  /** ids currently shown as banners (newest last). */
  banners: string[]
  push: (n: Omit<AppNotification, 'id' | 'time' | 'read'>) => string
  dismissBanner: (id: string) => void
  remove: (id: string) => void
  clearAll: () => void
  markAllRead: () => void
}

let seq = 0

export const useNotifications = create<NotificationStore>()((set) => ({
  items: [],
  banners: [],
  push: (n) => {
    const id = `n${++seq}-${Date.now()}`
    const item: AppNotification = { ...n, id, time: Date.now(), read: false }
    const dnd = useSettings.getState().dnd
    set((s) => ({ items: [item, ...s.items], banners: dnd ? s.banners : [...s.banners, id].slice(-3) }))
    return id
  },
  dismissBanner: (id) => set((s) => ({ banners: s.banners.filter((b) => b !== id) })),
  remove: (id) => set((s) => ({ items: s.items.filter((i) => i.id !== id), banners: s.banners.filter((b) => b !== id) })),
  clearAll: () => set({ items: [], banners: [] }),
  markAllRead: () => set((s) => ({ items: s.items.map((i) => ({ ...i, read: true })) })),
}))
