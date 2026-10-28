/**
 * Sound effects synthesised with WebAudio: no audio files, nothing to load.
 * Volume follows the settings store; every call is fire-and-forget and never
 * throws (unsupported browsers and locked audio simply stay silent).
 */
import { useSettings } from '../state/settings'

export type SoundName =
  | 'click'
  | 'open'
  | 'close'
  | 'minimize'
  | 'notify'
  | 'error'
  | 'lock'
  | 'unlock'
  | 'boot'
  | 'send'
  | 'tetris-move'
  | 'tetris-rotate'
  | 'tetris-drop'
  | 'tetris-clear'
  | 'tetris-tetris'
  | 'tetris-level'
  | 'tetris-over'
  | 'chess-move'
  | 'chess-capture'
  | 'chess-check'
  | 'chess-end'

let ctx: AudioContext | null = null
let noiseBuffer: AudioBuffer | null = null
let resumeListenersAttached = false

function audioCtor(): typeof AudioContext | null {
  if (typeof window === 'undefined') return null
  const w = window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext }
  return w.AudioContext ?? w.webkitAudioContext ?? null
}

function userHasInteracted(): boolean {
  const ua = (typeof navigator !== 'undefined' ? (navigator as Navigator & { userActivation?: { hasBeenActive: boolean } }).userActivation : undefined)
  return ua ? ua.hasBeenActive : true
}

/**
 * The shared AudioContext (also used by the music engine). Only created after
 * the user has interacted with the page, so browsers never warn about autoplay.
 */
export function getAudioContext(force = false): AudioContext | null {
  if (ctx) return ctx.state === 'closed' ? null : ctx
  if (!force && !userHasInteracted()) return null
  const Ctor = audioCtor()
  if (!Ctor) return null
  try {
    ctx = new Ctor({ latencyHint: 'interactive' })
  } catch {
    ctx = null
  }
  return ctx
}

function resumeFromGesture() {
  if (!ctx || ctx.state !== 'suspended') return
  try {
    void ctx.resume().catch(() => {})
    // iOS Safari only unlocks after a sound starts inside a gesture.
    const silent = ctx.createBuffer(1, 1, 22050)
    const src = ctx.createBufferSource()
    src.buffer = silent
    src.connect(ctx.destination)
    src.start(0)
  } catch {
    /* ignore */
  }
}

/** Call from a user gesture to create/resume audio (needed by iOS/Safari). */
export function unlockAudio(): void {
  try {
    const c = getAudioContext(true)
    if (!c) return
    resumeFromGesture()
    // Touch pointerdown is not an activation gesture; finish unlocking on the next tap/release.
    if (c.state === 'suspended' && !resumeListenersAttached && typeof window !== 'undefined') {
      resumeListenersAttached = true
      const done = () => {
        resumeFromGesture()
        if (ctx?.state === 'running') {
          for (const ev of ['pointerup', 'touchend', 'click', 'keydown'] as const) window.removeEventListener(ev, done, true)
          resumeListenersAttached = false
        }
      }
      for (const ev of ['pointerup', 'touchend', 'click', 'keydown'] as const) window.addEventListener(ev, done, true)
    }
  } catch {
    /* ignore */
  }
}

// ── synthesis helpers ────────────────────────────────────────────────

function noise(c: AudioContext): AudioBuffer {
  if (noiseBuffer && noiseBuffer.sampleRate === c.sampleRate) return noiseBuffer
  const buf = c.createBuffer(1, c.sampleRate, c.sampleRate)
  const data = buf.getChannelData(0)
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
  noiseBuffer = buf
  return buf
}

interface ToneOpts {
  f: number
  /** Glide target frequency. */
  f2?: number
  at?: number
  type?: OscillatorType
  attack?: number
  decay?: number
  gain?: number
  detune?: number
  lowpass?: number
}

function tone(c: AudioContext, out: AudioNode, t0: number, o: ToneOpts) {
  const t = t0 + (o.at ?? 0)
  const attack = o.attack ?? 0.004
  const decay = o.decay ?? 0.12
  const osc = c.createOscillator()
  osc.type = o.type ?? 'sine'
  osc.frequency.setValueAtTime(o.f, t)
  if (o.f2) osc.frequency.exponentialRampToValueAtTime(o.f2, t + attack + decay)
  if (o.detune) osc.detune.value = o.detune
  const g = c.createGain()
  g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(o.gain ?? 0.2, t + attack)
  g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay)
  let node: AudioNode = osc
  if (o.lowpass) {
    const lp = c.createBiquadFilter()
    lp.type = 'lowpass'
    lp.frequency.value = o.lowpass
    osc.connect(lp)
    node = lp
  }
  node.connect(g)
  g.connect(out)
  osc.start(t)
  osc.stop(t + attack + decay + 0.05)
}

interface NoiseOpts {
  at?: number
  dur: number
  gain: number
  type?: BiquadFilterType
  f: number
  f2?: number
  q?: number
  attack?: number
}

function burst(c: AudioContext, out: AudioNode, t0: number, o: NoiseOpts) {
  const t = t0 + (o.at ?? 0)
  const src = c.createBufferSource()
  src.buffer = noise(c)
  const filter = c.createBiquadFilter()
  filter.type = o.type ?? 'bandpass'
  filter.frequency.setValueAtTime(o.f, t)
  if (o.f2) filter.frequency.exponentialRampToValueAtTime(o.f2, t + o.dur)
  filter.Q.value = o.q ?? 1
  const g = c.createGain()
  const attack = o.attack ?? Math.min(0.008, o.dur / 4)
  g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(o.gain, t + attack)
  g.gain.exponentialRampToValueAtTime(0.0001, t + o.dur)
  src.connect(filter)
  filter.connect(g)
  g.connect(out)
  src.start(t, Math.random() * 0.5)
  src.stop(t + o.dur + 0.05)
}

/** Bell-ish tone: fundamental plus a quiet inharmonic partial. */
function bell(c: AudioContext, out: AudioNode, t0: number, f: number, at: number, gain: number, decay = 0.7) {
  tone(c, out, t0, { f, at, gain, attack: 0.004, decay })
  tone(c, out, t0, { f: f * 2.76, at, gain: gain * 0.18, attack: 0.002, decay: decay * 0.35 })
  tone(c, out, t0, { f: f * 4.07, at, gain: gain * 0.06, attack: 0.002, decay: decay * 0.2 })
}

function knock(c: AudioContext, out: AudioNode, t0: number, at: number, gain: number, pitch: number) {
  burst(c, out, t0, { at, dur: 0.055, gain: gain * 0.9, type: 'bandpass', f: pitch * 6, q: 3.5 })
  tone(c, out, t0, { at, f: pitch, f2: pitch * 0.6, gain, attack: 0.002, decay: 0.07, type: 'triangle' })
}

const note = (midi: number) => 440 * Math.pow(2, (midi - 69) / 12)

type Recipe = (c: AudioContext, out: AudioNode, t: number) => void

const recipes: Record<SoundName, Recipe> = {
  click: (c, o, t) => {
    tone(c, o, t, { f: 1900, f2: 1300, gain: 0.05, decay: 0.025 })
    burst(c, o, t, { dur: 0.012, gain: 0.03, type: 'highpass', f: 5000 })
  },
  open: (c, o, t) => {
    tone(c, o, t, { f: 420, f2: 780, gain: 0.07, attack: 0.01, decay: 0.13 })
    tone(c, o, t, { f: 840, f2: 1560, gain: 0.015, attack: 0.01, decay: 0.1 })
  },
  close: (c, o, t) => {
    tone(c, o, t, { f: 720, f2: 360, gain: 0.06, attack: 0.008, decay: 0.12 })
  },
  minimize: (c, o, t) => {
    burst(c, o, t, { dur: 0.26, gain: 0.05, f: 2200, f2: 380, q: 1.4, attack: 0.04 })
    tone(c, o, t, { f: 620, f2: 280, gain: 0.03, attack: 0.02, decay: 0.2 })
  },
  notify: (c, o, t) => {
    bell(c, o, t, note(79), 0, 0.16, 0.6)
    bell(c, o, t, note(86), 0.12, 0.14, 0.9)
  },
  error: (c, o, t) => {
    tone(c, o, t, { f: 196, gain: 0.12, type: 'square', lowpass: 900, decay: 0.16 })
    tone(c, o, t, { f: 147, at: 0.02, gain: 0.08, type: 'triangle', decay: 0.18 })
  },
  lock: (c, o, t) => {
    burst(c, o, t, { dur: 0.06, gain: 0.12, type: 'lowpass', f: 1100 })
    tone(c, o, t, { f: 190, f2: 90, gain: 0.14, attack: 0.002, decay: 0.08 })
  },
  unlock: (c, o, t) => {
    tone(c, o, t, { f: note(76), gain: 0.06, decay: 0.09 })
    tone(c, o, t, { f: note(83), at: 0.07, gain: 0.06, decay: 0.14 })
  },
  boot: (c, o, t) => {
    // Soft, slow-blooming Fadd9 chord.
    const notes = [53, 60, 65, 69, 72, 79]
    notes.forEach((m, i) => {
      const lift = i * 0.012
      tone(c, o, t, { f: note(m), at: lift, gain: 0.06, attack: 0.09, decay: 2.6, type: 'triangle' })
      tone(c, o, t, { f: note(m), at: lift, gain: 0.025, attack: 0.12, decay: 2.2, type: 'sawtooth', detune: i % 2 ? 7 : -7, lowpass: 1600 })
    })
    tone(c, o, t, { f: note(41), gain: 0.09, attack: 0.08, decay: 2.4 })
  },
  send: (c, o, t) => {
    burst(c, o, t, { dur: 0.32, gain: 0.07, f: 500, f2: 3400, q: 1.2, attack: 0.05 })
    tone(c, o, t, { f: 520, f2: 1250, gain: 0.04, attack: 0.03, decay: 0.24 })
  },
  'tetris-move': (c, o, t) => {
    tone(c, o, t, { f: 220, gain: 0.035, type: 'square', lowpass: 1400, decay: 0.025 })
  },
  'tetris-rotate': (c, o, t) => {
    tone(c, o, t, { f: 330, f2: 470, gain: 0.04, type: 'square', lowpass: 1800, decay: 0.045 })
  },
  'tetris-drop': (c, o, t) => {
    tone(c, o, t, { f: 170, f2: 55, gain: 0.18, attack: 0.002, decay: 0.12 })
    burst(c, o, t, { dur: 0.06, gain: 0.07, type: 'lowpass', f: 900 })
  },
  'tetris-clear': (c, o, t) => {
    ;[72, 76, 79].forEach((m, i) => tone(c, o, t, { f: note(m), at: i * 0.06, gain: 0.06, type: 'square', lowpass: 2600, decay: 0.09 }))
  },
  'tetris-tetris': (c, o, t) => {
    ;[72, 76, 79, 84, 88].forEach((m, i) => tone(c, o, t, { f: note(m), at: i * 0.055, gain: 0.065, type: 'square', lowpass: 3000, decay: 0.12 }))
    bell(c, o, t, note(96), 0.3, 0.05, 0.6)
  },
  'tetris-level': (c, o, t) => {
    ;[67, 71, 74, 79, 83].forEach((m, i) => tone(c, o, t, { f: note(m), at: i * 0.045, gain: 0.05, type: 'triangle', decay: 0.1 }))
  },
  'tetris-over': (c, o, t) => {
    ;[67, 64, 60, 55].forEach((m, i) => tone(c, o, t, { f: note(m), at: i * 0.2, gain: 0.08, type: 'triangle', decay: 0.28 }))
  },
  'chess-move': (c, o, t) => knock(c, o, t, 0, 0.16, 230),
  'chess-capture': (c, o, t) => {
    knock(c, o, t, 0, 0.18, 260)
    knock(c, o, t, 0.045, 0.14, 180)
  },
  'chess-check': (c, o, t) => {
    knock(c, o, t, 0, 0.14, 240)
    tone(c, o, t, { f: note(81), at: 0.05, gain: 0.06, type: 'triangle', decay: 0.12 })
    tone(c, o, t, { f: note(76), at: 0.15, gain: 0.06, type: 'triangle', decay: 0.18 })
  },
  'chess-end': (c, o, t) => {
    ;[60, 64, 67, 72].forEach((m, i) => tone(c, o, t, { f: note(m), at: i * 0.03, gain: 0.06, attack: 0.02, decay: 1.2, type: 'triangle' }))
  },
}

/** Plays a UI or game sound at the current volume (silent when muted or audio is locked). */
export function playSound(name: SoundName): void {
  try {
    const { volume, muted } = useSettings.getState()
    if (muted || !(volume > 0)) return
    const c = getAudioContext()
    if (!c) return
    if (c.state === 'suspended') void c.resume().catch(() => {})
    const out = c.createGain()
    out.gain.value = Math.min(1, volume) * 0.9
    out.connect(c.destination)
    recipes[name]?.(c, out, c.currentTime + 0.01)
    window.setTimeout(() => {
      try {
        out.disconnect()
      } catch {
        /* ignore */
      }
    }, 4000)
  } catch {
    /* never let a sound break the UI */
  }
}
