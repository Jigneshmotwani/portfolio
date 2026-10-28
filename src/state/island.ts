import { create } from 'zustand'
import type { AppIconId } from '../assets/icons'

/**
 * Live activities shown in the iOS Dynamic Island (and usable elsewhere).
 * Producers call `setActivity` / `clearActivity`; the island shows the one
 * with the highest priority. Suggested priorities: ai 30, game 20, music 10.
 */
export interface IslandActivity {
  id: string
  kind: 'ai' | 'game' | 'music'
  priority: number
  /** Short label for the expanded island, e.g. "Tetris" or "Ask Jignesh is thinking…". */
  title: string
  /** Compact trailing value, e.g. a score "12,400" or "Your move". */
  value?: string
  /** Secondary line in the expanded view. */
  detail?: string
  icon?: AppIconId
  /** Accent colour for the trailing value / equaliser. */
  color?: string
}

interface IslandStore {
  activities: Record<string, IslandActivity>
  setActivity: (a: IslandActivity) => void
  clearActivity: (id: string) => void
}

export const useIsland = create<IslandStore>()((set) => ({
  activities: {},
  setActivity: (a) => set((s) => ({ activities: { ...s.activities, [a.id]: a } })),
  clearActivity: (id) =>
    set((s) => {
      if (!(id in s.activities)) return s
      const next = { ...s.activities }
      delete next[id]
      return { activities: next }
    }),
}))

export function useTopActivity(): IslandActivity | null {
  return useIsland((s) => {
    let top: IslandActivity | null = null
    for (const a of Object.values(s.activities)) if (!top || a.priority > top.priority) top = a
    return top
  })
}
