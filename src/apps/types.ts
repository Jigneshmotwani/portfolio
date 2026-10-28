import { createContext, useContext } from 'react'
import type { Platform } from '../lib/platform'

export type AppId =
  | 'finder'
  | 'safari'
  | 'mail'
  | 'photos'
  | 'contacts'
  | 'notes'
  | 'terminal'
  | 'github'
  | 'settings'
  | 'assistant'
  | 'tetris'
  | 'chess'
  | 'preview'

/**
 * Launch parameters ("intents"). Every launch gets a fresh `nonce`, so a
 * singleton app that is already open can react to a new request with
 * `useEffect(..., [params?.nonce])`.
 */
export interface AppParams {
  /** Finder: folder path like "/Projects"; Preview: file path like "/Resume/Jignesh_Motwani_Resume.pdf". */
  path?: string
  /** Safari: URL or internal page ("jignesh://projects/ross"). */
  url?: string
  /** Mail: compose fields. */
  to?: string
  subject?: string
  body?: string
  /** Photos. */
  album?: string
  photo?: string
  /** Notes: note id. */
  note?: string
  /** Settings: section id ("appearance" | "wallpaper" | "sound" | "accessibility" | "about"). */
  section?: string
  /** Ask Jignesh: question to ask immediately. */
  query?: string
  /** Terminal: command to run on open. */
  command?: string
  nonce?: number
}

export interface AppContextValue {
  /** Window id (macOS) or app key (iOS). */
  instanceId: string
  appId: AppId
  platform: Platform
  /** True when this window is focused (macOS) or the app is foreground (iOS). Pause games when false. */
  active: boolean
  params: AppParams | undefined
  /** macOS: window title. iOS: ignored. */
  setTitle: (title: string) => void
  /** Close this window (macOS) or go back to the home screen (iOS). */
  close: () => void
}

export const AppContext = createContext<AppContextValue | null>(null)

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp() must be used inside an app rendered by the shell')
  return ctx
}
