import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { safeLocalStorage } from '../lib/storage'

export type ThemePref = 'auto' | 'light' | 'dark'

export const ACCENTS = {
  blue: { label: 'Blue', light: '#007aff', dark: '#0a84ff' },
  purple: { label: 'Purple', light: '#a550d6', dark: '#bf5af2' },
  pink: { label: 'Pink', light: '#f7376b', dark: '#ff375f' },
  red: { label: 'Red', light: '#ff3b30', dark: '#ff453a' },
  orange: { label: 'Orange', light: '#f58a00', dark: '#ff9f0a' },
  yellow: { label: 'Yellow', light: '#e6b800', dark: '#ffd60a' },
  green: { label: 'Green', light: '#28b446', dark: '#32d74b' },
  graphite: { label: 'Graphite', light: '#808086', dark: '#98989d' },
} as const
export type AccentId = keyof typeof ACCENTS

export const WALLPAPERS = [
  { id: 'dunes', name: 'Dunes', src: 'wallpapers/dunes.svg', tone: 'light', tint: '#f0a9a0' },
  { id: 'lagoon', name: 'Lagoon', src: 'wallpapers/lagoon.svg', tone: 'dark', tint: '#1d5fa0' },
  { id: 'aurora', name: 'Aurora', src: 'wallpapers/aurora.svg', tone: 'dark', tint: '#123a4a' },
  { id: 'bloom', name: 'Bloom', src: 'wallpapers/bloom.svg', tone: 'light', tint: '#f3b6cf' },
  { id: 'skyline', name: 'Skyline', src: 'wallpapers/skyline.svg', tone: 'dark', tint: '#5a3f8a' },
  { id: 'graphite', name: 'Graphite', src: 'wallpapers/graphite.svg', tone: 'dark', tint: '#2a2b30' },
] as const
export type WallpaperId = (typeof WALLPAPERS)[number]['id']

export function wallpaperById(id: string) {
  return WALLPAPERS.find((w) => w.id === id) ?? WALLPAPERS[0]
}

export interface SettingsValues {
  theme: ThemePref
  accent: AccentId
  wallpaper: WallpaperId
  /** Sound effects volume 0..1 (UI clicks, notification chime, game sounds, music). */
  volume: number
  muted: boolean
  /** null = follow the OS "reduce motion" setting. */
  reduceMotion: boolean | null
  /** Screen brightness 0.35..1 (dims everything with an overlay). */
  brightness: number
  /** Do Not Disturb: notifications go straight to Notification Center, no banner. */
  dnd: boolean
  dockMagnification: boolean
}

interface SettingsState extends SettingsValues {
  update: (patch: Partial<SettingsValues>) => void
  reset: () => void
}

const defaults: SettingsValues = {
  theme: 'auto',
  accent: 'blue',
  wallpaper: 'dunes',
  volume: 0.6,
  muted: false,
  reduceMotion: null,
  brightness: 1,
  dnd: false,
  dockMagnification: true,
}

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      ...defaults,
      update: (patch) => set(patch),
      reset: () => set(defaults),
    }),
    {
      name: 'jos.settings.v1',
      storage: createJSONStorage(() => safeLocalStorage),
      partialize: ({ update: _u, reset: _r, ...values }) => values,
    },
  ),
)
