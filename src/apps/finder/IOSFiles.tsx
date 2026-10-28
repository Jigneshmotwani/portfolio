import { ChevronLeft, ChevronRight, Search, X } from 'lucide-react'
import { useEffect, useMemo, useState, type ReactNode, type UIEvent } from 'react'
import { folderIconUrl } from '../../assets/icons'
import { formatModified, getNode, listDir, openNode, type VfsNode } from '../../data/vfs'
import { useApp } from '../types'
import { NodeIcon } from './NodeIcon'
import { findNodes, resolveLocation, RECENTS } from './locations'

const BROWSE = '#browse'

const LOCATIONS = ['/Projects', '/Resume', '/Certifications', '/Experience', '/Education']

/** Builds the navigation stack (Browse → … → path) for a deep link. */
function stackFor(path: string): string[] {
  if (path === '/' || path === RECENTS) return [BROWSE]
  const out = [BROWSE]
  let acc = ''
  for (const part of path.split('/').filter(Boolean)) {
    acc += `/${part}`
    out.push(acc)
  }
  return out
}

function subtitle(node: VfsNode) {
  if (node.type === 'folder') {
    const n = node.children?.length ?? 0
    return `${n} item${n === 1 ? '' : 's'}`
  }
  return node.modified ? formatModified(node.modified) : node.kindLabel
}

export function IOSFiles() {
  const { params } = useApp()
  const [stack, setStack] = useState<string[]>(() => stackFor(resolveLocation(params?.path)))
  const [dir, setDir] = useState<'push' | 'pop' | 'none'>('none')
  const top = stack[stack.length - 1]

  const nonce = params?.nonce
  useEffect(() => {
    if (nonce && params?.path) {
      setDir('push')
      setStack(stackFor(resolveLocation(params.path)))
    }
  }, [nonce])

  const push = (path: string) => {
    setDir('push')
    setStack((s) => [...s, path])
  }
  const pop = () => {
    setDir('pop')
    setStack((s) => (s.length > 1 ? s.slice(0, -1) : s))
  }

  const open = (node: VfsNode) => (node.type === 'folder' ? push(node.path) : openNode(node))
  const prevLabel = stack.length > 1 ? (stack[stack.length - 2] === BROWSE ? 'Browse' : (getNode(stack[stack.length - 2])?.label ?? 'Back')) : ''

  return (
    <div className="files-ios">
      <div key={top} className={`files-ios__screen files-ios__screen--${dir}`}>
        {top === BROWSE ? <BrowseScreen onOpen={open} /> : <FolderScreen path={top} backLabel={prevLabel} onBack={pop} onOpen={open} />}
      </div>
    </div>
  )
}

function useScrolled(threshold = 36) {
  const [scrolled, setScrolled] = useState(false)
  return { scrolled, onScroll: (e: UIEvent<HTMLElement>) => setScrolled(e.currentTarget.scrollTop > threshold) }
}

function BrowseScreen({ onOpen }: { onOpen: (n: VfsNode) => void }) {
  const [query, setQuery] = useState('')
  const { scrolled, onScroll } = useScrolled()
  const results = useMemo(() => findNodes(query), [query])
  const locations = LOCATIONS.map((p) => getNode(p)).filter((n): n is VfsNode => !!n)
  const rootFiles = listDir('/').filter((n) => n.type === 'file')
  const trash = getNode('/Trash')

  return (
    <>
      <header className={`files-ios__bar${scrolled ? ' is-scrolled' : ''}`}>
        <span className="files-ios__bar-title">Browse</span>
      </header>
      <div className="files-ios__scroll scroll" onScroll={onScroll}>
        <h1 className="files-ios__large">Browse</h1>
        <label className="files-ios__search">
          <Search size={16} aria-hidden="true" />
          <input id="files-ios-search" type="search" placeholder="Search" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search files" />
          {query && (
            <button onClick={() => setQuery('')} aria-label="Clear search">
              <X size={14} />
            </button>
          )}
        </label>

        {query.trim() ? (
          <Group title={`${results.length} result${results.length === 1 ? '' : 's'}`}>
            {results.map((n) => (
              <Row key={n.path} node={n} onOpen={onOpen} detail={n.path.split('/').slice(1, -1).join(' › ') || 'jignesh'} />
            ))}
          </Group>
        ) : (
          <>
            <Group title="Locations">
              {locations.map((n) => (
                <Row key={n.path} node={n} onOpen={onOpen} />
              ))}
            </Group>
            <Group title="On My Portfolio">
              {rootFiles.map((n) => (
                <Row key={n.path} node={n} onOpen={onOpen} />
              ))}
            </Group>
            {trash && (
              <Group title="More">
                <button className="files-ios__row" onClick={() => onOpen(trash)}>
                  <span className="files-ios__row-icon">
                    <img src={folderIconUrl('none')} alt="" />
                  </span>
                  <span className="files-ios__row-text">
                    <span className="files-ios__row-title">Recently Deleted</span>
                  </span>
                  <ChevronRight size={16} className="files-ios__chev" aria-hidden="true" />
                </button>
              </Group>
            )}
          </>
        )}
      </div>
    </>
  )
}

function FolderScreen({ path, backLabel, onBack, onOpen }: { path: string; backLabel: string; onBack: () => void; onOpen: (n: VfsNode) => void }) {
  const node = getNode(path)
  const items = listDir(path)
  const { scrolled, onScroll } = useScrolled()
  const title = path === '/Trash' ? 'Recently Deleted' : (node?.label ?? 'Folder')
  return (
    <>
      <header className={`files-ios__bar${scrolled ? ' is-scrolled' : ''}`}>
        <button className="files-ios__back" onClick={onBack}>
          <ChevronLeft size={24} strokeWidth={2.4} aria-hidden="true" />
          <span>{backLabel}</span>
        </button>
        <span className="files-ios__bar-title">{title}</span>
      </header>
      <div className="files-ios__scroll scroll" onScroll={onScroll}>
        <h1 className="files-ios__large">{title}</h1>
        {items.length === 0 ? (
          <p className="files-ios__empty">No items</p>
        ) : (
          <div className="files-ios__grid">
            {items.map((n) => (
              <button key={n.path} className="files-ios__tile" onClick={() => onOpen(n)}>
                <NodeIcon node={n} size={76} thumb className="files-ios__tile-icon" />
                <span className="files-ios__tile-name">{n.label}</span>
                <span className="files-ios__tile-sub">{subtitle(n)}</span>
              </button>
            ))}
          </div>
        )}
        <p className="files-ios__count">
          {items.length} item{items.length === 1 ? '' : 's'}
        </p>
      </div>
    </>
  )
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="files-ios__group">
      <h2 className="files-ios__group-title">{title}</h2>
      <div className="files-ios__list">{children}</div>
    </section>
  )
}

function Row({ node, onOpen, detail }: { node: VfsNode; onOpen: (n: VfsNode) => void; detail?: string }) {
  return (
    <button className="files-ios__row" onClick={() => onOpen(node)}>
      <NodeIcon node={node} size={30} className="files-ios__row-icon" />
      <span className="files-ios__row-text">
        <span className="files-ios__row-title">{node.label}</span>
        {detail && <span className="files-ios__row-detail">{detail}</span>}
      </span>
      <ChevronRight size={16} className="files-ios__chev" aria-hidden="true" />
    </button>
  )
}
