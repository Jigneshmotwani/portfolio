import { appIconUrl, fileIconUrl, folderIconUrl } from '../../assets/icons'
import { content } from '../../data/content'
import type { VfsNode } from '../../data/vfs'
import { asset } from '../../lib/assets'
import { projectCoverUrl } from '../../lib/covers'
import { apps } from '../registry'

/** Image URL for a node's icon. `thumb` lets project files show their cover art. */
export function nodeIconSrc(node: VfsNode, thumb = false): string {
  if (node.type === 'folder') return folderIconUrl(node.emblem)
  if (node.ref?.type === 'app') return appIconUrl(apps[node.ref.id].icon)
  if (thumb && node.ref?.type === 'project') {
    const ref = node.ref
    const p = content.projects.find((x) => x.id === ref.id)
    if (p) return p.screenshots?.length ? asset(p.screenshots[0]) : projectCoverUrl(p)
  }
  return fileIconUrl(node.kind ?? 'doc')
}

/** Square icon box; project thumbnails render as a framed landscape preview. */
export function NodeIcon({ node, size, thumb = false, className = '' }: { node: VfsNode; size: number; thumb?: boolean; className?: string }) {
  const isThumb = thumb && node.ref?.type === 'project'
  return (
    <span className={`node-icon${isThumb ? ' node-icon--thumb' : ''} ${className}`} style={{ width: size, height: size }} aria-hidden="true">
      <img src={nodeIconSrc(node, thumb)} alt="" draggable={false} />
    </span>
  )
}
