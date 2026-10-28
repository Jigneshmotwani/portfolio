import { ArrowDownToLine, ChevronDown, ChevronLeft, ChevronRight, Pause, Play, RotateCcw, RotateCw } from 'lucide-react'
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react'
import { AppIcon } from '../../components/shared/AppIcon'
import { useMediaQuery } from '../../lib/hooks'
import { playSound } from '../../lib/sound'
import { readJSON, writeJSON } from '../../lib/storage'
import { useReducedMotion } from '../../lib/theme'
import { useIsland } from '../../state/island'
import { useNotifications } from '../../state/notifications'
import { apps } from '../registry'
import { useApp } from '../types'
import { COLS, LINE_CLEAR_DELAY, TetrisGame, VISIBLE_ROWS, type GameStatus, type PieceType } from './logic'
import { drawBoard, drawPreview, setupCanvas } from './render'
import './Tetris.css'

/** Delayed auto shift / auto repeat rate for held left/right, and soft-drop repeat. */
const DAS = 170
const ARR = 50
const SOFT_MS = 40
const BEST_KEY = 'jos.tetris.best'

type Action = 'left' | 'right' | 'down' | 'drop' | 'cw' | 'ccw' | 'hold' | 'pause'

interface Hud {
  status: GameStatus
  score: number
  level: number
  lines: number
  hold: PieceType | null
  holdUsed: boolean
  next: PieceType[]
}

function snapshot(g: TetrisGame): Hud {
  return { status: g.status, score: g.score, level: g.level, lines: g.lines, hold: g.hold, holdUsed: g.holdUsed, next: g.next }
}

function sameHud(a: Hud, b: Hud) {
  return (
    a.status === b.status &&
    a.score === b.score &&
    a.level === b.level &&
    a.lines === b.lines &&
    a.hold === b.hold &&
    a.holdUsed === b.holdUsed &&
    a.next.join() === b.next.join()
  )
}

const fmt = (n: number) => n.toLocaleString('en-US')

function keyAction(e: KeyboardEvent): Action | 'enter' | null {
  switch (e.key) {
    case 'ArrowLeft':
      return 'left'
    case 'ArrowRight':
      return 'right'
    case 'ArrowDown':
      return 'down'
    case ' ':
    case 'Spacebar':
      return 'drop'
    case 'ArrowUp':
    case 'x':
    case 'X':
      return 'cw'
    case 'z':
    case 'Z':
      return 'ccw'
    case 'c':
    case 'C':
    case 'Shift':
      return 'hold'
    case 'p':
    case 'P':
    case 'Escape':
      return 'pause'
    case 'Enter':
      return 'enter'
    default:
      return null
  }
}

function isTyping(target: EventTarget | null) {
  const el = target as HTMLElement | null
  return !!el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)
}

export default function Tetris() {
  const { platform, active } = useApp()
  const reduceMotion = useReducedMotion()
  const coarse = useMediaQuery('(pointer: coarse)')
  const showPad = platform === 'ios' || coarse
  const name = apps.tetris.name

  const gameRef = useRef<TetrisGame | null>(null)
  if (!gameRef.current) gameRef.current = new TetrisGame({ clearDelay: reduceMotion ? 0 : LINE_CLEAR_DELAY })
  const game = gameRef.current

  const [hud, setHud] = useState<Hud>(() => snapshot(game))
  const hudRef = useRef(hud)
  const [best, setBest] = useState(() => readJSON<number>(BEST_KEY, 0))
  const bestRef = useRef(best)
  const [newBest, setNewBest] = useState(false)
  const [cell, setCell] = useState(24)
  const cellRef = useRef(cell)
  cellRef.current = cell

  const stageRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const dirty = useRef(true)
  const input = useRef<{ h: { dir: -1 | 1; since: number; last: number } | null; down: boolean; downLast: number }>({
    h: null,
    down: false,
    downLast: 0,
  })

  useEffect(() => {
    game.clearDelay = reduceMotion ? 0 : LINE_CLEAR_DELAY
  }, [game, reduceMotion])

  // Fit the 10×20 well into the available space.
  useLayoutEffect(() => {
    const el = stageRef.current
    if (!el) return
    const fit = () => {
      const { width, height } = el.getBoundingClientRect()
      const next = Math.max(8, Math.floor(Math.min((height - 14) / VISIBLE_ROWS, (width - 14) / COLS)))
      if (next !== cellRef.current) {
        cellRef.current = next
        setCell(next)
      }
      dirty.current = true
    }
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(el)
    return () => ro.disconnect()
  }, [showPad, platform])

  // Sounds and end-of-game bookkeeping.
  useEffect(() => {
    let lastMoveSound = 0
    return game.on((e) => {
      dirty.current = true
      switch (e.type) {
        case 'move': {
          const now = performance.now()
          if (now - lastMoveSound > 45) playSound('tetris-move')
          lastMoveSound = now
          break
        }
        case 'rotate':
          playSound('tetris-rotate')
          break
        case 'hold':
          playSound('tetris-rotate')
          break
        case 'lock':
          playSound('tetris-drop')
          break
        case 'clear':
          playSound(e.lines >= 4 ? 'tetris-tetris' : 'tetris-clear')
          break
        case 'level':
          playSound('tetris-level')
          break
        case 'over': {
          playSound('tetris-over')
          const score = game.score
          if (score > bestRef.current) {
            const previous = bestRef.current
            bestRef.current = score
            writeJSON(BEST_KEY, score)
            setBest(score)
            setNewBest(true)
            if (previous > 0) {
              useNotifications.getState().push({
                appId: 'tetris',
                title: name,
                body: `New high score: ${fmt(score)} 🏆`,
                action: { appId: 'tetris' },
              })
            }
          }
          break
        }
      }
    })
  }, [game, name])

  // Main loop: input repeat, gravity, drawing, HUD sync.
  useEffect(() => {
    let raf = 0
    let last = performance.now()
    const loop = (now: number) => {
      const dt = Math.min(now - last, 100)
      last = now
      const inp = input.current
      if (game.status === 'playing') {
        if (inp.h && now - inp.h.since >= DAS && now - inp.h.last >= ARR) {
          game.move(inp.h.dir)
          inp.h.last = now
        }
        if (inp.down && now - inp.downLast >= SOFT_MS) {
          game.softDrop()
          inp.downLast = now
        }
        game.tick(dt)
        dirty.current = true
      }
      const canvas = canvasRef.current
      if (canvas && dirty.current) {
        const c = cellRef.current
        const ctx = setupCanvas(canvas, c * COLS, c * VISIBLE_ROWS)
        if (ctx) drawBoard(ctx, game, c, now)
        dirty.current = game.status === 'playing'
      }
      const snap = snapshot(game)
      if (!sameHud(snap, hudRef.current)) {
        hudRef.current = snap
        setHud(snap)
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [game])

  const start = useCallback(() => {
    input.current = { h: null, down: false, downLast: 0 }
    setNewBest(false)
    game.start()
    dirty.current = true
    playSound('tetris-level')
  }, [game])

  const togglePause = useCallback(() => {
    if (game.status === 'playing') game.pause()
    else if (game.status === 'paused') game.resume()
    input.current.h = null
    input.current.down = false
    dirty.current = true
  }, [game])

  const press = useCallback(
    (a: Action) => {
      if (game.status === 'ready' || game.status === 'over') {
        if (a === 'drop' || a === 'cw') start()
        return
      }
      if (a === 'pause') {
        togglePause()
        return
      }
      if (game.status !== 'playing') return
      const now = performance.now()
      switch (a) {
        case 'left':
        case 'right': {
          const dir = a === 'left' ? -1 : 1
          game.move(dir)
          input.current.h = { dir, since: now, last: now }
          break
        }
        case 'down':
          game.softDrop()
          input.current.down = true
          input.current.downLast = now
          break
        case 'drop':
          game.hardDrop()
          break
        case 'cw':
          game.rotate(1)
          break
        case 'ccw':
          game.rotate(-1)
          break
        case 'hold':
          game.holdPiece()
          break
      }
    },
    [game, start, togglePause],
  )

  const release = useCallback((a: Action) => {
    const inp = input.current
    if ((a === 'left' && inp.h?.dir === -1) || (a === 'right' && inp.h?.dir === 1)) inp.h = null
    if (a === 'down') inp.down = false
  }, [])

  // Keyboard, only while this window / app is in front.
  useEffect(() => {
    if (!active) return
    const onDown = (e: KeyboardEvent) => {
      if (isTyping(e.target) || e.metaKey || e.ctrlKey || e.altKey) return
      const a = keyAction(e)
      if (!a) return
      e.preventDefault()
      if (e.repeat) return
      if (a === 'enter') {
        if (game.status === 'ready' || game.status === 'over') start()
        else if (game.status === 'paused') togglePause()
        return
      }
      if (game.status === 'paused' && (a === 'drop' || a === 'pause')) {
        togglePause()
        return
      }
      press(a)
    }
    const onUp = (e: KeyboardEvent) => {
      const a = keyAction(e)
      if (a && a !== 'enter') release(a)
    }
    window.addEventListener('keydown', onDown)
    window.addEventListener('keyup', onUp)
    return () => {
      window.removeEventListener('keydown', onDown)
      window.removeEventListener('keyup', onUp)
    }
  }, [active, game, press, release, start, togglePause])

  // Pause automatically when the window loses focus or the tab is hidden.
  useEffect(() => {
    if (!active) {
      game.pause()
      input.current.h = null
      input.current.down = false
    }
  }, [active, game])
  useEffect(() => {
    const onVis = () => document.hidden && game.pause()
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [game])

  // Dynamic Island live activity while a game is in progress.
  const setActivity = useIsland((s) => s.setActivity)
  const clearActivity = useIsland((s) => s.clearActivity)
  const ownsActivity = useRef(false)
  useEffect(() => {
    if (hud.status === 'playing' || hud.status === 'paused') {
      ownsActivity.current = true
      setActivity({
        id: 'game',
        kind: 'game',
        priority: 20,
        title: name,
        value: fmt(hud.score),
        detail: hud.status === 'paused' ? 'Paused' : `Level ${hud.level} · ${hud.lines} lines`,
        icon: 'tetris',
        color: '#B15CFF',
      })
    } else if (ownsActivity.current) {
      ownsActivity.current = false
      clearActivity('game')
    }
  }, [hud.status, hud.score, hud.level, hud.lines, name, setActivity, clearActivity])
  useEffect(
    () => () => {
      if (ownsActivity.current) useIsland.getState().clearActivity('game')
    },
    [],
  )

  // Touch gestures on the well: tap rotate, horizontal drag moves, drag down soft drops, flick down hard drops.
  const gesture = useRef<{ x: number; y: number; stepX: number; stepY: number; t: number; moved: boolean } | null>(null)
  const onPointerDown = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (e.pointerType === 'mouse') {
      if (game.status === 'ready' || game.status === 'over') start()
      return
    }
    e.currentTarget.setPointerCapture(e.pointerId)
    gesture.current = { x: e.clientX, y: e.clientY, stepX: e.clientX, stepY: e.clientY, t: performance.now(), moved: false }
  }
  const onPointerMove = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    const g = gesture.current
    if (!g || game.status !== 'playing') return
    const c = cellRef.current
    let dx = e.clientX - g.stepX
    while (Math.abs(dx) >= c) {
      const dir = dx > 0 ? 1 : -1
      game.move(dir)
      g.stepX += dir * c
      dx = e.clientX - g.stepX
      g.moved = true
    }
    if (e.clientY - g.stepY >= c && Math.abs(e.clientY - g.y) > Math.abs(e.clientX - g.x)) {
      game.softDrop()
      g.stepY += c
      g.moved = true
    }
  }
  const onPointerUp = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    const g = gesture.current
    gesture.current = null
    if (!g) return
    if (game.status === 'ready' || game.status === 'over') {
      start()
      return
    }
    if (game.status === 'paused') {
      togglePause()
      return
    }
    const dt = performance.now() - g.t
    const dy = e.clientY - g.y
    const dx = e.clientX - g.x
    if (dy > 60 && dy / Math.max(dt, 1) > 0.9 && Math.abs(dy) > Math.abs(dx) * 1.5) {
      game.hardDrop()
    } else if (!g.moved && dt < 300 && Math.hypot(dx, dy) < 12) {
      game.rotate(1)
    }
  }

  const boardW = cell * COLS
  const boardH = cell * VISIBLE_ROWS
  const isIOS = platform === 'ios'

  const stats = (
    <>
      <Stat label="Score" value={fmt(hud.score)} big />
      <Stat label="Level" value={String(hud.level)} />
      <Stat label="Lines" value={String(hud.lines)} />
      <Stat label="Best" value={fmt(Math.max(best, hud.score))} />
    </>
  )

  const overlay = (
    <Overlay
      hud={hud}
      name={name}
      best={best}
      newBest={newBest}
      touch={showPad}
      onStart={start}
      onResume={togglePause}
    />
  )

  return (
    <div className={`tetris tetris--${platform}${showPad ? ' tetris--pad' : ''}`}>
      {isIOS ? (
        <div className="tetris-topbar">
          <div className="tetris-mini">
            <span className="tetris-label">Hold</span>
            <Mini type={hud.hold} dim={hud.holdUsed} w={56} h={34} />
          </div>
          <div className="tetris-topstats">
            <div className="tetris-topscore">{fmt(hud.score)}</div>
            <div className="tetris-topmeta">
              Lv {hud.level} · {hud.lines} lines · Best {fmt(Math.max(best, hud.score))}
            </div>
          </div>
          <div className="tetris-mini">
            <span className="tetris-label">Next</span>
            <Mini type={hud.next[0] ?? null} w={56} h={34} />
          </div>
          <button
            className="tetris-iconbtn"
            onClick={() => (hud.status === 'ready' || hud.status === 'over' ? start() : togglePause())}
            aria-label={hud.status === 'playing' ? 'Pause' : 'Play'}
          >
            {hud.status === 'playing' ? <Pause size={18} /> : <Play size={18} />}
          </button>
        </div>
      ) : null}

      <div className="tetris-main">
        <div className="tetris-stage" ref={stageRef}>
          <div className="tetris-well" style={{ width: boardW + 12, height: boardH + 12 }}>
            <canvas
              ref={canvasRef}
              className="tetris-canvas"
              style={{ width: boardW, height: boardH }}
              role="img"
              aria-label={`${name} board. Score ${hud.score}, level ${hud.level}, ${hud.lines} lines.`}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={() => (gesture.current = null)}
            />
            {overlay}
          </div>
        </div>

        {!isIOS && (
          <aside className="tetris-side" aria-label="Game info">
            <section className="tetris-card">
              <span className="tetris-label">Hold</span>
              <Mini type={hud.hold} dim={hud.holdUsed} w={104} h={56} />
            </section>
            <section className="tetris-card">
              <span className="tetris-label">Next</span>
              <Mini type={hud.next[0] ?? null} w={104} h={56} />
              <Mini type={hud.next[1] ?? null} w={104} h={40} />
              <Mini type={hud.next[2] ?? null} w={104} h={40} />
            </section>
            <section className="tetris-card tetris-stats">{stats}</section>
            <button
              className="btn tetris-pausebtn"
              onClick={() => (hud.status === 'ready' || hud.status === 'over' ? start() : togglePause())}
            >
              {hud.status === 'playing' ? (
                <>
                  <Pause size={14} /> Pause
                </>
              ) : (
                <>
                  <Play size={14} /> {hud.status === 'paused' ? 'Resume' : 'Play'}
                </>
              )}
            </button>
          </aside>
        )}
      </div>

      {showPad && <Pad press={press} release={release} holdDisabled={hud.holdUsed} />}
    </div>
  )
}

function Stat({ label, value, big }: { label: string; value: string; big?: boolean }) {
  return (
    <div className={`tetris-stat${big ? ' tetris-stat--big' : ''}`}>
      <span className="tetris-label">{label}</span>
      <span className="tetris-value">{value}</span>
    </div>
  )
}

function Mini({ type, dim = false, w, h }: { type: PieceType | null; dim?: boolean; w: number; h: number }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useLayoutEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = setupCanvas(canvas, w, h)
    if (ctx) drawPreview(ctx, type, w, h, dim)
  }, [type, dim, w, h])
  return <canvas ref={ref} className="tetris-minicanvas" style={{ width: w, height: h }} aria-label={type ? `${type} piece` : 'empty'} />
}

function Overlay({
  hud,
  name,
  best,
  newBest,
  touch,
  onStart,
  onResume,
}: {
  hud: Hud
  name: string
  best: number
  newBest: boolean
  touch: boolean
  onStart: () => void
  onResume: () => void
}) {
  if (hud.status === 'playing') return null
  let body: ReactNode
  if (hud.status === 'ready') {
    body = (
      <>
        <AppIcon id="tetris" size={56} />
        <h2 className="tetris-title">{name}</h2>
        {best > 0 && <p className="tetris-sub">Best {fmt(best)}</p>}
        <button className="btn btn--primary btn--lg" onClick={onStart} autoFocus={!touch}>
          <Play size={15} /> Play
        </button>
        <Help touch={touch} />
      </>
    )
  } else if (hud.status === 'paused') {
    body = (
      <>
        <h2 className="tetris-title">Paused</h2>
        <p className="tetris-sub">
          Score {fmt(hud.score)} · Level {hud.level}
        </p>
        <div className="tetris-row">
          <button className="btn btn--primary btn--lg" onClick={onResume}>
            <Play size={15} /> Resume
          </button>
          <button className="btn btn--lg" onClick={onStart}>
            Restart
          </button>
        </div>
      </>
    )
  } else {
    body = (
      <>
        <h2 className="tetris-title">Game Over</h2>
        <div className="tetris-final">{fmt(hud.score)}</div>
        <p className="tetris-sub">
          {newBest ? '🏆 New best score!' : `Best ${fmt(best)}`} · {hud.lines} lines
        </p>
        <button className="btn btn--primary btn--lg" onClick={onStart} autoFocus={!touch}>
          Play Again
        </button>
      </>
    )
  }
  return (
    <div className="tetris-overlay" role="dialog" aria-label={hud.status === 'over' ? 'Game over' : name}>
      <div className="tetris-panel">{body}</div>
    </div>
  )
}

function Help({ touch }: { touch: boolean }) {
  if (touch) {
    return (
      <ul className="tetris-help">
        <li>
          <b>Tap</b> rotate
        </li>
        <li>
          <b>Drag</b> move · soft drop
        </li>
        <li>
          <b>Flick down</b> hard drop
        </li>
      </ul>
    )
  }
  return (
    <ul className="tetris-help">
      <li>
        <kbd>←</kbd>
        <kbd>→</kbd> move
      </li>
      <li>
        <kbd>↑</kbd>
        <kbd>X</kbd> rotate · <kbd>Z</kbd> back
      </li>
      <li>
        <kbd>↓</kbd> soft · <kbd>Space</kbd> hard drop
      </li>
      <li>
        <kbd>C</kbd> hold · <kbd>P</kbd> pause
      </li>
    </ul>
  )
}

function Pad({ press, release, holdDisabled }: { press: (a: Action) => void; release: (a: Action) => void; holdDisabled: boolean }) {
  const btn = (a: Action, label: string, icon: ReactNode, cls = '') => (
    <button
      className={`tetris-padbtn ${cls}`}
      aria-label={label}
      onPointerDown={(e) => {
        e.preventDefault()
        e.currentTarget.setPointerCapture?.(e.pointerId)
        press(a)
      }}
      onPointerUp={() => release(a)}
      onPointerCancel={() => release(a)}
      onLostPointerCapture={() => release(a)}
      onContextMenu={(e) => e.preventDefault()}
    >
      {icon}
    </button>
  )
  return (
    <div className="tetris-pad" aria-label="Game controls">
      <div className="tetris-pad__dpad">
        {btn('left', 'Move left', <ChevronLeft size={28} />)}
        {btn('down', 'Soft drop', <ChevronDown size={28} />)}
        {btn('right', 'Move right', <ChevronRight size={28} />)}
      </div>
      <div className="tetris-pad__actions">
        {btn('hold', 'Hold piece', <span className="tetris-padtext">HOLD</span>, `tetris-padbtn--small${holdDisabled ? ' is-dim' : ''}`)}
        {btn('ccw', 'Rotate counter-clockwise', <RotateCcw size={22} />, 'tetris-padbtn--small')}
        {btn('drop', 'Hard drop', <ArrowDownToLine size={24} />)}
        {btn('cw', 'Rotate clockwise', <RotateCw size={28} />, 'tetris-padbtn--big')}
      </div>
    </div>
  )
}
