import { create } from 'zustand'
import { content } from '../data/content'
import { LofiEngine } from '../lib/music'
import { unlockAudio } from '../lib/sound'
import { useIsland } from './island'
import { useSettings } from './settings'

/**
 * Now-playing state for the generative lo-fi player (Control Center,
 * Dynamic Island). play/pause drive the WebAudio synth in src/lib/music.ts.
 */
interface MusicStore {
  playing: boolean
  index: number
  play: () => void
  pause: () => void
  toggle: () => void
  next: () => void
  prev: () => void
}

export const currentTrack = (index: number) => content.music[((index % content.music.length) + content.music.length) % content.music.length]

const engine = new LofiEngine()

function level() {
  const { volume, muted } = useSettings.getState()
  return muted ? 0 : Math.max(0, Math.min(1, volume))
}

function showActivity(index: number) {
  const track = currentTrack(index)
  useIsland.getState().setActivity({ id: 'music', kind: 'music', priority: 10, title: track.title, detail: track.artist, value: '♪' })
}

export const useMusic = create<MusicStore>()((set, get) => ({
  playing: false,
  index: 0,
  play: () => {
    if (!content.music.length) return
    unlockAudio()
    if (!engine.start(currentTrack(get().index), level())) return
    set({ playing: true })
    showActivity(get().index)
  },
  pause: () => {
    engine.stop()
    set({ playing: false })
    useIsland.getState().clearActivity('music')
  },
  toggle: () => (get().playing ? get().pause() : get().play()),
  next: () => {
    const index = (get().index + 1) % content.music.length
    set({ index })
    if (get().playing) {
      engine.setTrack(currentTrack(index))
      showActivity(index)
    }
  },
  prev: () => {
    const index = (get().index - 1 + content.music.length) % content.music.length
    set({ index })
    if (get().playing) {
      engine.setTrack(currentTrack(index))
      showActivity(index)
    }
  },
}))

useSettings.subscribe((s, prev) => {
  if (s.volume !== prev.volume || s.muted !== prev.muted) engine.setVolume(level())
})
