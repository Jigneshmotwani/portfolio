import { lazy, type ComponentType, type LazyExoticComponent } from 'react'
import type { AppIconId } from '../assets/icons'
import type { AppId } from './types'

export interface AppDef {
  id: AppId
  /** macOS name. */
  name: string
  /** iOS name when different (Finder → Files). */
  iosName?: string
  icon: AppIconId
  /** One line for Spotlight / tooltips. */
  description: string
  keywords: string[]
  /** One window max (re-launching focuses it and passes the new params). */
  singleton: boolean
  /** Shown in the macOS Dock. */
  dock: boolean
  /** Shown on the iOS home screen. */
  home: boolean
  window: {
    w: number
    h: number
    minW: number
    minH: number
    /**
     * 'standard': the shell draws a title bar with the title.
     * 'unified': the app draws its own toolbar; the shell only overlays the
     *   traffic lights at top-left (reserve ~78px). Mark draggable areas with
     *   the `data-drag` attribute (interactive children are excluded).
     */
    chrome: 'standard' | 'unified'
    resizable: boolean
  }
  component: LazyExoticComponent<ComponentType>
}

const def = (d: Omit<AppDef, 'component'>, loader: () => Promise<{ default: ComponentType }>): AppDef => ({
  ...d,
  component: lazy(loader),
})

export const apps: Record<AppId, AppDef> = {
  finder: def(
    {
      id: 'finder', name: 'Finder', iosName: 'Files', icon: 'finder',
      description: 'Browse Projects, Resume, Certifications and Experience',
      keywords: ['files', 'folders', 'browse', 'documents'],
      singleton: false, dock: true, home: true,
      window: { w: 860, h: 540, minW: 520, minH: 340, chrome: 'unified', resizable: true },
    },
    () => import('./finder'),
  ),
  assistant: def(
    {
      id: 'assistant', name: 'Ask Jignesh', icon: 'assistant',
      description: 'AI assistant that answers questions about Jignesh',
      keywords: ['ai', 'chat', 'siri', 'ask', 'question', 'assistant', 'bot'],
      singleton: true, dock: true, home: true,
      window: { w: 440, h: 620, minW: 360, minH: 440, chrome: 'unified', resizable: true },
    },
    () => import('./assistant'),
  ),
  safari: def(
    {
      id: 'safari', name: 'Safari', icon: 'safari',
      description: 'Project pages and live demos',
      keywords: ['browser', 'web', 'internet', 'demo', 'website'],
      singleton: true, dock: true, home: true,
      window: { w: 1040, h: 680, minW: 520, minH: 360, chrome: 'unified', resizable: true },
    },
    () => import('./safari'),
  ),
  mail: def(
    {
      id: 'mail', name: 'Mail', icon: 'mail',
      description: 'Send Jignesh an email',
      keywords: ['email', 'message', 'contact', 'write', 'hire'],
      singleton: true, dock: true, home: true,
      window: { w: 820, h: 560, minW: 520, minH: 380, chrome: 'unified', resizable: true },
    },
    () => import('./mail'),
  ),
  photos: def(
    {
      id: 'photos', name: 'Photos', icon: 'photos',
      description: 'Project screenshots and photos',
      keywords: ['gallery', 'images', 'pictures', 'screenshots'],
      singleton: true, dock: true, home: true,
      window: { w: 900, h: 600, minW: 520, minH: 360, chrome: 'unified', resizable: true },
    },
    () => import('./photos'),
  ),
  contacts: def(
    {
      id: 'contacts', name: 'Contacts', icon: 'contacts',
      description: 'Email, LinkedIn, GitHub and location',
      keywords: ['contact', 'email', 'linkedin', 'github', 'phone', 'card', 'vcard'],
      singleton: true, dock: true, home: true,
      window: { w: 680, h: 500, minW: 460, minH: 360, chrome: 'unified', resizable: true },
    },
    () => import('./contacts'),
  ),
  notes: def(
    {
      id: 'notes', name: 'Notes', icon: 'notes',
      description: 'About me and my journey',
      keywords: ['about', 'bio', 'journey', 'story', 'now'],
      singleton: true, dock: true, home: true,
      window: { w: 820, h: 560, minW: 520, minH: 360, chrome: 'unified', resizable: true },
    },
    () => import('./notes'),
  ),
  terminal: def(
    {
      id: 'terminal', name: 'Terminal', icon: 'terminal',
      description: 'A working shell: try help, whoami, ls, projects',
      keywords: ['shell', 'console', 'command', 'cli', 'bash', 'zsh'],
      singleton: false, dock: true, home: true,
      window: { w: 720, h: 460, minW: 420, minH: 260, chrome: 'standard', resizable: true },
    },
    () => import('./terminal'),
  ),
  github: def(
    {
      id: 'github', name: 'GitHub', icon: 'github',
      description: 'Public repositories',
      keywords: ['repos', 'code', 'source', 'open source', 'git'],
      singleton: true, dock: true, home: true,
      window: { w: 860, h: 600, minW: 480, minH: 360, chrome: 'unified', resizable: true },
    },
    () => import('./github'),
  ),
  settings: def(
    {
      id: 'settings', name: 'System Settings', iosName: 'Settings', icon: 'settings',
      description: 'Wallpaper, appearance, accent colour, About This Mac',
      keywords: ['preferences', 'wallpaper', 'dark mode', 'theme', 'accent', 'about this mac', 'sound'],
      singleton: true, dock: true, home: true,
      window: { w: 760, h: 560, minW: 600, minH: 400, chrome: 'unified', resizable: true },
    },
    () => import('./settings'),
  ),
  tetris: def(
    {
      id: 'tetris', name: 'Tetris', icon: 'tetris',
      description: 'Classic falling blocks',
      keywords: ['game', 'play', 'blocks', 'arcade'],
      singleton: true, dock: true, home: true,
      window: { w: 520, h: 640, minW: 420, minH: 520, chrome: 'standard', resizable: true },
    },
    () => import('./tetris'),
  ),
  chess: def(
    {
      id: 'chess', name: 'Chess', icon: 'chess',
      description: 'Play chess against the computer',
      keywords: ['game', 'play', 'board', 'ai'],
      singleton: true, dock: true, home: true,
      window: { w: 820, h: 640, minW: 560, minH: 480, chrome: 'standard', resizable: true },
    },
    () => import('./chess'),
  ),
  preview: def(
    {
      id: 'preview', name: 'Preview', icon: 'preview',
      description: 'View documents and the resume PDF',
      keywords: ['pdf', 'document', 'viewer', 'quick look'],
      singleton: false, dock: false, home: false,
      window: { w: 760, h: 640, minW: 420, minH: 320, chrome: 'standard', resizable: true },
    },
    () => import('./preview'),
  ),
}

export const appList: AppDef[] = Object.values(apps)

/** Dock order (macOS). */
export const dockOrder: AppId[] = [
  'finder', 'assistant', 'safari', 'mail', 'photos', 'contacts', 'notes', 'terminal', 'github', 'settings', 'tetris', 'chess',
]

export function appName(id: AppId, platform: 'mac' | 'ios') {
  const a = apps[id]
  return platform === 'ios' ? (a.iosName ?? a.name) : a.name
}
