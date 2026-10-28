import { describe, expect, it } from 'vitest'
import {
  COLS,
  HIDDEN_ROWS,
  PIECES,
  ROWS,
  Randomizer,
  SHAPES,
  TetrisGame,
  cellsOf,
  collides,
  emptyBoard,
  gravityMs,
  lineClearScore,
  spawnPiece,
  tryRotate,
  type Board,
  type PieceType,
} from './logic'

/** Deterministic RNG for repeatable bags. */
function seeded(seed = 1) {
  let s = seed
  return () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}

/** Fills the given rows completely except the listed holes. */
function fillRows(board: Board, rows: number[], holes: number[] = []) {
  for (const y of rows) for (let x = 0; x < COLS; x++) board[y][x] = holes.includes(x) ? null : 'Z'
}

/** A game whose randomizer yields a fixed sequence. */
function gameWith(sequence: PieceType[]) {
  return new TetrisGame({
    clearDelay: 0,
    source: () => {
      let i = 0
      return {
        next: () => sequence[i++ % sequence.length],
        peek: (n: number) => Array.from({ length: n }, (_, k) => sequence[(i + k) % sequence.length]),
      }
    },
  })
}

describe('shapes and spawn', () => {
  it('every rotation state has 4 cells', () => {
    for (const t of PIECES) for (const state of SHAPES[t]) expect(state).toHaveLength(4)
  })

  it('T rotates clockwise into the SRS R state', () => {
    expect(SHAPES.T[1].map((c) => c.join(',')).sort()).toEqual(['1,0', '1,1', '1,2', '2,1'].sort())
  })

  it('I piece uses column 2 in state R and row 2 in state 2', () => {
    expect(SHAPES.I[1].every(([x]) => x === 2)).toBe(true)
    expect(SHAPES.I[2].every(([, y]) => y === 2)).toBe(true)
  })

  it('spawns every piece centred with its lowest row on the first visible row', () => {
    const board = emptyBoard()
    for (const t of PIECES) {
      const p = spawnPiece(t)
      expect(collides(board, p)).toBe(false)
      const ys = cellsOf(p).map(([, y]) => y)
      expect(Math.max(...ys)).toBe(HIDDEN_ROWS)
      const xs = cellsOf(p).map(([x]) => x)
      expect(Math.min(...xs)).toBeGreaterThanOrEqual(3)
      expect(Math.max(...xs)).toBeLessThanOrEqual(6)
    }
  })
})

describe('collision', () => {
  it('detects walls, floor and stack', () => {
    const board = emptyBoard()
    expect(collides(board, { type: 'O', rot: 0, x: -1, y: 5 })).toBe(true)
    expect(collides(board, { type: 'O', rot: 0, x: COLS - 1, y: 5 })).toBe(true)
    expect(collides(board, { type: 'O', rot: 0, x: 0, y: ROWS - 1 })).toBe(true)
    expect(collides(board, { type: 'O', rot: 0, x: 0, y: ROWS - 2 })).toBe(false)
    board[10][1] = 'L'
    expect(collides(board, { type: 'O', rot: 0, x: 0, y: 9 })).toBe(true)
  })
})

describe('SRS wall kicks', () => {
  it('rotates in open space without an offset', () => {
    const p = { type: 'T' as const, rot: 0, x: 4, y: 8 }
    expect(tryRotate(emptyBoard(), p, 1)).toEqual({ ...p, rot: 1 })
  })

  it('kicks a vertical I piece off the left wall (R→2 uses +2,0)', () => {
    const p = { type: 'I' as const, rot: 1, x: -2, y: 8 } // occupies column 0
    expect(collides(emptyBoard(), p)).toBe(false)
    const r = tryRotate(emptyBoard(), p, 1)
    expect(r).toEqual({ type: 'I', rot: 2, x: 0, y: 8 })
  })

  it('kicks a vertical I piece off the right wall (0→R from flat at the edge)', () => {
    const p = { type: 'I' as const, rot: 3, x: 8, y: 8 } // state L uses column 1 → x = 9
    expect(collides(emptyBoard(), p)).toBe(false)
    const r = tryRotate(emptyBoard(), p, -1) // L→2
    expect(r).not.toBeNull()
    expect(collides(emptyBoard(), r!)).toBe(false)
    expect(r!.rot).toBe(2)
  })

  it('kicks a T piece off the left wall', () => {
    const p = { type: 'T' as const, rot: 1, x: -1, y: 8 } // stem points right, column 0..1
    expect(collides(emptyBoard(), p)).toBe(false)
    const r = tryRotate(emptyBoard(), p, 1)
    expect(r).not.toBeNull()
    expect(r!.x).toBe(0) // first kick for R→2 is +1,0
  })

  it('returns null when every kick is blocked', () => {
    const board = emptyBoard()
    for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) board[y][x] = 'Z'
    for (let x = 3; x <= 6; x++) board[10][x] = null
    expect(tryRotate(board, { type: 'I', rot: 0, x: 3, y: 9 }, 1)).toBeNull()
  })

  it('O piece never moves when rotated', () => {
    const p = { type: 'O' as const, rot: 0, x: 4, y: 4 }
    expect(tryRotate(emptyBoard(), p, 1)).toEqual(p)
  })
})

describe('scoring', () => {
  it('uses guideline line values times level', () => {
    expect(lineClearScore(1, 1, false).points).toBe(100)
    expect(lineClearScore(2, 2, false).points).toBe(600)
    expect(lineClearScore(3, 1, false).points).toBe(500)
    expect(lineClearScore(4, 3, false).points).toBe(2400)
  })

  it('gives back-to-back Tetrises a 1.5x bonus', () => {
    const first = lineClearScore(4, 1, false)
    expect(first).toEqual({ points: 800, b2b: true })
    expect(lineClearScore(4, 1, first.b2b).points).toBe(1200)
    expect(lineClearScore(1, 1, true).b2b).toBe(false)
  })

  it('gravity starts at one row per second and speeds up', () => {
    expect(gravityMs(1)).toBe(1000)
    expect(gravityMs(5)).toBeLessThan(gravityMs(4))
    expect(gravityMs(20)).toBeGreaterThan(0)
  })
})

describe('game', () => {
  it('clears a single line with a vertical I and scores 100', () => {
    const g = gameWith(['I', 'O'])
    g.start()
    fillRows(g.board, [ROWS - 1], [9])
    g.rotate(1) // vertical in column 5
    for (let i = 0; i < 5; i++) g.move(1)
    expect(cellsOf(g.active!).every(([x]) => x === 9)).toBe(true)
    const before = g.score
    g.hardDrop()
    const dropPoints = g.score - before - 100
    expect(g.lines).toBe(1)
    expect(dropPoints).toBeGreaterThan(0)
    expect(g.board.flat().filter((c) => c === 'I')).toHaveLength(3) // I remnants stay in column 9
    expect(g.board[ROWS - 1][9]).toBe('I')
  })

  it('scores a Tetris and back-to-back Tetris', () => {
    const g = gameWith(['I'])
    g.start()
    const clearTetris = () => {
      fillRows(g.board, [ROWS - 4, ROWS - 3, ROWS - 2, ROWS - 1], [0])
      g.rotate(-1) // state L uses column 1 → move left
      while (g.move(-1)) {
        /* slide to the wall */
      }
      const ys = cellsOf(g.active!).map(([x]) => x)
      expect(ys.every((x) => x === 0)).toBe(true)
      const before = g.score
      const events: string[] = []
      const off = g.on((e) => events.push(e.type))
      g.hardDrop()
      off()
      return { gained: g.score - before, events }
    }
    const a = clearTetris()
    expect(g.lines).toBe(4)
    expect(a.events).toContain('clear')
    const b = clearTetris()
    expect(g.lines).toBe(8)
    // b2b bonus (1200) plus combo bonus beats the first one
    expect(b.gained).toBeGreaterThan(a.gained + 300)
  })

  it('levels up every 10 lines', () => {
    const g = gameWith(['I'])
    g.start()
    const levels: number[] = []
    g.on((e) => e.type === 'level' && levels.push(e.level))
    for (let n = 0; n < 3; n++) {
      fillRows(g.board, [ROWS - 4, ROWS - 3, ROWS - 2, ROWS - 1], [0])
      g.rotate(-1)
      while (g.move(-1)) {
        /* wall */
      }
      g.hardDrop()
    }
    expect(g.lines).toBe(12)
    expect(g.level).toBe(2)
    expect(levels).toEqual([2])
  })

  it('locks after the lock delay when resting on the floor', () => {
    const g = gameWith(['O', 'T'])
    g.start()
    while (g.softDrop()) {
      /* to the floor */
    }
    expect(g.active!.type).toBe('O')
    g.tick(499)
    expect(g.active!.type).toBe('O')
    g.tick(2)
    expect(g.active!.type).toBe('T')
  })

  it('caps lock-delay resets so pieces cannot stall forever', () => {
    const g = gameWith(['T', 'O'])
    g.start()
    while (g.softDrop()) {
      /* to the floor */
    }
    let locked = false
    g.on((e) => e.type === 'lock' && (locked = true))
    for (let i = 0; i < 40 && !locked; i++) {
      g.tick(300)
      g.rotate(1)
    }
    expect(locked).toBe(true)
  })

  it('hold swaps once per piece', () => {
    const g = gameWith(['T', 'L', 'J'])
    g.start()
    expect(g.active!.type).toBe('T')
    g.holdPiece()
    expect(g.hold).toBe('T')
    expect(g.active!.type).toBe('L')
    g.holdPiece()
    expect(g.active!.type).toBe('L') // second hold ignored
    g.hardDrop()
    g.holdPiece()
    expect(g.active!.type).toBe('T')
    expect(g.hold).toBe('J')
  })

  it('ends the game when a new piece cannot spawn', () => {
    const g = gameWith(['O'])
    g.start()
    for (let y = HIDDEN_ROWS; y < ROWS; y++) for (let x = 0; x < COLS; x++) g.board[y][x] = x === 0 ? null : 'Z'
    g.hardDrop()
    expect(g.status).toBe('over')
  })

  it('gravity moves the piece down over time', () => {
    const g = gameWith(['T'])
    g.start()
    const y0 = g.active!.y
    g.tick(1000)
    expect(g.active!.y).toBe(y0 + 1)
  })

  it('pausing stops time', () => {
    const g = gameWith(['T'])
    g.start()
    g.pause()
    const y0 = g.active!.y
    g.tick(5000)
    expect(g.active!.y).toBe(y0)
    g.resume()
    g.tick(1000)
    expect(g.active!.y).toBe(y0 + 1)
  })
})

describe('7-bag randomizer', () => {
  it('deals each piece exactly once per bag', () => {
    const r = new Randomizer(seeded(42))
    for (let bag = 0; bag < 20; bag++) {
      const seen = Array.from({ length: 7 }, () => r.next())
      expect(new Set(seen).size).toBe(7)
    }
  })

  it('peek does not consume pieces', () => {
    const r = new Randomizer(seeded(7))
    const peeked = r.peek(3)
    expect([r.next(), r.next(), r.next()]).toEqual(peeked)
  })
})
