/**
 * Pure Tetris rules: SRS rotation with wall kicks, 7-bag randomizer,
 * guideline gravity and scoring, lock delay with move-reset cap.
 * No DOM here, so it can be unit-tested and driven by any renderer.
 */

export type PieceType = 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L'
export type Cell = PieceType | null
export type Board = Cell[][]

export const COLS = 10
export const VISIBLE_ROWS = 20
/** Spawn buffer above the visible field. */
export const HIDDEN_ROWS = 2
export const ROWS = VISIBLE_ROWS + HIDDEN_ROWS
export const PIECES: PieceType[] = ['I', 'O', 'T', 'S', 'Z', 'J', 'L']

export const LOCK_DELAY = 500
export const MAX_LOCK_RESETS = 15
export const LINE_CLEAR_DELAY = 220

type Point = [number, number]

/** Spawn orientation (state 0) inside each piece's bounding box, y pointing down. */
const SPAWN: Record<PieceType, { size: number; cells: Point[] }> = {
  I: { size: 4, cells: [[0, 1], [1, 1], [2, 1], [3, 1]] },
  O: { size: 2, cells: [[0, 0], [1, 0], [0, 1], [1, 1]] },
  T: { size: 3, cells: [[1, 0], [0, 1], [1, 1], [2, 1]] },
  S: { size: 3, cells: [[1, 0], [2, 0], [0, 1], [1, 1]] },
  Z: { size: 3, cells: [[0, 0], [1, 0], [1, 1], [2, 1]] },
  J: { size: 3, cells: [[0, 0], [0, 1], [1, 1], [2, 1]] },
  L: { size: 3, cells: [[2, 0], [0, 1], [1, 1], [2, 1]] },
}

/** SHAPES[type][rotation] → cells relative to the box origin. Rotating the box gives true SRS states. */
export const SHAPES: Record<PieceType, Point[][]> = Object.fromEntries(
  PIECES.map((type) => {
    const { size, cells } = SPAWN[type]
    const states: Point[][] = [cells]
    for (let r = 1; r < 4; r++) {
      states.push(states[r - 1].map(([x, y]) => [size - 1 - y, x] as Point))
    }
    if (type === 'O') return [type, [cells, cells, cells, cells]]
    return [type, states]
  }),
) as Record<PieceType, Point[][]>

/**
 * SRS kick offsets in (x right, y UP) as published; converted to y-down when applied.
 * Keyed by "from>to" rotation states (0, 1=R, 2, 3=L).
 */
const KICKS_JLSTZ: Record<string, Point[]> = {
  '0>1': [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
  '1>0': [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
  '1>2': [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
  '2>1': [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
  '2>3': [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
  '3>2': [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
  '3>0': [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
  '0>3': [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
}

const KICKS_I: Record<string, Point[]> = {
  '0>1': [[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]],
  '1>0': [[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]],
  '1>2': [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]],
  '2>1': [[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]],
  '2>3': [[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]],
  '3>2': [[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]],
  '3>0': [[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]],
  '0>3': [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]],
}

export interface Piece {
  type: PieceType
  rot: number
  x: number
  y: number
}

export function emptyBoard(): Board {
  return Array.from({ length: ROWS }, () => Array<Cell>(COLS).fill(null))
}

export function cellsOf(p: Piece): Point[] {
  return SHAPES[p.type][p.rot].map(([cx, cy]) => [p.x + cx, p.y + cy] as Point)
}

export function collides(board: Board, p: Piece): boolean {
  for (const [x, y] of cellsOf(p)) {
    if (x < 0 || x >= COLS || y < 0 || y >= ROWS) return true
    if (board[y][x]) return true
  }
  return false
}

/** Spawns so the piece's lowest row sits on the first visible row. */
export function spawnPiece(type: PieceType): Piece {
  return { type, rot: 0, x: type === 'O' ? 4 : 3, y: 1 }
}

export function tryMove(board: Board, p: Piece, dx: number, dy: number): Piece | null {
  const next = { ...p, x: p.x + dx, y: p.y + dy }
  return collides(board, next) ? null : next
}

/** Rotates with SRS wall kicks. dir 1 = clockwise, -1 = counter-clockwise. */
export function tryRotate(board: Board, p: Piece, dir: 1 | -1): Piece | null {
  if (p.type === 'O') return { ...p }
  const to = (p.rot + (dir === 1 ? 1 : 3)) % 4
  const table = p.type === 'I' ? KICKS_I : KICKS_JLSTZ
  for (const [kx, ky] of table[`${p.rot}>${to}`]) {
    const next = { ...p, rot: to, x: p.x + kx, y: p.y - ky }
    if (!collides(board, next)) return next
  }
  return null
}

export function dropDistance(board: Board, p: Piece): number {
  let d = 0
  while (!collides(board, { ...p, y: p.y + d + 1 })) d++
  return d
}

export function merge(board: Board, p: Piece): Board {
  const next = board.map((row) => row.slice())
  for (const [x, y] of cellsOf(p)) if (y >= 0 && y < ROWS) next[y][x] = p.type
  return next
}

export function fullRows(board: Board): number[] {
  const rows: number[] = []
  board.forEach((row, y) => {
    if (row.every(Boolean)) rows.push(y)
  })
  return rows
}

export function removeRows(board: Board, rows: number[]): Board {
  if (!rows.length) return board
  const keep = board.filter((_, y) => !rows.includes(y))
  const fresh = Array.from({ length: rows.length }, () => Array<Cell>(COLS).fill(null))
  return [...fresh, ...keep]
}

const LINE_POINTS = [0, 100, 300, 500, 800]

/** Guideline line-clear score. Back-to-back Tetrises earn ×1.5. */
export function lineClearScore(lines: number, level: number, b2b: boolean): { points: number; b2b: boolean } {
  if (lines <= 0) return { points: 0, b2b }
  const difficult = lines >= 4
  let points = LINE_POINTS[Math.min(lines, 4)] * level
  if (difficult && b2b) points = Math.floor(points * 1.5)
  return { points, b2b: difficult }
}

/** Guideline gravity: milliseconds per row at a level. */
export function gravityMs(level: number): number {
  const l = Math.min(Math.max(level, 1), 20)
  return Math.max(1000 * Math.pow(0.8 - (l - 1) * 0.007, l - 1), 1)
}

export function shuffle<T>(items: T[], rng: () => number): T[] {
  const a = items.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** 7-bag randomizer: every run of 7 contains each piece exactly once. */
export class Randomizer {
  private queue: PieceType[] = []
  private readonly rng: () => number
  constructor(rng: () => number = Math.random) {
    this.rng = rng
  }
  private fill(n: number) {
    while (this.queue.length < n) this.queue.push(...shuffle(PIECES, this.rng))
  }
  next(): PieceType {
    this.fill(1)
    return this.queue.shift()!
  }
  peek(n: number): PieceType[] {
    this.fill(n)
    return this.queue.slice(0, n)
  }
}

export type GameStatus = 'ready' | 'playing' | 'paused' | 'over'

export type GameEvent =
  | { type: 'move' }
  | { type: 'rotate' }
  | { type: 'hold' }
  | { type: 'lock'; hard: boolean }
  | { type: 'clear'; lines: number; points: number; b2b: boolean; combo: number }
  | { type: 'level'; level: number }
  | { type: 'over' }

/** Anything that deals pieces (the 7-bag, or a fixed sequence in tests). */
export interface PieceSource {
  next(): PieceType
  peek(n: number): PieceType[]
}

export interface GameOptions {
  rng?: () => number
  /** Override the 7-bag (used by tests). */
  source?: () => PieceSource
  /** Milliseconds rows flash before collapsing (0 for reduced motion / tests). */
  clearDelay?: number
  startLevel?: number
}

export class TetrisGame {
  board: Board = emptyBoard()
  active: Piece | null = null
  hold: PieceType | null = null
  holdUsed = false
  score = 0
  lines = 0
  level = 1
  combo = -1
  b2b = false
  status: GameStatus = 'ready'
  /** Rows currently flashing before they collapse. */
  clearing: { rows: number[]; elapsed: number } | null = null

  private randomizer: PieceSource
  private readonly makeSource: () => PieceSource
  private gravityAcc = 0
  private lockElapsed = 0
  private lockResets = 0
  private lowestY = 0
  private listeners = new Set<(e: GameEvent) => void>()
  private readonly rng: () => number
  clearDelay: number
  readonly startLevel: number

  constructor(opts: GameOptions = {}) {
    this.rng = opts.rng ?? Math.random
    this.clearDelay = opts.clearDelay ?? LINE_CLEAR_DELAY
    this.startLevel = opts.startLevel ?? 1
    this.level = this.startLevel
    this.makeSource = opts.source ?? (() => new Randomizer(this.rng))
    this.randomizer = this.makeSource()
  }

  on(fn: (e: GameEvent) => void): () => void {
    this.listeners.add(fn)
    return () => this.listeners.delete(fn)
  }

  private emit(e: GameEvent) {
    for (const fn of this.listeners) fn(e)
  }

  get next(): PieceType[] {
    return this.randomizer.peek(3)
  }

  reset() {
    this.board = emptyBoard()
    this.active = null
    this.hold = null
    this.holdUsed = false
    this.score = 0
    this.lines = 0
    this.level = this.startLevel
    this.combo = -1
    this.b2b = false
    this.clearing = null
    this.randomizer = this.makeSource()
    this.status = 'ready'
  }

  start() {
    this.reset()
    this.status = 'playing'
    this.spawn(this.randomizer.next())
  }

  pause() {
    if (this.status === 'playing') this.status = 'paused'
  }

  resume() {
    if (this.status === 'paused') this.status = 'playing'
  }

  private spawn(type: PieceType) {
    const piece = spawnPiece(type)
    this.gravityAcc = 0
    this.lockElapsed = 0
    this.lockResets = 0
    this.lowestY = piece.y
    if (collides(this.board, piece)) {
      this.active = null
      this.gameOver()
      return
    }
    this.active = piece
  }

  private gameOver() {
    this.status = 'over'
    this.emit({ type: 'over' })
  }

  private get canAct() {
    return this.status === 'playing' && !!this.active && !this.clearing
  }

  private grounded(p: Piece) {
    return !tryMove(this.board, p, 0, 1)
  }

  /** After a successful move/rotation on the ground, restart the lock timer (capped). */
  private onManipulated() {
    if (!this.active) return
    if (this.active.y > this.lowestY) {
      this.lowestY = this.active.y
      this.lockResets = 0
    }
    if (this.grounded(this.active) || this.lockElapsed > 0) {
      if (this.lockResets < MAX_LOCK_RESETS) {
        this.lockElapsed = 0
        this.lockResets++
      }
    }
  }

  move(dx: number): boolean {
    if (!this.canAct) return false
    const next = tryMove(this.board, this.active!, dx, 0)
    if (!next) return false
    this.active = next
    this.onManipulated()
    this.emit({ type: 'move' })
    return true
  }

  rotate(dir: 1 | -1): boolean {
    if (!this.canAct || this.active!.type === 'O') return false
    const next = tryRotate(this.board, this.active!, dir)
    if (!next) return false
    this.active = next
    this.onManipulated()
    this.emit({ type: 'rotate' })
    return true
  }

  /** One row of soft drop (+1 point). */
  softDrop(): boolean {
    if (!this.canAct) return false
    const next = tryMove(this.board, this.active!, 0, 1)
    if (!next) return false
    this.active = next
    this.gravityAcc = 0
    this.score += 1
    if (next.y > this.lowestY) {
      this.lowestY = next.y
      this.lockResets = 0
    }
    return true
  }

  hardDrop() {
    if (!this.canAct) return
    const d = dropDistance(this.board, this.active!)
    this.active = { ...this.active!, y: this.active!.y + d }
    this.score += 2 * d
    this.lock(true)
  }

  holdPiece() {
    if (!this.canAct || this.holdUsed) return
    const current = this.active!.type
    const swap = this.hold
    this.hold = current
    this.holdUsed = true
    this.spawn(swap ?? this.randomizer.next())
    this.emit({ type: 'hold' })
  }

  ghost(): Piece | null {
    if (!this.active) return null
    return { ...this.active, y: this.active.y + dropDistance(this.board, this.active) }
  }

  private lock(hard = false) {
    const piece = this.active!
    this.board = merge(this.board, piece)
    this.active = null
    this.holdUsed = false
    this.emit({ type: 'lock', hard })
    // Lock out: the whole piece stayed above the visible field.
    if (cellsOf(piece).every(([, y]) => y < HIDDEN_ROWS)) {
      this.gameOver()
      return
    }
    const rows = fullRows(this.board)
    if (!rows.length) {
      this.combo = -1
      this.spawn(this.randomizer.next())
      return
    }
    const { points, b2b } = lineClearScore(rows.length, this.level, this.b2b)
    this.combo += 1
    const comboBonus = this.combo > 0 ? 50 * this.combo * this.level : 0
    this.score += points + comboBonus
    const wasB2b = this.b2b && rows.length >= 4
    this.b2b = b2b
    this.lines += rows.length
    this.emit({ type: 'clear', lines: rows.length, points: points + comboBonus, b2b: wasB2b, combo: this.combo })
    const newLevel = this.startLevel + Math.floor(this.lines / 10)
    if (newLevel > this.level) {
      this.level = newLevel
      this.emit({ type: 'level', level: newLevel })
    }
    if (this.clearDelay > 0) {
      this.clearing = { rows, elapsed: 0 }
    } else {
      this.finishClear(rows)
    }
  }

  private finishClear(rows: number[]) {
    this.board = removeRows(this.board, rows)
    this.clearing = null
    this.spawn(this.randomizer.next())
  }

  /** Advances time by dt milliseconds: line-clear delay, gravity and lock delay. */
  tick(dt: number) {
    if (this.status !== 'playing') return
    if (this.clearing) {
      this.clearing.elapsed += dt
      if (this.clearing.elapsed >= this.clearDelay) this.finishClear(this.clearing.rows)
      return
    }
    if (!this.active) return
    if (this.grounded(this.active)) {
      this.lockElapsed += dt
      if (this.lockElapsed >= LOCK_DELAY) this.lock(false)
      return
    }
    this.lockElapsed = 0
    this.gravityAcc += dt
    const g = gravityMs(this.level)
    while (this.gravityAcc >= g && this.active) {
      this.gravityAcc -= g
      const next = tryMove(this.board, this.active, 0, 1)
      if (!next) {
        this.gravityAcc = 0
        break
      }
      this.active = next
      if (next.y > this.lowestY) {
        this.lowestY = next.y
        this.lockResets = 0
      }
    }
  }
}
