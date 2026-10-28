/**
 * Small chess engine for the Chess app.
 *
 * chess.js handles the rules in the UI; this file has its own fast 0x88
 * move generator so the search can reach useful depths in JavaScript.
 * Search: negamax with alpha-beta, iterative deepening on a time budget,
 * transposition table (Zobrist hashing), null-move pruning, check
 * extensions, quiescence search on captures, and MVV-LVA / killer / history
 * move ordering. Evaluation: material + piece-square tables (the classic
 * "simplified evaluation function"), tapered king tables, bishop pair and a
 * mop-up term so it can finish won endgames.
 */

export type Level = 'easy' | 'medium' | 'hard' | 'hint'

export interface SearchRequest {
  fen: string
  level: Level
  /** FENs of earlier game positions, for repetition awareness. */
  history?: string[]
}

export interface SearchResult {
  from: string
  to: string
  promotion?: 'q' | 'r' | 'b' | 'n'
  /** Centipawns from the side to move's point of view. */
  score: number
  depth: number
  nodes: number
  timeMs: number
  /** Moves to mate (positive: side to move mates). */
  mate?: number
}

const P = 1
const N = 2
const B = 3
const R = 4
const Q = 5
const K = 6

const FLAG_EP = 1
const FLAG_CASTLE = 2
const FLAG_DOUBLE = 4

const VALUE = [0, 100, 320, 330, 500, 900, 20000]
const MATE = 100000
const INF = 1000000
const MAX_PLY = 64

const KNIGHT_DIRS = [-33, -31, -18, -14, 14, 18, 31, 33]
const KING_DIRS = [-17, -16, -15, -1, 1, 15, 16, 17]
const DIAG_DIRS = [-17, -15, 15, 17]
const ORTHO_DIRS = [-16, -1, 1, 16]

// Piece-square tables, white's point of view, index = row * 8 + col with row 0 = rank 8.
// prettier-ignore
const PST: number[][] = [
  [],
  [ 0,  0,  0,  0,  0,  0,  0,  0,
   50, 50, 50, 50, 50, 50, 50, 50,
   10, 10, 20, 30, 30, 20, 10, 10,
    5,  5, 10, 25, 25, 10,  5,  5,
    0,  0,  0, 20, 20,  0,  0,  0,
    5, -5,-10,  0,  0,-10, -5,  5,
    5, 10, 10,-20,-20, 10, 10,  5,
    0,  0,  0,  0,  0,  0,  0,  0],
  [-50,-40,-30,-30,-30,-30,-40,-50,
   -40,-20,  0,  0,  0,  0,-20,-40,
   -30,  0, 10, 15, 15, 10,  0,-30,
   -30,  5, 15, 20, 20, 15,  5,-30,
   -30,  0, 15, 20, 20, 15,  0,-30,
   -30,  5, 10, 15, 15, 10,  5,-30,
   -40,-20,  0,  5,  5,  0,-20,-40,
   -50,-40,-30,-30,-30,-30,-40,-50],
  [-20,-10,-10,-10,-10,-10,-10,-20,
   -10,  0,  0,  0,  0,  0,  0,-10,
   -10,  0,  5, 10, 10,  5,  0,-10,
   -10,  5,  5, 10, 10,  5,  5,-10,
   -10,  0, 10, 10, 10, 10,  0,-10,
   -10, 10, 10, 10, 10, 10, 10,-10,
   -10,  5,  0,  0,  0,  0,  5,-10,
   -20,-10,-10,-10,-10,-10,-10,-20],
  [ 0,  0,  0,  0,  0,  0,  0,  0,
    5, 10, 10, 10, 10, 10, 10,  5,
   -5,  0,  0,  0,  0,  0,  0, -5,
   -5,  0,  0,  0,  0,  0,  0, -5,
   -5,  0,  0,  0,  0,  0,  0, -5,
   -5,  0,  0,  0,  0,  0,  0, -5,
   -5,  0,  0,  0,  0,  0,  0, -5,
    0,  0,  0,  5,  5,  0,  0,  0],
  [-20,-10,-10, -5, -5,-10,-10,-20,
   -10,  0,  0,  0,  0,  0,  0,-10,
   -10,  0,  5,  5,  5,  5,  0,-10,
    -5,  0,  5,  5,  5,  5,  0, -5,
     0,  0,  5,  5,  5,  5,  0, -5,
   -10,  5,  5,  5,  5,  5,  0,-10,
   -10,  0,  5,  0,  0,  0,  0,-10,
   -20,-10,-10, -5, -5,-10,-10,-20],
  // King, middle game
  [-30,-40,-40,-50,-50,-40,-40,-30,
   -30,-40,-40,-50,-50,-40,-40,-30,
   -30,-40,-40,-50,-50,-40,-40,-30,
   -30,-40,-40,-50,-50,-40,-40,-30,
   -20,-30,-30,-40,-40,-30,-30,-20,
   -10,-20,-20,-20,-20,-20,-20,-10,
    20, 20,  0,  0,  0,  0, 20, 20,
    20, 30, 10,  0,  0, 10, 30, 20],
]
// prettier-ignore
const KING_END = [
  -50,-40,-30,-20,-20,-30,-40,-50,
  -30,-20,-10,  0,  0,-10,-20,-30,
  -30,-10, 20, 30, 30, 20,-10,-30,
  -30,-10, 30, 40, 40, 30,-10,-30,
  -30,-10, 30, 40, 40, 30,-10,-30,
  -30,-10, 20, 30, 30, 20,-10,-30,
  -30,-30,  0,  0,  0,  0,-30,-30,
  -50,-30,-30,-30,-30,-30,-30,-50,
]

/** Castling rights kept after a move touches a square (WK=1, WQ=2, BK=4, BQ=8). */
const CASTLE_MASK = new Int8Array(128).fill(15)
CASTLE_MASK[0x74] = 12 // e1
CASTLE_MASK[0x77] = 14 // h1
CASTLE_MASK[0x70] = 13 // a1
CASTLE_MASK[0x04] = 3 // e8
CASTLE_MASK[0x07] = 11 // h8
CASTLE_MASK[0x00] = 7 // a8

// Zobrist keys: two 32-bit halves (index into table / verification).
let seed = 0x2f6b9e3d
function rand32() {
  seed ^= seed << 13
  seed ^= seed >>> 17
  seed ^= seed << 5
  return seed | 0
}
const ZP_LO = new Int32Array(12 * 128)
const ZP_HI = new Int32Array(12 * 128)
for (let i = 0; i < 12 * 128; i++) {
  ZP_LO[i] = rand32()
  ZP_HI[i] = rand32()
}
const ZC_LO = Int32Array.from({ length: 16 }, rand32)
const ZC_HI = Int32Array.from({ length: 16 }, rand32)
const ZE_LO = Int32Array.from({ length: 8 }, rand32)
const ZE_HI = Int32Array.from({ length: 8 }, rand32)
const ZS_LO = rand32()
const ZS_HI = rand32()

const zIndex = (piece: number, sq: number) => ((piece > 0 ? piece - 1 : 5 - piece) << 7) | sq

const FEN_PIECES: Record<string, number> = { P, N, B, R, Q, K, p: -P, n: -N, b: -B, r: -R, q: -Q, k: -K }
const FILES = 'abcdefgh'

export function squareName(sq: number): string {
  return FILES[sq & 7] + String(8 - (sq >> 4))
}

export function squareIndex(name: string): number {
  return (8 - Number(name[1])) * 16 + FILES.indexOf(name[0])
}

export const moveFrom = (m: number) => m & 127
export const moveTo = (m: number) => (m >> 7) & 127
export const movePromo = (m: number) => (m >> 14) & 7
const moveFlags = (m: number) => m >> 17
const encode = (from: number, to: number, promo = 0, flags = 0) => from | (to << 7) | (promo << 14) | (flags << 17)

const STACK = 1024

export class Position {
  b = new Int8Array(128)
  side = 1
  castle = 0
  ep = -1
  half = 0
  kings = new Int16Array(2)
  lo = 0
  hi = 0

  // Undo stack
  private sp = 0
  private uCap = new Int8Array(STACK)
  private uCastle = new Int8Array(STACK)
  private uEp = new Int16Array(STACK)
  private uHalf = new Int16Array(STACK)
  private uLo = new Int32Array(STACK)
  private uHi = new Int32Array(STACK)

  // Position history for repetition detection
  histLo = new Int32Array(STACK * 2)
  histHi = new Int32Array(STACK * 2)
  histHalf = new Int16Array(STACK * 2)
  hist = 0

  constructor(fen?: string) {
    if (fen) this.load(fen)
  }

  load(fen: string) {
    const b = this.b
    b.fill(0)
    const [placement, turn = 'w', castling = '-', ep = '-', half = '0'] = fen.trim().split(/\s+/)
    const rows = placement.split('/')
    for (let r = 0; r < 8; r++) {
      let col = 0
      for (const ch of rows[r] ?? '') {
        if (ch >= '1' && ch <= '8') {
          col += Number(ch)
          continue
        }
        const sq = r * 16 + col
        const p = FEN_PIECES[ch] ?? 0
        b[sq] = p
        if (p === K) this.kings[0] = sq
        if (p === -K) this.kings[1] = sq
        col++
      }
    }
    this.side = turn === 'b' ? -1 : 1
    this.castle =
      (castling.includes('K') ? 1 : 0) | (castling.includes('Q') ? 2 : 0) | (castling.includes('k') ? 4 : 0) | (castling.includes('q') ? 8 : 0)
    this.ep = ep !== '-' && /^[a-h][36]$/.test(ep) ? squareIndex(ep) : -1
    this.half = Number(half) || 0
    this.sp = 0
    this.computeHash()
    this.hist = 0
    this.pushHistory()
  }

  private computeHash() {
    let lo = 0
    let hi = 0
    for (let sq = 0; sq < 128; sq++) {
      if (sq & 0x88) {
        sq += 7
        continue
      }
      const p = this.b[sq]
      if (p) {
        const i = zIndex(p, sq)
        lo ^= ZP_LO[i]
        hi ^= ZP_HI[i]
      }
    }
    lo ^= ZC_LO[this.castle]
    hi ^= ZC_HI[this.castle]
    if (this.ep >= 0) {
      lo ^= ZE_LO[this.ep & 7]
      hi ^= ZE_HI[this.ep & 7]
    }
    if (this.side < 0) {
      lo ^= ZS_LO
      hi ^= ZS_HI
    }
    this.lo = lo
    this.hi = hi
  }

  pushHistory() {
    this.histLo[this.hist] = this.lo
    this.histHi[this.hist] = this.hi
    this.histHalf[this.hist] = this.half
    this.hist++
  }

  /** True when the current position already occurred since the last irreversible move. */
  isRepetition(): boolean {
    const last = this.hist - 1
    const stop = Math.max(0, last - this.half)
    for (let i = last - 2; i >= stop; i -= 2) {
      if (this.histLo[i] === this.lo && this.histHi[i] === this.hi) return true
    }
    return false
  }

  attacked(sq: number, by: number): boolean {
    const b = this.b
    if (by > 0) {
      if (!((sq + 15) & 0x88) && b[sq + 15] === P) return true
      if (!((sq + 17) & 0x88) && b[sq + 17] === P) return true
    } else {
      if (!((sq - 15) & 0x88) && b[sq - 15] === -P) return true
      if (!((sq - 17) & 0x88) && b[sq - 17] === -P) return true
    }
    const kn = by * N
    for (let i = 0; i < 8; i++) {
      const t = sq + KNIGHT_DIRS[i]
      if (!(t & 0x88) && b[t] === kn) return true
    }
    const kg = by * K
    for (let i = 0; i < 8; i++) {
      const t = sq + KING_DIRS[i]
      if (!(t & 0x88) && b[t] === kg) return true
    }
    const bi = by * B
    const ro = by * R
    const qu = by * Q
    for (let i = 0; i < 4; i++) {
      const d = DIAG_DIRS[i]
      let t = sq + d
      while (!(t & 0x88)) {
        const p = b[t]
        if (p) {
          if (p === bi || p === qu) return true
          break
        }
        t += d
      }
    }
    for (let i = 0; i < 4; i++) {
      const d = ORTHO_DIRS[i]
      let t = sq + d
      while (!(t & 0x88)) {
        const p = b[t]
        if (p) {
          if (p === ro || p === qu) return true
          break
        }
        t += d
      }
    }
    return false
  }

  inCheck(): boolean {
    return this.attacked(this.kings[this.side > 0 ? 0 : 1], -this.side)
  }

  /** Pseudo-legal moves into `out` starting at `n`; returns the new end index. */
  generate(out: Int32Array, n: number, capturesOnly: boolean): number {
    const b = this.b
    const s = this.side
    for (let sq = 0; sq < 128; sq++) {
      if (sq & 0x88) {
        sq += 7
        continue
      }
      const p = b[sq]
      if (p === 0 || (p > 0) !== (s > 0)) continue
      const t = p > 0 ? p : -p
      if (t === P) {
        const fwd = s > 0 ? -16 : 16
        const startRow = s > 0 ? 6 : 1
        const promoRow = s > 0 ? 0 : 7
        const to = sq + fwd
        if (!(to & 0x88) && b[to] === 0) {
          if (to >> 4 === promoRow) {
            out[n++] = encode(sq, to, Q)
            if (!capturesOnly) {
              out[n++] = encode(sq, to, N)
              out[n++] = encode(sq, to, R)
              out[n++] = encode(sq, to, B)
            }
          } else if (!capturesOnly) {
            out[n++] = encode(sq, to)
            if (sq >> 4 === startRow && b[to + fwd] === 0) out[n++] = encode(sq, to + fwd, 0, FLAG_DOUBLE)
          }
        }
        for (let k = -1; k <= 1; k += 2) {
          const c = to + k
          if (c & 0x88) continue
          const q = b[c]
          if (q !== 0 && (q > 0) !== (s > 0)) {
            if (c >> 4 === promoRow) {
              out[n++] = encode(sq, c, Q)
              if (!capturesOnly) {
                out[n++] = encode(sq, c, N)
                out[n++] = encode(sq, c, R)
                out[n++] = encode(sq, c, B)
              }
            } else out[n++] = encode(sq, c)
          } else if (c === this.ep) out[n++] = encode(sq, c, 0, FLAG_EP)
        }
        continue
      }
      if (t === N || t === K) {
        const dirs = t === N ? KNIGHT_DIRS : KING_DIRS
        for (let i = 0; i < 8; i++) {
          const to = sq + dirs[i]
          if (to & 0x88) continue
          const q = b[to]
          if (q === 0) {
            if (!capturesOnly) out[n++] = encode(sq, to)
          } else if ((q > 0) !== (s > 0)) out[n++] = encode(sq, to)
        }
        if (t === K && !capturesOnly) n = this.castling(out, n)
        continue
      }
      const dirs = t === B ? DIAG_DIRS : t === R ? ORTHO_DIRS : KING_DIRS
      for (let i = 0; i < dirs.length; i++) {
        const d = dirs[i]
        let to = sq + d
        while (!(to & 0x88)) {
          const q = b[to]
          if (q === 0) {
            if (!capturesOnly) out[n++] = encode(sq, to)
          } else {
            if ((q > 0) !== (s > 0)) out[n++] = encode(sq, to)
            break
          }
          to += d
        }
      }
    }
    return n
  }

  private castling(out: Int32Array, n: number): number {
    const b = this.b
    if (this.side > 0) {
      if (this.castle & 1 && b[0x77] === R && !b[0x75] && !b[0x76] && !this.attacked(0x74, -1) && !this.attacked(0x75, -1) && !this.attacked(0x76, -1))
        out[n++] = encode(0x74, 0x76, 0, FLAG_CASTLE)
      if (this.castle & 2 && b[0x70] === R && !b[0x73] && !b[0x72] && !b[0x71] && !this.attacked(0x74, -1) && !this.attacked(0x73, -1) && !this.attacked(0x72, -1))
        out[n++] = encode(0x74, 0x72, 0, FLAG_CASTLE)
    } else {
      if (this.castle & 4 && b[0x07] === -R && !b[0x05] && !b[0x06] && !this.attacked(0x04, 1) && !this.attacked(0x05, 1) && !this.attacked(0x06, 1))
        out[n++] = encode(0x04, 0x06, 0, FLAG_CASTLE)
      if (this.castle & 8 && b[0x00] === -R && !b[0x03] && !b[0x02] && !b[0x01] && !this.attacked(0x04, 1) && !this.attacked(0x03, 1) && !this.attacked(0x02, 1))
        out[n++] = encode(0x04, 0x02, 0, FLAG_CASTLE)
    }
    return n
  }

  private xorPiece(p: number, sq: number) {
    const i = zIndex(p, sq)
    this.lo ^= ZP_LO[i]
    this.hi ^= ZP_HI[i]
  }

  /** Plays a pseudo-legal move. Returns false (and restores the position) if it leaves the king in check. */
  make(m: number): boolean {
    const b = this.b
    const s = this.side
    const from = m & 127
    const to = (m >> 7) & 127
    const promo = (m >> 14) & 7
    const flags = m >> 17
    const p = b[from]
    const sp = ++this.sp
    this.uCastle[sp] = this.castle
    this.uEp[sp] = this.ep
    this.uHalf[sp] = this.half
    this.uLo[sp] = this.lo
    this.uHi[sp] = this.hi

    let cap = b[to]
    this.xorPiece(p, from)
    if (flags & FLAG_EP) {
      const capSq = to + (s > 0 ? 16 : -16)
      cap = b[capSq]
      b[capSq] = 0
      this.xorPiece(cap, capSq)
    } else if (cap) this.xorPiece(cap, to)
    this.uCap[sp] = cap

    const placed = promo ? s * promo : p
    b[to] = placed
    b[from] = 0
    this.xorPiece(placed, to)

    if (flags & FLAG_CASTLE) {
      let rf = 0
      let rt = 0
      if (to === 0x76) (rf = 0x77), (rt = 0x75)
      else if (to === 0x72) (rf = 0x70), (rt = 0x73)
      else if (to === 0x06) (rf = 0x07), (rt = 0x05)
      else (rf = 0x00), (rt = 0x03)
      const rook = b[rf]
      b[rt] = rook
      b[rf] = 0
      this.xorPiece(rook, rf)
      this.xorPiece(rook, rt)
    }
    if (p === K || p === -K) this.kings[s > 0 ? 0 : 1] = to

    if (this.ep >= 0) {
      this.lo ^= ZE_LO[this.ep & 7]
      this.hi ^= ZE_HI[this.ep & 7]
    }
    this.ep = flags & FLAG_DOUBLE ? (from + to) >> 1 : -1
    if (this.ep >= 0) {
      this.lo ^= ZE_LO[this.ep & 7]
      this.hi ^= ZE_HI[this.ep & 7]
    }
    this.lo ^= ZC_LO[this.castle]
    this.hi ^= ZC_HI[this.castle]
    this.castle &= CASTLE_MASK[from] & CASTLE_MASK[to]
    this.lo ^= ZC_LO[this.castle]
    this.hi ^= ZC_HI[this.castle]

    this.half = p === P || p === -P || cap ? 0 : this.half + 1
    this.side = -s
    this.lo ^= ZS_LO
    this.hi ^= ZS_HI
    this.pushHistory()

    if (this.attacked(this.kings[s > 0 ? 0 : 1], -s)) {
      this.unmake(m)
      return false
    }
    return true
  }

  unmake(m: number) {
    const b = this.b
    this.hist--
    this.side = -this.side
    const s = this.side
    const from = m & 127
    const to = (m >> 7) & 127
    const promo = (m >> 14) & 7
    const flags = m >> 17
    const sp = this.sp--
    const moved = promo ? s * P : b[to]
    b[from] = moved
    if (flags & FLAG_EP) {
      b[to] = 0
      b[to + (s > 0 ? 16 : -16)] = this.uCap[sp]
    } else b[to] = this.uCap[sp]
    if (flags & FLAG_CASTLE) {
      if (to === 0x76) (b[0x77] = b[0x75]), (b[0x75] = 0)
      else if (to === 0x72) (b[0x70] = b[0x73]), (b[0x73] = 0)
      else if (to === 0x06) (b[0x07] = b[0x05]), (b[0x05] = 0)
      else (b[0x00] = b[0x03]), (b[0x03] = 0)
    }
    if (moved === K || moved === -K) this.kings[s > 0 ? 0 : 1] = from
    this.castle = this.uCastle[sp]
    this.ep = this.uEp[sp]
    this.half = this.uHalf[sp]
    this.lo = this.uLo[sp]
    this.hi = this.uHi[sp]
  }

  makeNull() {
    const sp = ++this.sp
    this.uEp[sp] = this.ep
    this.uHalf[sp] = this.half
    this.uLo[sp] = this.lo
    this.uHi[sp] = this.hi
    if (this.ep >= 0) {
      this.lo ^= ZE_LO[this.ep & 7]
      this.hi ^= ZE_HI[this.ep & 7]
    }
    this.ep = -1
    this.half = 0
    this.side = -this.side
    this.lo ^= ZS_LO
    this.hi ^= ZS_HI
    this.pushHistory()
  }

  unmakeNull() {
    this.hist--
    const sp = this.sp--
    this.side = -this.side
    this.ep = this.uEp[sp]
    this.half = this.uHalf[sp]
    this.lo = this.uLo[sp]
    this.hi = this.uHi[sp]
  }

  /** All legal moves (encoded). */
  legalMoves(): number[] {
    const buf = new Int32Array(256)
    const n = this.generate(buf, 0, false)
    const legal: number[] = []
    for (let i = 0; i < n; i++) {
      if (this.make(buf[i])) {
        this.unmake(buf[i])
        legal.push(buf[i])
      }
    }
    return legal
  }

  hasNonPawnMaterial(side: number): boolean {
    const b = this.b
    for (let sq = 0; sq < 128; sq++) {
      if (sq & 0x88) {
        sq += 7
        continue
      }
      const p = b[sq] * side
      if (p > P && p < K) return true
    }
    return false
  }

  /** Static evaluation in centipawns from the side to move's point of view. */
  evaluate(): number {
    const b = this.b
    let score = 0
    let npm = 0
    let wb = 0
    let bb = 0
    let wMat = 0
    let bMat = 0
    for (let sq = 0; sq < 128; sq++) {
      if (sq & 0x88) {
        sq += 7
        continue
      }
      const p = b[sq]
      if (!p) continue
      const row = sq >> 4
      const col = sq & 7
      if (p > 0) {
        if (p !== K) {
          score += VALUE[p] + PST[p][row * 8 + col]
          wMat += VALUE[p]
          if (p !== P) npm += VALUE[p]
          if (p === B) wb++
        }
      } else {
        const t = -p
        if (t !== K) {
          score -= VALUE[t] + PST[t][(7 - row) * 8 + col]
          bMat += VALUE[t]
          if (t !== P) npm += VALUE[t]
          if (t === B) bb++
        }
      }
    }
    if (wb >= 2) score += 30
    if (bb >= 2) score -= 30

    const phase = Math.min(1, npm / 6400) // 1 = opening, 0 = bare endgame
    const wk = this.kings[0]
    const bk = this.kings[1]
    const wIdx = (wk >> 4) * 8 + (wk & 7)
    const bIdx = (7 - (bk >> 4)) * 8 + (bk & 7)
    score += Math.round(PST[K][wIdx] * phase + KING_END[wIdx] * (1 - phase))
    score -= Math.round(PST[K][bIdx] * phase + KING_END[bIdx] * (1 - phase))

    // Mop-up: with a big material edge in the endgame, push the losing king to the edge.
    const diff = wMat - bMat
    if (phase < 0.45 && Math.abs(diff) >= 400) {
      const loser = diff > 0 ? bk : wk
      const lr = loser >> 4
      const lc = loser & 7
      const centre = Math.max(3 - lr, lr - 4) + Math.max(3 - lc, lc - 4)
      const dist = Math.abs((wk >> 4) - (bk >> 4)) + Math.abs((wk & 7) - (bk & 7))
      const bonus = 10 * centre + 4 * (14 - dist)
      score += diff > 0 ? bonus : -bonus
    }
    return score * this.side
  }
}

/* ───────────────────────────── Search ───────────────────────────── */

const TT_BITS = 18
const TT_SIZE = 1 << TT_BITS
const TT_MASK = TT_SIZE - 1
const TT_EXACT = 1
const TT_LOWER = 2
const TT_UPPER = 3

class Searcher {
  pos = new Position()
  nodes = 0
  aborted = false
  deadline = 0
  ttHi = new Int32Array(TT_SIZE)
  ttMove = new Int32Array(TT_SIZE)
  ttScore = new Int32Array(TT_SIZE)
  ttDepth = new Int8Array(TT_SIZE)
  ttFlag = new Uint8Array(TT_SIZE)
  moveBuf = new Int32Array(MAX_PLY * 256 + 512)
  scoreBuf = new Int32Array(MAX_PLY * 256 + 512)
  killers = new Int32Array(MAX_PLY * 2)
  history = new Int32Array(128 * 128)

  reset() {
    this.ttFlag.fill(0)
    this.killers.fill(0)
    this.history.fill(0)
  }

  private now() {
    return typeof performance !== 'undefined' ? performance.now() : Date.now()
  }

  private checkTime() {
    if ((++this.nodes & 1023) === 0 && this.now() > this.deadline) this.aborted = true
  }

  private orderScores(start: number, end: number, ttMove: number, ply: number) {
    const b = this.pos.b
    for (let i = start; i < end; i++) {
      const m = this.moveBuf[i]
      let s = 0
      if (m === ttMove) s = 2_000_000
      else {
        const from = m & 127
        const to = (m >> 7) & 127
        const victim = b[to]
        const promo = (m >> 14) & 7
        if (victim || (m >> 17) & FLAG_EP) {
          const v = victim ? Math.abs(victim) : P
          s = 1_000_000 + VALUE[v] * 16 - Math.abs(b[from])
        } else if (promo) s = 900_000 + VALUE[promo]
        else if (m === this.killers[ply * 2]) s = 800_000
        else if (m === this.killers[ply * 2 + 1]) s = 790_000
        else s = this.history[from * 128 + to]
      }
      this.scoreBuf[i] = s
    }
  }

  /** Moves the best-scored remaining move to index i. */
  private pick(i: number, end: number) {
    let best = i
    for (let j = i + 1; j < end; j++) if (this.scoreBuf[j] > this.scoreBuf[best]) best = j
    if (best !== i) {
      const m = this.moveBuf[i]
      this.moveBuf[i] = this.moveBuf[best]
      this.moveBuf[best] = m
      const s = this.scoreBuf[i]
      this.scoreBuf[i] = this.scoreBuf[best]
      this.scoreBuf[best] = s
    }
  }

  quiesce(alpha: number, beta: number, ply: number): number {
    this.checkTime()
    if (this.aborted) return 0
    const pos = this.pos
    const inCheck = pos.inCheck()
    if (!inCheck) {
      const stand = pos.evaluate()
      if (stand >= beta) return stand
      if (stand > alpha) alpha = stand
    }
    if (ply >= MAX_PLY - 1) return pos.evaluate()
    const start = ply * 256
    const end = pos.generate(this.moveBuf, start, !inCheck)
    this.orderScores(start, end, 0, ply)
    let legal = 0
    let best = inCheck ? -INF : alpha
    for (let i = start; i < end; i++) {
      this.pick(i, end)
      const m = this.moveBuf[i]
      if (!pos.make(m)) continue
      legal++
      const score = -this.quiesce(-beta, -alpha, ply + 1)
      pos.unmake(m)
      if (this.aborted) return 0
      if (score > best) best = score
      if (score > alpha) alpha = score
      if (alpha >= beta) break
    }
    if (inCheck && legal === 0) return -MATE + ply
    return inCheck ? best : alpha
  }

  negamax(depth: number, alpha: number, beta: number, ply: number, allowNull: boolean): number {
    this.checkTime()
    if (this.aborted) return 0
    const pos = this.pos
    if (ply > 0 && (pos.half >= 100 || pos.isRepetition())) return 0
    const inCheck = pos.inCheck()
    if (inCheck) depth++
    if (depth <= 0) return this.quiesce(alpha, beta, ply)
    if (ply >= MAX_PLY - 1) return pos.evaluate()

    const alphaOrig = alpha
    const idx = pos.lo & TT_MASK
    let ttMove = 0
    if (this.ttFlag[idx] && this.ttHi[idx] === pos.hi) {
      ttMove = this.ttMove[idx]
      if (ply > 0 && this.ttDepth[idx] >= depth) {
        let s = this.ttScore[idx]
        if (s > MATE - 1000) s -= ply
        else if (s < -MATE + 1000) s += ply
        const f = this.ttFlag[idx]
        if (f === TT_EXACT) return s
        if (f === TT_LOWER && s > alpha) alpha = s
        else if (f === TT_UPPER && s < beta) beta = s
        if (alpha >= beta) return s
      }
    }

    if (allowNull && !inCheck && ply > 0 && depth >= 3 && beta < MATE - 1000 && pos.hasNonPawnMaterial(pos.side)) {
      pos.makeNull()
      const score = -this.negamax(depth - 3, -beta, -beta + 1, ply + 1, false)
      pos.unmakeNull()
      if (this.aborted) return 0
      if (score >= beta) return beta
    }

    const start = ply * 256
    const end = pos.generate(this.moveBuf, start, false)
    this.orderScores(start, end, ttMove, ply)
    let legal = 0
    let best = -INF
    let bestMove = 0
    for (let i = start; i < end; i++) {
      this.pick(i, end)
      const m = this.moveBuf[i]
      if (!pos.make(m)) continue
      legal++
      const score = -this.negamax(depth - 1, -beta, -alpha, ply + 1, true)
      pos.unmake(m)
      if (this.aborted) return 0
      if (score > best) {
        best = score
        bestMove = m
      }
      if (score > alpha) alpha = score
      if (alpha >= beta) {
        const quiet = !pos.b[(m >> 7) & 127] && !((m >> 14) & 7) && !((m >> 17) & FLAG_EP)
        if (quiet) {
          if (this.killers[ply * 2] !== m) {
            this.killers[ply * 2 + 1] = this.killers[ply * 2]
            this.killers[ply * 2] = m
          }
          const h = (m & 127) * 128 + ((m >> 7) & 127)
          this.history[h] = Math.min(700_000, this.history[h] + depth * depth)
        }
        break
      }
    }
    if (legal === 0) return inCheck ? -MATE + ply : 0

    let stored = best
    if (stored > MATE - 1000) stored += ply
    else if (stored < -MATE + 1000) stored -= ply
    this.ttHi[idx] = pos.hi
    this.ttMove[idx] = bestMove
    this.ttScore[idx] = stored
    this.ttDepth[idx] = depth
    this.ttFlag[idx] = best <= alphaOrig ? TT_UPPER : best >= beta ? TT_LOWER : TT_EXACT
    return best
  }
}

const LEVELS: Record<Level, { maxDepth: number; timeMs: number; noise: number }> = {
  easy: { maxDepth: 1, timeMs: 300, noise: 170 },
  medium: { maxDepth: 3, timeMs: 1200, noise: 14 },
  hard: { maxDepth: 12, timeMs: 1500, noise: 6 },
  hint: { maxDepth: 5, timeMs: 700, noise: 0 },
}

const PROMO_LETTER: Record<number, 'q' | 'r' | 'b' | 'n'> = { [Q]: 'q', [R]: 'r', [B]: 'b', [N]: 'n' }

function toResult(m: number, score: number, depth: number, nodes: number, timeMs: number): SearchResult {
  const promo = movePromo(m)
  const res: SearchResult = { from: squareName(moveFrom(m)), to: squareName(moveTo(m)), score, depth, nodes, timeMs }
  if (promo) res.promotion = PROMO_LETTER[promo]
  if (Math.abs(score) > MATE - 1000) {
    const plies = MATE - Math.abs(score)
    res.mate = Math.sign(score) * Math.ceil(plies / 2)
  }
  return res
}

let searcher: Searcher | null = null

/** Finds a move for the side to move. Returns null when there are no legal moves. */
export function search(req: SearchRequest, opts: { random?: () => number; timeMs?: number } = {}): SearchResult | null {
  const random = opts.random ?? Math.random
  const cfg = LEVELS[req.level]
  const s = (searcher ??= new Searcher())
  s.reset()
  const pos = s.pos
  // Earlier game positions first (for repetition detection), then the current one.
  const hist: { lo: number; hi: number; half: number }[] = []
  for (const fen of req.history ?? []) {
    pos.load(fen)
    hist.push({ lo: pos.lo, hi: pos.hi, half: pos.half })
  }
  pos.load(req.fen)
  if (hist.length) {
    const cur = { lo: pos.lo, hi: pos.hi, half: pos.half }
    pos.hist = 0
    for (const h of hist.slice(-200)) {
      pos.histLo[pos.hist] = h.lo
      pos.histHi[pos.hist] = h.hi
      pos.histHalf[pos.hist] = h.half
      pos.hist++
    }
    pos.histLo[pos.hist] = cur.lo
    pos.histHi[pos.hist] = cur.hi
    pos.histHalf[pos.hist] = cur.half
    pos.hist++
  }

  const t0 = typeof performance !== 'undefined' ? performance.now() : Date.now()
  const elapsed = () => (typeof performance !== 'undefined' ? performance.now() : Date.now()) - t0
  const legal = pos.legalMoves()
  if (!legal.length) return null
  if (legal.length === 1) return toResult(legal[0], 0, 0, 0, elapsed())

  s.nodes = 0
  s.aborted = false
  s.deadline = t0 + (opts.timeMs ?? cfg.timeMs)

  // Easy: shallow look at every move plus a lot of noise (and the odd random move).
  if (req.level === 'easy') {
    if (random() < 0.12) return toResult(legal[Math.floor(random() * legal.length)], 0, 0, 0, elapsed())
    let best = legal[0]
    let bestScore = -INF
    for (const m of legal) {
      pos.make(m)
      const sc = -s.quiesce(-INF, INF, 1) + (random() - 0.5) * cfg.noise
      pos.unmake(m)
      if (s.aborted) break
      if (sc > bestScore) {
        bestScore = sc
        best = m
      }
    }
    return toResult(best, Math.round(bestScore), 1, s.nodes, elapsed())
  }

  // A little root noise early in the game so the computer doesn't always play the same opening.
  const fullmove = Number(req.fen.split(/\s+/)[5]) || 1
  const noise = new Map<number, number>()
  for (const m of legal) noise.set(m, fullmove <= 8 ? Math.round(random() * cfg.noise) : 0)

  let rootMoves = legal.slice()
  let bestMove = rootMoves[0]
  let bestScore = 0
  let completedDepth = 0
  for (let depth = 1; depth <= cfg.maxDepth; depth++) {
    let alpha = -INF
    const beta = INF
    let iterBest = 0
    let iterScore = -INF
    const scored: { m: number; s: number }[] = []
    for (const m of rootMoves) {
      pos.make(m)
      let sc = -s.negamax(depth - 1, -beta, -alpha, 1, true)
      pos.unmake(m)
      if (s.aborted) break
      if (Math.abs(sc) < MATE - 1000) sc += noise.get(m) ?? 0
      scored.push({ m, s: sc })
      if (sc > iterScore) {
        iterScore = sc
        iterBest = m
      }
      if (sc > alpha) alpha = sc
    }
    if (s.aborted) {
      // The previous best move is searched first, so once it has a score at
      // this depth, any move that beat it in this partial iteration is better.
      if (scored.length > 0) {
        bestMove = iterBest
        bestScore = iterScore
      }
      break
    }
    bestMove = iterBest
    bestScore = iterScore
    completedDepth = depth
    // Best move first next iteration, the rest by score.
    scored.sort((a, b) => b.s - a.s)
    rootMoves = scored.map((x) => x.m)
    if (Math.abs(bestScore) > MATE - 1000) break
    if (elapsed() > (opts.timeMs ?? cfg.timeMs) * 0.55) break
  }
  return toResult(bestMove, Math.round(bestScore), completedDepth, s.nodes, elapsed())
}

/** Counts leaf nodes (move-generator test). */
export function perft(fen: string, depth: number): number {
  const pos = new Position(fen)
  const buf = new Int32Array(256 * (depth + 1))
  const walk = (d: number, ply: number): number => {
    if (d === 0) return 1
    const start = ply * 256
    const end = pos.generate(buf, start, false)
    let count = 0
    for (let i = start; i < end; i++) {
      const m = buf[i]
      if (!pos.make(m)) continue
      count += walk(d - 1, ply + 1)
      pos.unmake(m)
    }
    return count
  }
  return walk(depth, 0)
}
