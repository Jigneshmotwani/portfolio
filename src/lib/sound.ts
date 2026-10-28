/**
 * Sound effects synthesised with WebAudio (no audio files).
 * STUB: the widgets/audio agent implements this. Keep the exported API.
 */
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

export function playSound(_name: SoundName): void {}

/** Call from a user gesture to unlock audio on iOS/Safari. */
export function unlockAudio(): void {}
