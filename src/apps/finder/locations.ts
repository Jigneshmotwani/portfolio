import { allNodes, getNode, type VfsNode } from '../../data/vfs'

/** Finder-only virtual location listing recently modified files. */
export const RECENTS = '#recents'

/** Canonical path for a launch param (unknown paths fall back to the home folder). */
export function resolveLocation(path: string | undefined): string {
  if (!path) return '/'
  if (path === RECENTS || path.toLowerCase() === '/recents') return RECENTS
  const node = getNode(path)
  if (!node) return '/'
  // A file path opens its folder in Finder.
  return node.type === 'folder' ? node.path : node.path.replace(/\/[^/]+$/, '') || '/'
}

export function locationLabel(path: string): string {
  if (path === RECENTS) return 'Recents'
  return getNode(path)?.label ?? 'jignesh'
}

function sortKey(m?: string) {
  if (!m) return ''
  return m.length === 4 ? `${m}-12-31` : m.length === 7 ? `${m}-31` : m
}

/** Most recently modified files (excluding apps and the trash). */
export function recentNodes(limit = 14): VfsNode[] {
  return allNodes()
    .filter((n) => n.type === 'file' && n.ref?.type !== 'app' && !n.path.startsWith('/Trash'))
    .sort((a, b) => sortKey(b.modified).localeCompare(sortKey(a.modified)))
    .slice(0, limit)
}

/** Case-insensitive search across names, labels and kinds. */
export function findNodes(query: string): VfsNode[] {
  const q = query.trim().toLowerCase()
  if (!q) return []
  return allNodes().filter((n) => `${n.label} ${n.name} ${n.kindLabel}`.toLowerCase().includes(q))
}
