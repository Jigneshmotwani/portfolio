import { COLS, HIDDEN_ROWS, ROWS, SHAPES, VISIBLE_ROWS, cellsOf, type PieceType, type TetrisGame } from './logic'

export const PIECE_COLORS: Record<PieceType, { base: string; light: string; dark: string }> = {
  I: { base: '#2EC4F1', light: '#8BE6FF', dark: '#1689B3' },
  O: { base: '#FFCF33', light: '#FFE98F', dark: '#C99A08' },
  T: { base: '#B15CFF', light: '#D9A8FF', dark: '#7A2FCC' },
  S: { base: '#38D980', light: '#9AF2C0', dark: '#1F9A55' },
  Z: { base: '#FF5468', light: '#FF9EAA', dark: '#C42640' },
  J: { base: '#3D7BFF', light: '#94B6FF', dark: '#2150C2' },
  L: { base: '#FF9A2E', light: '#FFC88A', dark: '#C96A0A' },
}

const BG = '#0b0e22'
const GRID = 'rgba(255,255,255,0.05)'

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

/** One glossy block at pixel position (px, py). */
export function drawBlock(ctx: CanvasRenderingContext2D, px: number, py: number, size: number, type: PieceType, alpha = 1) {
  const c = PIECE_COLORS[type]
  const inset = Math.max(1, size * 0.04)
  const s = size - inset * 2
  const r = Math.max(2, size * 0.16)
  const x = px + inset
  const y = py + inset
  ctx.save()
  ctx.globalAlpha = alpha
  const g = ctx.createLinearGradient(x, y, x + s, y + s)
  g.addColorStop(0, c.light)
  g.addColorStop(0.45, c.base)
  g.addColorStop(1, c.dark)
  roundRect(ctx, x, y, s, s, r)
  ctx.fillStyle = g
  ctx.fill()
  // glossy top sheen
  const sheen = ctx.createLinearGradient(x, y, x, y + s * 0.55)
  sheen.addColorStop(0, 'rgba(255,255,255,0.55)')
  sheen.addColorStop(1, 'rgba(255,255,255,0)')
  roundRect(ctx, x + s * 0.1, y + s * 0.07, s * 0.8, s * 0.42, r * 0.7)
  ctx.fillStyle = sheen
  ctx.fill()
  // edge
  roundRect(ctx, x + 0.5, y + 0.5, s - 1, s - 1, r)
  ctx.strokeStyle = 'rgba(0,0,0,0.28)'
  ctx.lineWidth = 1
  ctx.stroke()
  ctx.restore()
}

function drawGhostBlock(ctx: CanvasRenderingContext2D, px: number, py: number, size: number, type: PieceType) {
  const c = PIECE_COLORS[type]
  const inset = Math.max(1.5, size * 0.08)
  const s = size - inset * 2
  const r = Math.max(2, size * 0.16)
  ctx.save()
  roundRect(ctx, px + inset, py + inset, s, s, r)
  ctx.fillStyle = c.base
  ctx.globalAlpha = 0.14
  ctx.fill()
  ctx.globalAlpha = 0.65
  ctx.strokeStyle = c.light
  ctx.lineWidth = Math.max(1, size * 0.06)
  ctx.stroke()
  ctx.restore()
}

/** Prepares a canvas for crisp HiDPI drawing at a CSS size; returns its 2D context. */
export function setupCanvas(canvas: HTMLCanvasElement, cssW: number, cssH: number) {
  const dpr = Math.min(window.devicePixelRatio || 1, 3)
  const w = Math.round(cssW * dpr)
  const h = Math.round(cssH * dpr)
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w
    canvas.height = h
    canvas.style.width = `${cssW}px`
    canvas.style.height = `${cssH}px`
  }
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  return ctx
}

/** Draws the visible 10×20 field: grid, stack, ghost, active piece and line-clear flash. */
export function drawBoard(ctx: CanvasRenderingContext2D, game: TetrisGame, cell: number, now: number) {
  const W = COLS * cell
  const H = VISIBLE_ROWS * cell
  ctx.clearRect(0, 0, W, H)
  ctx.fillStyle = BG
  ctx.fillRect(0, 0, W, H)

  // subtle vertical glow + grid
  const glow = ctx.createLinearGradient(0, 0, 0, H)
  glow.addColorStop(0, 'rgba(120,110,255,0.10)')
  glow.addColorStop(1, 'rgba(40,200,255,0.06)')
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, W, H)
  ctx.strokeStyle = GRID
  ctx.lineWidth = 1
  ctx.beginPath()
  for (let x = 1; x < COLS; x++) {
    ctx.moveTo(x * cell + 0.5, 0)
    ctx.lineTo(x * cell + 0.5, H)
  }
  for (let y = 1; y < VISIBLE_ROWS; y++) {
    ctx.moveTo(0, y * cell + 0.5)
    ctx.lineTo(W, y * cell + 0.5)
  }
  ctx.stroke()

  const clearing = game.clearing
  for (let y = HIDDEN_ROWS; y < ROWS; y++) {
    if (clearing?.rows.includes(y)) continue
    for (let x = 0; x < COLS; x++) {
      const t = game.board[y][x]
      if (t) drawBlock(ctx, x * cell, (y - HIDDEN_ROWS) * cell, cell, t, game.status === 'over' ? 0.45 : 1)
    }
  }

  // Rows being cleared: flash white and squeeze toward the centre.
  if (clearing) {
    const p = Math.min(1, clearing.elapsed / Math.max(1, game.clearDelay))
    for (const y of clearing.rows) {
      const py = (y - HIDDEN_ROWS) * cell
      for (let x = 0; x < COLS; x++) {
        const t = game.board[y][x]
        if (t) drawBlock(ctx, x * cell, py, cell, t, 1 - p)
      }
      const inset = (W / 2) * p
      ctx.fillStyle = `rgba(255,255,255,${0.85 * (1 - p * 0.6)})`
      ctx.fillRect(inset, py + cell * 0.1, W - inset * 2, cell * 0.8)
    }
  }

  if (game.active && game.status !== 'over') {
    const ghost = game.ghost()
    if (ghost && ghost.y !== game.active.y) {
      for (const [x, y] of cellsOf(ghost)) {
        if (y >= HIDDEN_ROWS) drawGhostBlock(ctx, x * cell, (y - HIDDEN_ROWS) * cell, cell, ghost.type)
      }
    }
    for (const [x, y] of cellsOf(game.active)) {
      if (y >= HIDDEN_ROWS) drawBlock(ctx, x * cell, (y - HIDDEN_ROWS) * cell, cell, game.active.type)
    }
  }

  // soft vignette at the top so spawning pieces fade in
  const top = ctx.createLinearGradient(0, 0, 0, cell * 1.2)
  top.addColorStop(0, 'rgba(11,14,34,0.55)')
  top.addColorStop(1, 'rgba(11,14,34,0)')
  ctx.fillStyle = top
  ctx.fillRect(0, 0, W, cell * 1.2)
  void now
}

/** Draws a single piece centred in a small preview canvas. */
export function drawPreview(ctx: CanvasRenderingContext2D, type: PieceType | null, w: number, h: number, dim = false) {
  ctx.clearRect(0, 0, w, h)
  if (!type) return
  const cells = SHAPES[type][0]
  const xs = cells.map(([x]) => x)
  const ys = cells.map(([, y]) => y)
  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const minY = Math.min(...ys)
  const maxY = Math.max(...ys)
  const cols = maxX - minX + 1
  const rows = maxY - minY + 1
  const size = Math.floor(Math.min(w / 4.4, h / 2.6))
  const ox = (w - cols * size) / 2
  const oy = (h - rows * size) / 2
  for (const [x, y] of cells) drawBlock(ctx, ox + (x - minX) * size, oy + (y - minY) * size, size, type, dim ? 0.4 : 1)
}
