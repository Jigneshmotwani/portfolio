/// <reference lib="webworker" />
import { search, type SearchRequest, type SearchResult } from './engine'

interface Job extends SearchRequest {
  id: number
}

const scope = self as unknown as { onmessage: ((e: MessageEvent<Job>) => void) | null; postMessage: (msg: { id: number; result: SearchResult | null }) => void }

scope.onmessage = (e) => {
  const { id, ...req } = e.data
  let result: SearchResult | null = null
  try {
    result = search(req)
  } catch (err) {
    console.error('[chess engine]', err)
  }
  scope.postMessage({ id, result })
}
