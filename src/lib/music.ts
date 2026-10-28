/**
 * Generative lo-fi loop synthesised in the browser. Each content.music track
 * supplies tempo, root note and a chord progression; pads, bass, drums and
 * occasional keys are scheduled with a lookahead timer.
 */
import type { Track } from '../data/types'
import { getAudioContext } from './sound'

const LOOKAHEAD = 0.15
const TICK_MS = 25
/** Overall music level relative to the volume setting. */
const LEVEL = 0.5

const mtof = (m: number) => 440 * Math.pow(2, (m - 69) / 12)

export class LofiEngine {
  private c: AudioContext | null = null
  private master: GainNode | null = null
  private padBus: BiquadFilterNode | null = null
  private keysBus: GainNode | null = null
  private sources: AudioScheduledSourceNode[] = []
  private timer: ReturnType<typeof setInterval> | null = null
  private track: Track | null = null
  private step = 0
  private nextTime = 0
  private volume = 0.6
  private noise: AudioBuffer | null = null

  get running() {
    return this.timer != null
  }

  /** Starts (or restarts) playback. Returns false when audio is unavailable. */
  start(track: Track, volume: number): boolean {
    this.stop(true)
    const c = getAudioContext(true)
    if (!c) return false
    try {
      if (c.state === 'suspended') void c.resume().catch(() => {})
      this.c = c
      this.volume = volume
      this.track = track
      this.buildGraph(c)
      this.step = 0
      this.nextTime = c.currentTime + 0.08
      this.timer = setInterval(() => this.schedule(), TICK_MS)
      this.schedule()
      return true
    } catch {
      this.stop(true)
      return false
    }
  }

  /** Switches track at the next 16th note, keeping the audio graph. */
  setTrack(track: Track) {
    this.track = track
    this.step = 0
    if (this.c) this.nextTime = Math.max(this.nextTime, this.c.currentTime + 0.05)
  }

  setVolume(volume: number) {
    this.volume = volume
    if (this.c && this.master) this.master.gain.setTargetAtTime(volume * LEVEL, this.c.currentTime, 0.08)
  }

  stop(immediate = false) {
    if (this.timer != null) clearInterval(this.timer)
    this.timer = null
    const c = this.c
    const master = this.master
    const sources = this.sources
    this.master = null
    this.padBus = null
    this.keysBus = null
    this.sources = []
    this.c = null
    if (!c || !master) return
    try {
      master.gain.cancelScheduledValues(c.currentTime)
      master.gain.setTargetAtTime(0, c.currentTime, immediate ? 0.01 : 0.08)
    } catch {
      /* ignore */
    }
    setTimeout(
      () => {
        for (const s of sources) {
          try {
            s.stop()
          } catch {
            /* already stopped */
          }
        }
        try {
          master.disconnect()
        } catch {
          /* ignore */
        }
      },
      immediate ? 60 : 450,
    )
  }

  // ── graph ─────────────────────────────────────────────────────────
  private buildGraph(c: AudioContext) {
    const master = c.createGain()
    master.gain.setValueAtTime(0, c.currentTime)
    master.gain.setTargetAtTime(this.volume * LEVEL, c.currentTime, 0.4)
    const tone = c.createBiquadFilter()
    tone.type = 'lowpass'
    tone.frequency.value = 5200
    const comp = c.createDynamicsCompressor()
    comp.threshold.value = -18
    comp.ratio.value = 3
    master.connect(tone)
    tone.connect(comp)
    comp.connect(c.destination)

    const pad = c.createBiquadFilter()
    pad.type = 'lowpass'
    pad.frequency.value = 1300
    pad.Q.value = 0.6
    pad.connect(master)
    // Slow filter movement for a "breathing" pad.
    const lfo = c.createOscillator()
    lfo.frequency.value = 0.07
    const lfoGain = c.createGain()
    lfoGain.gain.value = 350
    lfo.connect(lfoGain)
    lfoGain.connect(pad.frequency)
    lfo.start()

    // Keys with a tape-ish echo.
    const keys = c.createGain()
    keys.connect(master)
    const delay = c.createDelay(1)
    delay.delayTime.value = (60 / (this.track?.bpm ?? 80)) * 0.75
    const feedback = c.createGain()
    feedback.gain.value = 0.32
    const wet = c.createGain()
    wet.gain.value = 0.35
    const damp = c.createBiquadFilter()
    damp.type = 'lowpass'
    damp.frequency.value = 2200
    keys.connect(delay)
    delay.connect(damp)
    damp.connect(feedback)
    feedback.connect(delay)
    damp.connect(wet)
    wet.connect(master)

    // Vinyl crackle bed.
    const crackle = c.createBufferSource()
    crackle.buffer = this.crackleBuffer(c)
    crackle.loop = true
    const crackleGain = c.createGain()
    crackleGain.gain.value = 0.05
    crackle.connect(crackleGain)
    crackleGain.connect(master)
    crackle.start()

    this.master = master
    this.padBus = pad
    this.keysBus = keys
    this.sources = [lfo, crackle]
  }

  private crackleBuffer(c: AudioContext) {
    const len = c.sampleRate * 2
    const buf = c.createBuffer(1, len, c.sampleRate)
    const d = buf.getChannelData(0)
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * 0.004
    for (let k = 0; k < 50; k++) {
      const p = Math.floor(Math.random() * (len - 40))
      const amp = 0.15 + Math.random() * 0.35
      for (let j = 0; j < 30; j++) d[p + j] += (Math.random() * 2 - 1) * amp * (1 - j / 30)
    }
    return buf
  }

  private noiseBuffer(c: AudioContext) {
    if (this.noise && this.noise.sampleRate === c.sampleRate) return this.noise
    const buf = c.createBuffer(1, c.sampleRate, c.sampleRate)
    const d = buf.getChannelData(0)
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1
    this.noise = buf
    return buf
  }

  // ── scheduling ────────────────────────────────────────────────────
  private schedule() {
    const c = this.c
    const tr = this.track
    if (!c || !tr) return
    const sixteenth = 60 / tr.bpm / 4
    // If the tab was throttled, skip ahead instead of firing a burst of notes.
    if (this.nextTime < c.currentTime - 0.2) this.nextTime = c.currentTime + 0.05
    while (this.nextTime < c.currentTime + LOOKAHEAD) {
      try {
        this.playStep(c, tr, this.step, this.nextTime, sixteenth)
      } catch {
        /* keep the loop alive */
      }
      this.step++
      this.nextTime += sixteenth
    }
  }

  private playStep(c: AudioContext, tr: Track, step: number, t: number, sixteenth: number) {
    const s = step % 16
    const bar = Math.floor(step / 16)
    const chord = tr.progression[bar % tr.progression.length] ?? [0, 4, 7]
    const time = s % 2 === 1 ? t + sixteenth * 0.18 : t // light swing

    if (s === 0) this.pad(c, tr.root, chord, time, sixteenth * 16)
    if (s === 0) this.bass(c, tr.root + chord[0] - 24, time, sixteenth * 7)
    if (s === 10) this.bass(c, tr.root + chord[0] - 24 + (bar % 2 ? 7 : 0), time, sixteenth * 5)

    if (s === 0 || s === 10 || (s === 7 && Math.random() < 0.35)) this.kick(c, time)
    if (s === 4 || s === 12) this.snare(c, time)
    if (s % 2 === 0) this.hat(c, time, s % 4 === 2 ? 0.045 : 0.03)
    else if (Math.random() < 0.18) this.hat(c, time, 0.015)

    if (s !== 0 && Math.random() < 0.2) {
      const pick = chord[Math.floor(Math.random() * chord.length)]
      const octave = Math.random() < 0.3 ? 24 : 12
      this.keys(c, tr.root + pick + octave, time)
    }
  }

  private pad(c: AudioContext, root: number, chord: number[], t: number, dur: number) {
    const bus = this.padBus
    if (!bus) return
    for (const interval of chord) {
      const f = mtof(root + interval)
      for (const [type, detune, gain] of [
        ['triangle', -6, 0.05],
        ['sawtooth', 7, 0.016],
      ] as const) {
        const osc = c.createOscillator()
        osc.type = type
        osc.frequency.value = f
        osc.detune.value = detune
        const g = c.createGain()
        g.gain.setValueAtTime(0.0001, t)
        g.gain.exponentialRampToValueAtTime(gain, t + 0.35)
        g.gain.setValueAtTime(gain, t + dur - 0.05)
        g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.7)
        osc.connect(g)
        g.connect(bus)
        osc.start(t)
        osc.stop(t + dur + 0.8)
      }
    }
  }

  private bass(c: AudioContext, midi: number, t: number, dur: number) {
    if (!this.master) return
    const osc = c.createOscillator()
    osc.type = 'triangle'
    osc.frequency.value = mtof(midi)
    const lp = c.createBiquadFilter()
    lp.type = 'lowpass'
    lp.frequency.value = 420
    const g = c.createGain()
    g.gain.setValueAtTime(0.0001, t)
    g.gain.exponentialRampToValueAtTime(0.22, t + 0.015)
    g.gain.exponentialRampToValueAtTime(0.08, t + dur * 0.6)
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
    osc.connect(lp)
    lp.connect(g)
    g.connect(this.master)
    osc.start(t)
    osc.stop(t + dur + 0.05)
  }

  private kick(c: AudioContext, t: number) {
    if (!this.master) return
    const osc = c.createOscillator()
    osc.frequency.setValueAtTime(125, t)
    osc.frequency.exponentialRampToValueAtTime(42, t + 0.16)
    const g = c.createGain()
    g.gain.setValueAtTime(0.0001, t)
    g.gain.exponentialRampToValueAtTime(0.42, t + 0.006)
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.28)
    osc.connect(g)
    g.connect(this.master)
    osc.start(t)
    osc.stop(t + 0.3)
  }

  private noiseHit(c: AudioContext, t: number, gain: number, dur: number, type: BiquadFilterType, f: number) {
    if (!this.master) return
    const src = c.createBufferSource()
    src.buffer = this.noiseBuffer(c)
    const filter = c.createBiquadFilter()
    filter.type = type
    filter.frequency.value = f
    filter.Q.value = 0.8
    const g = c.createGain()
    g.gain.setValueAtTime(0.0001, t)
    g.gain.exponentialRampToValueAtTime(gain, t + 0.004)
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
    src.connect(filter)
    filter.connect(g)
    g.connect(this.master)
    src.start(t, Math.random() * 0.5)
    src.stop(t + dur + 0.02)
  }

  private snare(c: AudioContext, t: number) {
    this.noiseHit(c, t, 0.11, 0.14, 'bandpass', 1900)
    if (!this.master) return
    const osc = c.createOscillator()
    osc.type = 'triangle'
    osc.frequency.setValueAtTime(200, t)
    osc.frequency.exponentialRampToValueAtTime(140, t + 0.08)
    const g = c.createGain()
    g.gain.setValueAtTime(0.0001, t)
    g.gain.exponentialRampToValueAtTime(0.07, t + 0.004)
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.09)
    osc.connect(g)
    g.connect(this.master)
    osc.start(t)
    osc.stop(t + 0.1)
  }

  private hat(c: AudioContext, t: number, gain: number) {
    this.noiseHit(c, t, gain, 0.035, 'highpass', 7200)
  }

  private keys(c: AudioContext, midi: number, t: number) {
    const bus = this.keysBus
    if (!bus) return
    const f = mtof(midi)
    for (const [type, gain, decay] of [
      ['sine', 0.055, 0.9],
      ['triangle', 0.02, 0.4],
    ] as const) {
      const osc = c.createOscillator()
      osc.type = type
      osc.frequency.value = f
      const g = c.createGain()
      g.gain.setValueAtTime(0.0001, t)
      g.gain.exponentialRampToValueAtTime(gain, t + 0.006)
      g.gain.exponentialRampToValueAtTime(0.0001, t + decay)
      osc.connect(g)
      g.connect(bus)
      osc.start(t)
      osc.stop(t + decay + 0.05)
    }
  }
}
