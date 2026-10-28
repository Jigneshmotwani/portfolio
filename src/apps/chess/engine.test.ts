import { Chess } from 'chess.js'
import { describe, expect, it } from 'vitest'
import { Position, perft, search, squareName, moveFrom, moveTo } from './engine'

const START = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
const KIWIPETE = 'r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1'

/** Deterministic PRNG so noisy levels are reproducible in tests. */
function rng(seed = 42) {
  return () => {
    seed = (seed * 1664525 + 1013904223) >>> 0
    return seed / 2 ** 32
  }
}

describe('move generator', () => {
  it('matches perft counts', () => {
    expect(perft(START, 1)).toBe(20)
    expect(perft(START, 3)).toBe(8902)
    expect(perft(KIWIPETE, 1)).toBe(48)
    expect(perft(KIWIPETE, 2)).toBe(2039)
    expect(perft(KIWIPETE, 3)).toBe(97862)
    // en passant / promotion edge cases ("position 3" and "position 4")
    expect(perft('8/2p5/3p4/KP5r/1R3p1k/8/4P1P1/8 w - - 0 1', 4)).toBe(43238)
    expect(perft('r3k2r/Pppp1ppp/1b3nbN/nP6/BBP1P3/q4N2/Pp1P2PP/R2Q1RK1 w kq - 0 1', 3)).toBe(9467)
  })

  it('agrees with chess.js on legal moves in random games', () => {
    const random = rng(7)
    for (let game = 0; game < 12; game++) {
      const chess = new Chess()
      for (let ply = 0; ply < 60 && !chess.isGameOver(); ply++) {
        const ours = new Position(chess.fen())
          .legalMoves()
          .map((m) => squareName(moveFrom(m)) + squareName(moveTo(m)))
          .sort()
        const theirs = [...new Set(chess.moves({ verbose: true }).map((m) => m.from + m.to))].sort()
        expect([...new Set(ours)]).toEqual(theirs)
        const moves = chess.moves()
        chess.move(moves[Math.floor(random() * moves.length)])
      }
    }
  })
})

describe('search', () => {
  it('only returns legal moves at every level', () => {
    const chess = new Chess()
    const random = rng(3)
    for (let i = 0; i < 16 && !chess.isGameOver(); i++) {
      const level = (['easy', 'medium'] as const)[i % 2]
      const res = search({ fen: chess.fen(), level }, { random, timeMs: 150 })
      expect(res).not.toBeNull()
      expect(() => chess.move({ from: res!.from, to: res!.to, promotion: res!.promotion })).not.toThrow()
    }
  })

  it('finds mate in one', () => {
    const res = search({ fen: '6k1/5ppp/8/8/8/8/5PPP/R5K1 w - - 0 1', level: 'medium' })
    expect(res?.from).toBe('a1')
    expect(res?.to).toBe('a8')
    expect(res?.mate).toBe(1)
    const res2 = search({ fen: 'r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5Q2/PPPP1PPP/RNB1K1NR w KQkq - 4 4', level: 'hard' })
    expect(res2?.to).toBe('f7')
  })

  it('does not hang its queen at medium', () => {
    // The white queen on d4 is attacked by the e5 pawn.
    const res = search({ fen: 'rnbqkbnr/pppp1ppp/8/4p3/3Q4/8/PPPP1PPP/RNB1KBNR w KQkq - 0 3', level: 'medium' }, { random: rng(1) })
    expect(res?.from).toBe('d4')
    // And it takes a queen that is left hanging (Nxh4), whatever the root noise.
    for (const r of [0, 0.5, 0.99]) {
      const take = search({ fen: 'rnb1kbnr/pppp1ppp/8/4p3/4P2q/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3', level: 'medium' }, { random: () => r })
      expect(take?.to).toBe('h4')
    }
  })

  it('returns null when there are no legal moves', () => {
    expect(search({ fen: '7k/5Q2/6K1/8/8/8/8/8 b - - 0 1', level: 'hard' })).toBeNull()
  })
})
