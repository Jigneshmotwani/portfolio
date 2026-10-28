import { useCallback, useEffect, useMemo, useState } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { apps } from '../../apps/registry'
import { MENUBAR_HEIGHT, useWindows, workArea, type WindowState } from '../../state/windows'
import { useSystem } from '../../state/system'
import { AppIcon } from '../shared/AppIcon'
import { Window, type MCTransform } from './Window'
import './MissionControl.css'

interface Tile extends MCTransform {
  id: string
  w: number
  h: number
}

/** Grid layout for Mission Control: choose the column count that keeps windows largest. */
function layoutTiles(wins: WindowState[], vw: number, vh: number): Tile[] {
  const n = wins.length
  if (!n) return []
  const pad = 64
  const top = MENUBAR_HEIGHT + 56
  const bottom = vh - 112
  const W = vw - pad * 2
  const H = bottom - top
  const gap = 36
  const label = 30
  const sorted = [...wins].sort((a, b) => a.y - b.y || a.x - b.x)
  let best = { cols: 1, rows: n, score: -1 }
  for (let cols = 1; cols <= n; cols++) {
    const rows = Math.ceil(n / cols)
    const cw = (W - gap * (cols - 1)) / cols
    const ch = (H - gap * (rows - 1)) / rows - label
    if (cw <= 0 || ch <= 0) continue
    const score = Math.min(...sorted.map((w) => Math.min(cw / w.w, ch / w.h, 0.85)))
    if (score > best.score) best = { cols, rows, score }
  }
  const { cols, rows } = best
  const cw = (W - gap * (cols - 1)) / cols
  const ch = (H - gap * (rows - 1)) / rows
  return sorted.map((w, i) => {
    const r = Math.floor(i / cols)
    const inRow = Math.min(cols, n - r * cols)
    const c = i % cols
    const rowOffset = ((cols - inRow) * (cw + gap)) / 2
    const s = Math.min(cw / w.w, (ch - label) / w.h, 0.85)
    const tw = w.w * s
    const th = w.h * s
    const x = pad + rowOffset + c * (cw + gap) + (cw - tw) / 2
    const y = top + r * (ch + gap) + (ch - label - th) / 2
    return { id: w.id, x, y, scale: s, w: tw, h: th }
  })
}

function useViewport() {
  const [vp, setVp] = useState(() => ({ w: window.innerWidth, h: window.innerHeight }))
  useEffect(() => {
    const on = () => setVp({ w: window.innerWidth, h: window.innerHeight })
    window.addEventListener('resize', on)
    return () => window.removeEventListener('resize', on)
  }, [])
  return vp
}

export function WindowLayer() {
  const ids = useWindows(useShallow((s) => s.windows.map((w) => w.id)))
  const mcOpen = useSystem((s) => s.missionControl)
  const vp = useViewport()

  // Keep zoomed windows filling the work area and every window reachable after a resize.
  useEffect(() => {
    const st = useWindows.getState()
    const area = workArea()
    for (const w of st.windows) {
      if (w.maximized) st.setBounds(w.id, { x: area.x, y: area.y, w: area.w, h: area.h })
      else {
        const x = Math.min(Math.max(w.x, -w.w + 120), vp.w - 120)
        const y = Math.min(Math.max(w.y, MENUBAR_HEIGHT), vp.h - 64)
        if (x !== w.x || y !== w.y) st.setBounds(w.id, { x, y })
      }
    }
  }, [vp.w, vp.h])

  const visibleKey = useWindows(
    useShallow((s) => s.windows.filter((w) => w.status === 'open' && !w.minimized).map((w) => w.id)),
  )

  const tiles = useMemo(() => {
    if (!mcOpen) return null
    const wins = useWindows.getState().windows.filter((w) => visibleKey.includes(w.id))
    return layoutTiles(wins, vp.w, vp.h)
  }, [mcOpen, visibleKey, vp.w, vp.h])

  const tileMap = useMemo(() => new Map((tiles ?? []).map((t) => [t.id, t])), [tiles])

  const select = useCallback((id: string) => {
    useWindows.getState().focus(id)
    useSystem.getState().toggleMissionControl(false)
  }, [])

  return (
    <>
      {mcOpen && <MissionControlBackdrop tiles={tiles ?? []} onSelect={select} />}
      <div className="mac-windows">
        {ids.map((id) => (
          <Window key={id} id={id} mc={tileMap.get(id) ?? null} onMcSelect={select} />
        ))}
      </div>
    </>
  )
}

function MissionControlBackdrop({ tiles, onSelect }: { tiles: Tile[]; onSelect: (id: string) => void }) {
  const windows = useWindows((s) => s.windows)
  return (
    <div
      className="mc"
      role="dialog"
      aria-label="Mission Control"
      onClick={() => useSystem.getState().toggleMissionControl(false)}
    >
      <div className="mc__bar">
        <div className="mc__space">Desktop</div>
      </div>
      {tiles.length === 0 && <div className="mc__empty">No open windows</div>}
      {tiles.map((t, i) => {
        const w = windows.find((x) => x.id === t.id)
        if (!w) return null
        return (
          <button
            key={t.id}
            className="mc__label"
            style={{ left: t.x, top: t.y + t.h + 10, width: t.w, animationDelay: `${120 + i * 20}ms` }}
            onClick={(e) => {
              e.stopPropagation()
              onSelect(t.id)
            }}
          >
            <AppIcon id={apps[w.appId].icon} size={20} />
            <span>{w.title}</span>
          </button>
        )
      })}
    </div>
  )
}
