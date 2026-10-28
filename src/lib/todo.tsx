import type { ReactNode } from 'react'
import { content } from '../data/content'

/** True for placeholder strings from content.ts ("TODO: ..."). */
export function isTodo(value: unknown): boolean {
  return typeof value === 'string' && /^\s*TODO\b/i.test(value)
}

export const showPlaceholders = content.site.showPlaceholders

/** Filters a list for display: drops placeholders unless they should be shown. */
export function shown<T>(items: T[]): T[] {
  return showPlaceholders ? items : items.filter((i) => !isTodo(i))
}

/** Keeps only real (non-placeholder) strings, e.g. for the assistant and resume PDF. */
export function real<T>(items: T[]): T[] {
  return items.filter((i) => !isTodo(i))
}

/** Renders text from content.ts, styling or hiding "TODO:" placeholders. */
export function T({ children, fallback = null }: { children: string | undefined; fallback?: ReactNode }) {
  if (!children) return <>{fallback}</>
  if (!isTodo(children)) return <>{children}</>
  if (!showPlaceholders) return <>{fallback}</>
  return (
    <span className="todo" title="Placeholder: fill this in src/data/content.ts">
      {children.replace(/^\s*TODO:?\s*/i, '')}
    </span>
  )
}
