import { Chess, type Color, type PieceSymbol, type Square } from 'chess.js'
import { ArrowUpDown, Cpu, Lightbulb, Plus, RotateCcw, User } from 'lucide-react'
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import { playSound } from '../../lib/sound'
import { readJSON, writeJSON } from '../../lib/storage'
import { useIsland } from '../../state/island'
import { useApp } from '../types'
import type { Level } from './engine'
import { EngineClient } from './engineClient'
import { PieceSvg, pieceName } from './pieces'
import './chess.css'

type Difficulty = Exclude<Level, 'hint'>
interface SavedMove {
  from: string
  to: string
  promotion?: string
}
interface Saved {
  moves: SavedMove[]
  player: Color
  difficulty: Difficulty
  flipped: boolean
}

const STORE_KEY = 'jos.chess.v1'
const FILES = 'abcdefgh'
const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard']
const DIFF_LABEL: Record<Difficulty, string> = { easy: 'Easy', medium: 'Medium', hard: 'Hard' }
/** Minimum "thinking" time so instant replies don't feel robotic. */
const MIN_THINK: Record<Difficulty, number> = { easy: 550, medium: 380, hard: 220 }
const VALUES: Record<PieceSymbol, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 }
const START_COUNT: Record<PieceSymbol, number> = { p: 8, n: 2, b: 2, r: 2, q: 1, k: 1 }
const CAPTURE_ORDER: PieceSymbol[] = ['q', 'r', 'b', 'n', 'p']
const PROMOTIONS: PieceSymbol[] = ['q', 'r', 'b', 'n']

const other = (c: Color): Color => (c === 'w' ? 'b' : 'w')

function restore(): { game: Chess; saved: Saved } {
  const defaults: Saved = { moves: [], player: 'w', difficulty: 'medium', flipped: false }
  const raw = readJSON<Partial<Saved> | null>(STORE_KEY, null)
  const saved: Saved = {
    moves: Array.isArray(raw?.moves) ? raw.moves : [],
    player: raw?.player === 'b' ? 'b' : 'w',
    difficulty: DIFFICULTIES.includes(raw?.difficulty as Difficulty) ? (raw!.difficulty as Difficulty) : defaults.difficulty,
    flipped: !!raw?.flipped,
  }
  const game = new Chess()
  try {
    for (const m of saved.moves) game.move(m)
  } catch {
    game.reset()
    saved.moves = []
  }
  return { game, saved }
}

function resultOf(game: Chess, player: Color): { title: string; tone: 'win' | 'loss' | 'draw' } | null {
  if (game.isCheckmate()) {
    return other(game.turn()) === player ? { title: 'Checkmate — You win!', tone: 'win' } : { title: 'Checkmate — Computer wins', tone: 'loss' }
  }
  if (game.isStalemate()) return { title: 'Stalemate — Draw', tone: 'draw' }
  if (game.isInsufficientMaterial()) return { title: 'Draw — insufficient material', tone: 'draw' }
  if (game.isThreefoldRepetition()) return { title: 'Draw — threefold repetition', tone: 'draw' }
  if (game.isDrawByFiftyMoves()) return { title: 'Draw — 50-move rule', tone: 'draw' }
  if (game.isDraw()) return { title: 'Draw', tone: 'draw' }
  return null
}

export default function ChessApp() {
  const { platform } = useApp()
  const [initial] = useState(restore)
  const game = initial.game
  const [version, setVersion] = useState(0)
  const [player, setPlayer] = useState<Color>(initial.saved.player)
  const [difficulty, setDifficulty] = useState<Difficulty>(initial.saved.difficulty)
  const [flipped, setFlipped] = useState(initial.saved.flipped)
  const [selected, setSelected] = useState<Square | null>(null)
  const [thinking, setThinking] = useState(false)
  const [hint, setHint] = useState<{ from: Square; to: Square } | null>(null)
  const [hintLoading, setHintLoading] = useState(false)
  const [promo, setPromo] = useState<{ from: Square; to: Square } | null>(null)
  const [cursor, setCursor] = useState<Square>(initial.saved.player === 'w' ? 'e2' : 'e7')
  const [menuOpen, setMenuOpen] = useState(false)
  const [dragFrom, setDragFrom] = useState<Square | null>(null)
  const [announce, setAnnounce] = useState('')
  const engineRef = useRef<EngineClient | null>(null)
  const boardRef = useRef<HTMLDivElement>(null)
  const ghostRef = useRef<HTMLDivElement>(null)
  const movesRef = useRef<HTMLOListElement>(null)
  const drag = useRef<{ from: Square; x: number; y: number; id: number; moved: boolean } | null>(null)

  useEffect(() => {
    const engine = new EngineClient()
    engineRef.current = engine
    return () => {
      engine.dispose()
      engineRef.current = null
    }
  }, [])

  // Everything derived from the current position (recomputed per move).
  const info = useMemo(() => {
    void version
    const history = game.history({ verbose: true })
    const board = game.board()
    const counts = { w: { p: 0, n: 0, b: 0, r: 0, q: 0, k: 0 }, b: { p: 0, n: 0, b: 0, r: 0, q: 0, k: 0 } }
    let kingSq: Square | null = null
    for (const row of board)
      for (const p of row) {
        if (!p) continue
        counts[p.color][p.type]++
        if (p.type === 'k' && p.color === game.turn()) kingSq = p.square
      }
    const material = (c: Color) => (Object.keys(VALUES) as PieceSymbol[]).reduce((sum, t) => sum + VALUES[t] * counts[c][t], 0)
    const lost = (c: Color) => CAPTURE_ORDER.flatMap((t) => Array<PieceSymbol>(Math.max(0, START_COUNT[t] - counts[c][t])).fill(t))
    return {
      history,
      board,
      last: history[history.length - 1],
      turn: game.turn(),
      check: game.inCheck(),
      kingSq,
      over: game.isGameOver(),
      result: resultOf(game, player),
      lost: { w: lost('w'), b: lost('b') },
      diff: material('w') - material('b'),
      moveNumber: game.moveNumber(),
    }
  }, [game, version, player])

  const canMove = !info.over && info.turn === player && !thinking && !promo
  const orientation: Color = flipped ? other(player) : player

  const squares = useMemo(() => {
    const list: { sq: Square; row: number; col: number; dark: boolean }[] = []
    for (let row = 0; row < 8; row++)
      for (let col = 0; col < 8; col++) {
        const file = orientation === 'w' ? col : 7 - col
        const rank = orientation === 'w' ? 8 - row : row + 1
        list.push({ sq: `${FILES[file]}${rank}` as Square, row, col, dark: (file + rank) % 2 === 1 })
      }
    return list
  }, [orientation])

  const targets = useMemo(() => {
    void version
    const map = new Map<Square, boolean>()
    if (!selected) return map
    for (const m of game.moves({ square: selected, verbose: true })) map.set(m.to, m.isCapture())
    return map
  }, [game, selected, version])

  // Persist the game.
  useEffect(() => {
    const moves = info.history.map((m) => ({ from: m.from, to: m.to, ...(m.promotion ? { promotion: m.promotion } : {}) }))
    writeJSON(STORE_KEY, { moves, player, difficulty, flipped } satisfies Saved)
  }, [info, player, difficulty, flipped])

  const commit = useCallback(
    (m: { from: string; to: string; promotion?: string }, by: 'you' | 'computer') => {
      let move
      try {
        move = game.move(m)
      } catch {
        return false
      }
      if (game.isGameOver()) playSound('chess-end')
      else if (game.inCheck()) playSound('chess-check')
      else playSound(move.captured ? 'chess-capture' : 'chess-move')
      setSelected(null)
      setHint(null)
      setPromo(null)
      setAnnounce(`${by === 'you' ? 'You' : 'Computer'} played ${move.san}`)
      setVersion((v) => v + 1)
      return true
    },
    [game],
  )

  // Computer's turn.
  useEffect(() => {
    if (info.over || info.turn === player || promo) return
    const engine = engineRef.current
    if (!engine) return
    let cancelled = false
    const fen = game.fen()
    const started = performance.now()
    setThinking(true)
    void engine.search({ fen, level: difficulty, history: info.history.map((h) => h.before) }).then((res) => {
      const wait = Math.max(0, MIN_THINK[difficulty] - (performance.now() - started))
      window.setTimeout(() => {
        if (cancelled || game.fen() !== fen) return
        setThinking(false)
        if (res) commit(res, 'computer')
      }, wait)
    })
    return () => {
      cancelled = true
      engine.cancel()
      setThinking(false)
    }
  }, [game, info, player, difficulty, promo, commit])

  // Dynamic Island live activity while a game is in progress.
  useEffect(() => {
    const island = useIsland.getState()
    if (!info.history.length || info.over) {
      if (island.activities.game?.title === 'Chess') island.clearActivity('game')
      return
    }
    island.setActivity({
      id: 'game',
      kind: 'game',
      priority: 20,
      title: 'Chess',
      value: thinking ? 'Thinking…' : info.turn === player && info.check ? 'Check!' : info.turn === player ? 'Your move' : 'Thinking…',
      detail: `${DIFF_LABEL[difficulty]} · Move ${info.moveNumber}`,
      icon: 'chess',
    })
  }, [info, thinking, player, difficulty])
  useEffect(
    () => () => {
      const island = useIsland.getState()
      if (island.activities.game?.title === 'Chess') island.clearActivity('game')
    },
    [],
  )

  // Keep the latest move visible in the move list.
  useEffect(() => {
    const el = movesRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [info])

  const tryMove = useCallback(
    (from: Square, to: Square) => {
      const legal = game.moves({ square: from, verbose: true }).filter((m) => m.to === to)
      if (!legal.length) return false
      if (legal.some((m) => m.promotion)) {
        setPromo({ from, to })
        setSelected(null)
        return true
      }
      return commit({ from, to }, 'you')
    },
    [game, commit],
  )

  const clickSquare = (sq: Square) => {
    setCursor(sq)
    if (promo) return
    if (selected) {
      if (sq === selected) {
        setSelected(null)
        return
      }
      if (targets.has(sq) && canMove && tryMove(selected, sq)) return
    }
    const piece = game.get(sq)
    setSelected(piece && piece.color === player && canMove ? sq : null)
  }

  const squareAt = (x: number, y: number): Square | null => {
    const el = boardRef.current
    if (!el) return null
    const r = el.getBoundingClientRect()
    const col = Math.floor(((x - r.left) / r.width) * 8)
    const row = Math.floor(((y - r.top) / r.height) * 8)
    if (col < 0 || col > 7 || row < 0 || row > 7) return null
    return squares[row * 8 + col].sq
  }

  const placeGhost = (x: number, y: number) => {
    const board = boardRef.current
    const ghost = ghostRef.current
    if (!board || !ghost) return
    const r = board.getBoundingClientRect()
    const size = r.width / 8
    ghost.style.transform = `translate(${x - r.left - size / 2}px, ${y - r.top - size / 2}px)`
  }

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 || (e.target as HTMLElement).closest('.chess-promo')) return
    const sq = squareAt(e.clientX, e.clientY)
    if (!sq) return
    const piece = game.get(sq)
    if (canMove && piece && piece.color === player) {
      drag.current = { from: sq, x: e.clientX, y: e.clientY, id: e.pointerId, moved: false }
      e.currentTarget.setPointerCapture(e.pointerId)
    } else drag.current = null
  }

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const d = drag.current
    if (!d || d.id !== e.pointerId) return
    if (!d.moved && Math.hypot(e.clientX - d.x, e.clientY - d.y) > 5) {
      d.moved = true
      setSelected(d.from)
      setDragFrom(d.from)
    }
    if (d.moved) placeGhost(e.clientX, e.clientY)
  }

  const onPointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('.chess-promo')) return
    const sq = squareAt(e.clientX, e.clientY)
    const d = drag.current
    drag.current = null
    if (d?.moved) {
      setDragFrom(null)
      setCursor(d.from)
      if (sq && sq !== d.from && tryMove(d.from, sq)) return
      setSelected(d.from)
      return
    }
    if (sq) clickSquare(sq)
  }

  const onPointerCancel = () => {
    drag.current = null
    setDragFrom(null)
  }

  const onBoardKey = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    const idx = squares.findIndex((s) => s.sq === cursor)
    const row = Math.floor(idx / 8)
    const col = idx % 8
    const moveCursor = (r: number, c: number) => {
      e.preventDefault()
      setCursor(squares[Math.min(7, Math.max(0, r)) * 8 + Math.min(7, Math.max(0, c))].sq)
    }
    switch (e.key) {
      case 'ArrowUp':
        return moveCursor(row - 1, col)
      case 'ArrowDown':
        return moveCursor(row + 1, col)
      case 'ArrowLeft':
        return moveCursor(row, col - 1)
      case 'ArrowRight':
        return moveCursor(row, col + 1)
      case 'Enter':
      case ' ':
        e.preventDefault()
        clickSquare(cursor)
        return
      case 'Escape':
        setSelected(null)
        setPromo(null)
        return
    }
  }

  const newGame = (side: Color | 'random') => {
    const color: Color = side === 'random' ? (Math.random() < 0.5 ? 'w' : 'b') : side
    engineRef.current?.cancel()
    game.reset()
    setPlayer(color)
    setFlipped(false)
    setSelected(null)
    setHint(null)
    setPromo(null)
    setThinking(false)
    setMenuOpen(false)
    setCursor(color === 'w' ? 'e2' : 'e7')
    setAnnounce(`New game. You play ${color === 'w' ? 'White' : 'Black'}.`)
    setVersion((v) => v + 1)
  }

  const canUndo = info.history.some((m) => m.color === player)
  const undo = () => {
    if (!canUndo) return
    engineRef.current?.cancel()
    do {
      if (!game.undo()) break
    } while (game.turn() !== player)
    setSelected(null)
    setHint(null)
    setPromo(null)
    setThinking(false)
    setAnnounce('Move taken back')
    setVersion((v) => v + 1)
  }

  const askHint = async () => {
    const engine = engineRef.current
    if (!canMove || !engine || hintLoading) return
    const fen = game.fen()
    setHintLoading(true)
    const res = await engine.search({ fen, level: 'hint', history: info.history.map((h) => h.before) })
    setHintLoading(false)
    if (res && game.fen() === fen) {
      setHint({ from: res.from as Square, to: res.to as Square })
      setAnnounce(`Hint: ${res.from} to ${res.to}`)
    }
  }

  // Close the New Game menu on outside click / Escape.
  useEffect(() => {
    if (!menuOpen) return
    const close = (e: Event) => {
      if (e instanceof KeyboardEvent && e.key !== 'Escape') return
      if (e instanceof PointerEvent && (e.target as HTMLElement).closest('.chess-newgame')) return
      setMenuOpen(false)
    }
    window.addEventListener('pointerdown', close, true)
    window.addEventListener('keydown', close)
    return () => {
      window.removeEventListener('pointerdown', close, true)
      window.removeEventListener('keydown', close)
    }
  }, [menuOpen])

  const status = info.result
    ? info.result.title
    : promo
      ? 'Choose a piece to promote to'
      : thinking
        ? 'Computer is thinking…'
        : info.turn === player
          ? info.check
            ? 'Check! Your move'
            : 'Your move'
          : 'Computer to move'

  const pos = (sq: Square) => {
    const i = squares.findIndex((s) => s.sq === sq)
    return { row: Math.floor(i / 8), col: i % 8 }
  }

  const promoCol = promo ? pos(promo.to) : null
  const hintFrom = hint ? pos(hint.from) : null
  const hintTo = hint ? pos(hint.to) : null
  const opp = other(player)
  const advantage = (c: Color) => {
    const d = c === 'w' ? info.diff : -info.diff
    return d > 0 ? `+${d}` : ''
  }

  const playerRow = (c: Color) => (
    <div className={`chess-player${info.turn === c && !info.over ? ' is-turn' : ''}`}>
      <span className="chess-player__avatar" aria-hidden="true">
        {c === player ? <User size={15} /> : <Cpu size={15} />}
      </span>
      <span className="chess-player__name">{c === player ? 'You' : `Computer · ${DIFF_LABEL[difficulty]}`}</span>
      <span className="chess-captured" aria-label={`${c === player ? 'You have' : 'Computer has'} captured ${info.lost[other(c)].length} pieces`}>
        {info.lost[other(c)].map((t, i) => (
          <PieceSvg key={i} color={other(c)} type={t} className="chess-captured__piece" />
        ))}
        {advantage(c) && <span className="chess-captured__adv">{advantage(c)}</span>}
      </span>
    </div>
  )

  const board = (
    <div className="chess-board-wrap">
      <div
        ref={boardRef}
        className={`chess-board${dragFrom ? ' is-dragging' : ''}${canMove ? ' can-move' : ''}`}
        role="application"
        aria-label={`Chess board. ${status}. Use arrow keys to move the cursor and Enter to pick up or drop a piece.`}
        aria-describedby="chess-status"
        tabIndex={0}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
        onKeyDown={onBoardKey}
      >
        {squares.map(({ sq, row, col, dark }) => {
          const piece = info.board[8 - Number(sq[1])][FILES.indexOf(sq[0])]
          const isLast = info.last && (info.last.from === sq || info.last.to === sq)
          const isCheck = info.check && info.kingSq === sq
          const target = targets.get(sq)
          const cls = [
            'chess-sq',
            dark ? 'is-dark' : 'is-light',
            isLast && 'is-last',
            selected === sq && 'is-selected',
            isCheck && 'is-check',
            cursor === sq && 'is-cursor',
            hint && (hint.from === sq || hint.to === sq) && 'is-hint',
          ]
            .filter(Boolean)
            .join(' ')
          return (
            <div key={sq} className={cls} aria-label={`${sq}${piece ? `, ${pieceName(piece.color, piece.type)}` : ''}`}>
              {col === 0 && <span className="chess-coord chess-coord--rank">{sq[1]}</span>}
              {row === 7 && <span className="chess-coord chess-coord--file">{sq[0]}</span>}
              {piece && <PieceSvg color={piece.color} type={piece.type} className={`chess-piece${dragFrom === sq ? ' is-lifted' : ''}`} />}
              {target !== undefined && <span className={target ? 'chess-target chess-target--capture' : 'chess-target'} />}
            </div>
          )
        })}

        {hintFrom && hintTo && (
          <svg className="chess-arrow" viewBox="0 0 8 8" aria-hidden="true">
            <defs>
              <marker id="chess-arrowhead" markerWidth="4" markerHeight="4" refX="2.2" refY="2" orient="auto">
                <path d="M0 0L4 2L0 4Z" fill="currentColor" />
              </marker>
            </defs>
            <line
              x1={hintFrom.col + 0.5}
              y1={hintFrom.row + 0.5}
              x2={hintTo.col + 0.5 - (hintTo.col - hintFrom.col) * 0.12}
              y2={hintTo.row + 0.5 - (hintTo.row - hintFrom.row) * 0.12}
              stroke="currentColor"
              strokeWidth="0.16"
              strokeLinecap="round"
              markerEnd="url(#chess-arrowhead)"
            />
          </svg>
        )}

        <div ref={ghostRef} className={`chess-ghost${dragFrom ? ' is-active' : ''}`} aria-hidden="true">
          {dragFrom && (() => {
            const p = game.get(dragFrom)
            return p ? <PieceSvg color={p.color} type={p.type} /> : null
          })()}
        </div>

        {promo && promoCol && (
          <>
            <div className="chess-promo-scrim" onPointerDown={() => setPromo(null)} />
            <div
              className={`chess-promo${promoCol.row === 0 ? '' : ' is-up'}`}
              style={{ left: `${promoCol.col * 12.5}%` }}
              role="menu"
              aria-label="Promote pawn to"
            >
              {PROMOTIONS.map((t) => (
                <button
                  key={t}
                  type="button"
                  role="menuitem"
                  className="chess-promo__btn"
                  aria-label={pieceName(player, t)}
                  onClick={() => commit({ from: promo.from, to: promo.to, promotion: t }, 'you')}
                >
                  <PieceSvg color={player} type={t} />
                </button>
              ))}
            </div>
          </>
        )}

        {info.result && (
          <div className={`chess-result chess-result--${info.result.tone}`}>
            <strong>{info.result.title}</strong>
            <button type="button" className="btn btn--primary" onClick={() => newGame(player)}>
              Play again
            </button>
          </div>
        )}
      </div>
    </div>
  )

  const controls = (
    <div className="chess-controls">
      <div className="chess-newgame">
        <button type="button" className="chess-ctl" aria-haspopup="menu" aria-expanded={menuOpen} onClick={() => setMenuOpen((o) => !o)}>
          <Plus size={16} />
          <span>New</span>
        </button>
        {menuOpen && (
          <div className="chess-menu" role="menu">
            <button type="button" role="menuitem" onClick={() => newGame('w')}>
              Play as White
            </button>
            <button type="button" role="menuitem" onClick={() => newGame('b')}>
              Play as Black
            </button>
            <button type="button" role="menuitem" onClick={() => newGame('random')}>
              Random side
            </button>
          </div>
        )}
      </div>
      <button type="button" className="chess-ctl" onClick={undo} disabled={!canUndo}>
        <RotateCcw size={16} />
        <span>Undo</span>
      </button>
      <button type="button" className="chess-ctl" onClick={askHint} disabled={!canMove || hintLoading}>
        <Lightbulb size={16} />
        <span>{hintLoading ? '…' : 'Hint'}</span>
      </button>
      <button type="button" className="chess-ctl" onClick={() => setFlipped((f) => !f)} aria-pressed={flipped}>
        <ArrowUpDown size={16} />
        <span>Flip</span>
      </button>
    </div>
  )

  const levels = (
    <div className="chess-levels" role="radiogroup" aria-label="Difficulty">
      {DIFFICULTIES.map((d) => (
        <button key={d} type="button" role="radio" aria-checked={difficulty === d} className={difficulty === d ? 'is-on' : ''} onClick={() => setDifficulty(d)}>
          {DIFF_LABEL[d]}
        </button>
      ))}
    </div>
  )

  const pairs: { n: number; w?: string; b?: string }[] = []
  info.history.forEach((m, i) => {
    const n = Math.floor(i / 2)
    if (!pairs[n]) pairs[n] = { n: n + 1 }
    pairs[n][m.color] = m.san
  })
  const moveList = (
    <ol ref={movesRef} className="chess-moves scroll" aria-label="Moves">
      {pairs.length === 0 && <li className="chess-moves__empty">{player === 'w' ? 'You play White. Make the first move.' : 'You play Black.'}</li>}
      {pairs.map((p, i) => (
        <li key={p.n}>
          <span className="chess-moves__n">{p.n}.</span>
          <span className={i === pairs.length - 1 && !p.b ? 'is-latest' : ''}>{p.w ?? '…'}</span>
          <span className={i === pairs.length - 1 && p.b ? 'is-latest' : ''}>{p.b ?? ''}</span>
        </li>
      ))}
    </ol>
  )

  const statusLine = (
    <p id="chess-status" className={`chess-status${info.check && !info.over ? ' is-check' : ''}${thinking ? ' is-thinking' : ''}`} aria-live="polite">
      {thinking && <span className="chess-dots" aria-hidden="true" />}
      {status}
    </p>
  )

  return (
    <div className={`chess chess--${platform}`}>
      <span className="sr-only" aria-live="polite">
        {announce}
      </span>
      {platform === 'mac' ? (
        <>
          <div className="chess-main">
            {playerRow(orientation === player ? opp : player)}
            {board}
            {playerRow(orientation === player ? player : opp)}
          </div>
          <aside className="chess-side">
            {levels}
            {statusLine}
            {moveList}
            {controls}
          </aside>
        </>
      ) : (
        <>
          <header className="chess-header">
            <h1>Chess</h1>
            {levels}
          </header>
          {playerRow(orientation === player ? opp : player)}
          {board}
          {playerRow(orientation === player ? player : opp)}
          {statusLine}
          {controls}
          {moveList}
        </>
      )}
    </div>
  )
}
