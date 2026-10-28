import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react'
import type { MouseEvent as ReactMouseEvent, PointerEvent as ReactPointerEvent } from 'react'

export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (cb: () => void) => {
      const mql = window.matchMedia(query)
      mql.addEventListener('change', cb)
      return () => mql.removeEventListener('change', cb)
    },
    [query],
  )
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  )
}

/** Re-renders every `ms` milliseconds, aligned to the wall clock. */
export function useNow(ms = 1000): Date {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>
    const tick = () => {
      setNow(new Date())
      timer = setTimeout(tick, ms - (Date.now() % ms) + 5)
    }
    timer = setTimeout(tick, ms - (Date.now() % ms) + 5)
    return () => clearTimeout(timer)
  }, [ms])
  return now
}

export function useLatest<T>(value: T) {
  const ref = useRef(value)
  ref.current = value
  return ref
}

/** Calls `handler` on keydown anywhere (window listener). */
export function useKeydown(handler: (e: KeyboardEvent) => void, enabled = true) {
  const latest = useLatest(handler)
  useEffect(() => {
    if (!enabled) return
    const fn = (e: KeyboardEvent) => latest.current(e)
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [enabled, latest])
}

/** Pointer long-press detector. Returns props to spread on an element. */
export function useLongPress(onLongPress: (e: ReactPointerEvent) => void, { delay = 500, onClick }: { delay?: number; onClick?: (e: ReactPointerEvent) => void } = {}) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const fired = useRef(false)
  const start = useRef({ x: 0, y: 0 })
  const clear = () => {
    if (timer.current) clearTimeout(timer.current)
    timer.current = null
  }
  return {
    onPointerDown: (e: ReactPointerEvent) => {
      fired.current = false
      start.current = { x: e.clientX, y: e.clientY }
      clear()
      timer.current = setTimeout(() => {
        fired.current = true
        onLongPress(e)
      }, delay)
    },
    onPointerMove: (e: ReactPointerEvent) => {
      if (Math.hypot(e.clientX - start.current.x, e.clientY - start.current.y) > 10) clear()
    },
    onPointerUp: (e: ReactPointerEvent) => {
      clear()
      if (!fired.current) onClick?.(e)
    },
    onPointerCancel: clear,
    onPointerLeave: clear,
    onContextMenu: (e: ReactMouseEvent) => e.preventDefault(),
  }
}

export function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v))
}
