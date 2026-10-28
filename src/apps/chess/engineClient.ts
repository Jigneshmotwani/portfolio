import { search, type SearchRequest, type SearchResult } from './engine'

type Resolve = (r: SearchResult | null) => void

/**
 * Runs the engine in a Web Worker so the UI stays responsive. If workers are
 * unavailable (or the worker fails to load), it falls back to searching on
 * the main thread with a shorter time budget.
 */
export class EngineClient {
  private worker: Worker | null = null
  private seq = 0
  private pending = new Map<number, { req: SearchRequest; resolve: Resolve }>()

  constructor() {
    this.spawn()
  }

  private spawn() {
    try {
      const w = new Worker(new URL('./engine.worker.ts', import.meta.url), { type: 'module', name: 'chess-engine' })
      w.onmessage = (e: MessageEvent<{ id: number; result: SearchResult | null }>) => {
        const job = this.pending.get(e.data.id)
        this.pending.delete(e.data.id)
        job?.resolve(e.data.result)
      }
      w.onerror = (e) => {
        e.preventDefault()
        console.warn('[chess] worker failed, searching on the main thread instead')
        this.worker?.terminate()
        this.worker = null
        const jobs = [...this.pending.values()]
        this.pending.clear()
        for (const job of jobs) this.runLocal(job.req, job.resolve)
      }
      this.worker = w
    } catch {
      this.worker = null
    }
  }

  private runLocal(req: SearchRequest, resolve: Resolve) {
    // Yield first so React can paint "Thinking…".
    setTimeout(() => {
      try {
        resolve(search(req, { timeMs: req.level === 'easy' ? 200 : 650 }))
      } catch {
        resolve(null)
      }
    }, 30)
  }

  search(req: SearchRequest): Promise<SearchResult | null> {
    return new Promise((resolve) => {
      if (!this.worker) {
        this.runLocal(req, resolve)
        return
      }
      const id = ++this.seq
      this.pending.set(id, { req, resolve })
      this.worker.postMessage({ id, ...req })
    })
  }

  /** Abandons any search in progress (pending promises resolve to null). */
  cancel() {
    if (!this.pending.size) return
    for (const job of this.pending.values()) job.resolve(null)
    this.pending.clear()
    if (this.worker) {
      this.worker.terminate()
      this.worker = null
      this.spawn()
    }
  }

  dispose() {
    for (const job of this.pending.values()) job.resolve(null)
    this.pending.clear()
    this.worker?.terminate()
    this.worker = null
  }
}
