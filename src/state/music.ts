import { create } from 'zustand'
import { content } from '../data/content'

/**
 * Now-playing state for the generative lo-fi player (Control Center,
 * Dynamic Island). STUB engine: the widgets/audio agent wires play/pause
 * to the WebAudio synth in src/lib/music.ts. Keep this API.
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

export const useMusic = create<MusicStore>()((set, get) => ({
  playing: false,
  index: 0,
  play: () => set({ playing: true }),
  pause: () => set({ playing: false }),
  toggle: () => (get().playing ? get().pause() : get().play()),
  next: () => set({ index: (get().index + 1) % content.music.length }),
  prev: () => set({ index: (get().index - 1 + content.music.length) % content.music.length }),
}))

export const currentTrack = (index: number) => content.music[index % content.music.length]
