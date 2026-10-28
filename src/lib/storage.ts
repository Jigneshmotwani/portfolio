/** localStorage / sessionStorage access that never throws (private mode, sandboxes...). */
type Area = 'local' | 'session'

function area(kind: Area): Storage | null {
  try {
    return kind === 'local' ? window.localStorage : window.sessionStorage
  } catch {
    return null
  }
}

export function readJSON<T>(key: string, fallback: T, kind: Area = 'local'): T {
  try {
    const raw = area(kind)?.getItem(key)
    return raw == null ? fallback : (JSON.parse(raw) as T)
  } catch {
    return fallback
  }
}

export function writeJSON(key: string, value: unknown, kind: Area = 'local'): void {
  try {
    area(kind)?.setItem(key, JSON.stringify(value))
  } catch {
    /* storage unavailable or full: ignore */
  }
}

export function removeKey(key: string, kind: Area = 'local'): void {
  try {
    area(kind)?.removeItem(key)
  } catch {
    /* ignore */
  }
}

/** Zustand `persist` storage adapter built on the safe helpers above. */
export const safeLocalStorage = {
  getItem: (name: string): string | null => {
    try {
      return area('local')?.getItem(name) ?? null
    } catch {
      return null
    }
  },
  setItem: (name: string, value: string): void => {
    try {
      area('local')?.setItem(name, value)
    } catch {
      /* ignore */
    }
  },
  removeItem: (name: string): void => removeKey(name),
}
