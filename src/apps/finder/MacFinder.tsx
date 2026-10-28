import {
  Award,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  Clock,
  FileText,
  Folder,
  GraduationCap,
  House,
  LayoutGrid,
  List,
  Search,
  Trash2,
  X,
  type LucideIcon,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { formatModified, getNode, listDir, openNode, parentPath, type VfsNode } from '../../data/vfs'
import { useApp } from '../types'
import { NodeIcon } from './NodeIcon'
import { RECENTS, findNodes, locationLabel, recentNodes, resolveLocation } from './locations'

interface SidebarItem {
  path: string
  label: string
  icon: LucideIcon
}

const FAVORITES: SidebarItem[] = [
  { path: RECENTS, label: 'Recents', icon: Clock },
  { path: '/Applications', label: 'Applications', icon: LayoutGrid },
  { path: '/', label: 'jignesh', icon: House },
]

const LOCATIONS: SidebarItem[] = [
  { path: '/Projects', label: 'Projects', icon: Folder },
  { path: '/Resume', label: 'Resume', icon: FileText },
  { path: '/Certifications', label: 'Certifications', icon: Award },
  { path: '/Experience', label: 'Experience', icon: Briefcase },
  { path: '/Education', label: 'Education', icon: GraduationCap },
  { path: '/Trash', label: 'Trash', icon: Trash2 },
]

const ITEM_W = 104

export function MacFinder() {
  const { params, setTitle } = useApp()
  const [hist, setHist] = useState(() => ({ stack: [resolveLocation(params?.path)], index: 0 }))
  const [view, setView] = useState<'icons' | 'list'>('icons')
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<string | null>(null)
  const gridRef = useRef<HTMLDivElement>(null)
  const path = hist.stack[hist.index]

  const go = (next: string) => {
    setQuery('')
    setSelected(null)
    setHist((h) => (h.stack[h.index] === next ? h : { stack: [...h.stack.slice(0, h.index + 1), next], index: h.index + 1 }))
  }
  const back = () => hist.index > 0 && (setSelected(null), setHist((h) => ({ ...h, index: h.index - 1 })))
  const forward = () => hist.index < hist.stack.length - 1 && (setSelected(null), setHist((h) => ({ ...h, index: h.index + 1 })))

  // A new launch intent (desktop folder double-click, Spotlight, Terminal `open`) re-targets this window.
  const nonce = params?.nonce
  useEffect(() => {
    if (nonce && params?.path) go(resolveLocation(params.path))
  }, [nonce])

  const searching = query.trim().length > 0
  const items = useMemo<VfsNode[]>(() => {
    if (searching) return findNodes(query)
    if (path === RECENTS) return recentNodes()
    return listDir(path)
  }, [path, query, searching])

  const title = searching ? `Searching “${query.trim()}”` : locationLabel(path)
  useEffect(() => setTitle(title), [title, setTitle])

  const open = (node: VfsNode) => {
    if (node.type === 'folder') go(node.path)
    else openNode(node)
  }

  const selectedIndex = items.findIndex((n) => n.path === selected)
  const selectedNode = selectedIndex >= 0 ? items[selectedIndex] : null

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'ArrowUp') {
      e.preventDefault()
      if (path !== '/' && path !== RECENTS) go(parentPath(path))
      return
    }
    if (((e.metaKey || e.ctrlKey) && e.key === 'ArrowDown') || e.key === 'Enter') {
      e.preventDefault()
      if (selectedNode) open(selectedNode)
      return
    }
    if (e.key === 'Backspace' && !searching) {
      e.preventDefault()
      back()
      return
    }
    const cols =
      view === 'icons' && gridRef.current ? Math.max(1, Math.floor((gridRef.current.clientWidth - 24) / ITEM_W)) : 1
    const delta: Record<string, number> = { ArrowRight: view === 'icons' ? 1 : 0, ArrowLeft: view === 'icons' ? -1 : 0, ArrowDown: cols, ArrowUp: -cols }
    const d = delta[e.key]
    if (d === undefined || !items.length) return
    e.preventDefault()
    const from = selectedIndex < 0 ? (d > 0 ? -1 : items.length) : selectedIndex
    const next = Math.min(items.length - 1, Math.max(0, from + d))
    setSelected(items[next].path)
    gridRef.current?.querySelector<HTMLElement>(`[data-index="${next}"]`)?.scrollIntoView({ block: 'nearest' })
  }

  const crumbs = useMemo(() => {
    if (searching) return [{ path: '/', label: 'jignesh' }]
    if (path === RECENTS) return [{ path: RECENTS, label: 'Recents' }]
    const parts = path.split('/').filter(Boolean)
    const out = [{ path: '/', label: 'jignesh' }]
    let acc = ''
    for (const p of parts) {
      acc += `/${p}`
      out.push({ path: acc, label: getNode(acc)?.label ?? p })
    }
    return out
  }, [path, searching])

  return (
    <div className="finder-mac">
      <aside className="finder-mac__sidebar" data-drag>
        <nav className="finder-mac__nav scroll" aria-label="Finder sidebar">
          <SidebarSection title="Favorites" items={FAVORITES} current={searching ? '' : path} onPick={go} />
          <SidebarSection title="Locations" items={LOCATIONS} current={searching ? '' : path} onPick={go} />
        </nav>
      </aside>

      <section className="finder-mac__main">
        <header className="finder-mac__toolbar" data-drag>
          <div className="finder-mac__history">
            <button className="finder-mac__tool" onClick={back} disabled={hist.index === 0} aria-label="Back" title="Back">
              <ChevronLeft size={18} strokeWidth={2.2} />
            </button>
            <button
              className="finder-mac__tool"
              onClick={forward}
              disabled={hist.index >= hist.stack.length - 1}
              aria-label="Forward"
              title="Forward"
            >
              <ChevronRight size={18} strokeWidth={2.2} />
            </button>
          </div>
          <h1 className="finder-mac__title">{title}</h1>
          <div className="finder-mac__spacer" />
          <div className="finder-mac__segmented" role="group" aria-label="View">
            <button className={view === 'icons' ? 'is-on' : ''} onClick={() => setView('icons')} aria-pressed={view === 'icons'} title="Icons">
              <LayoutGrid size={15} />
            </button>
            <button className={view === 'list' ? 'is-on' : ''} onClick={() => setView('list')} aria-pressed={view === 'list'} title="List">
              <List size={16} />
            </button>
          </div>
          <label className="finder-mac__search">
            <Search size={13} aria-hidden="true" />
            <input
              id="finder-search"
              type="search"
              placeholder="Search"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setSelected(null)
              }}
              onKeyDown={(e) => e.key === 'Escape' && setQuery('')}
              aria-label="Search files"
            />
            {query && (
              <button onClick={() => setQuery('')} aria-label="Clear search">
                <X size={12} />
              </button>
            )}
          </label>
        </header>

        <div
          ref={gridRef}
          className={`finder-mac__content scroll finder-mac__content--${view}`}
          tabIndex={0}
          onKeyDown={onKeyDown}
          onPointerDown={(e) => e.target === e.currentTarget && setSelected(null)}
          aria-label={`${title} contents`}
        >
          {searching && <div className="finder-mac__scope">Searching “This Portfolio” · {items.length} results</div>}
          {items.length === 0 && <div className="finder-mac__empty">{searching ? 'No results' : 'This folder is empty'}</div>}
          {view === 'icons' ? (
            <div className="finder-mac__grid" role="listbox" aria-label="Files">
              {items.map((node, i) => (
                <button
                  key={node.path}
                  data-index={i}
                  role="option"
                  aria-selected={selected === node.path}
                  className={`finder-mac__item${selected === node.path ? ' is-selected' : ''}`}
                  onClick={() => setSelected(node.path)}
                  onDoubleClick={() => open(node)}
                  title={node.label}
                >
                  <NodeIcon node={node} size={64} thumb className="finder-mac__icon" />
                  <span className="finder-mac__label">{node.label}</span>
                </button>
              ))}
            </div>
          ) : (
            items.length > 0 && (
              <table className="finder-mac__table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Date Modified</th>
                    <th>Size</th>
                    <th>Kind</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((node, i) => (
                    <tr
                      key={node.path}
                      data-index={i}
                      className={selected === node.path ? 'is-selected' : ''}
                      onClick={() => setSelected(node.path)}
                      onDoubleClick={() => open(node)}
                      aria-selected={selected === node.path}
                    >
                      <td>
                        <span className="finder-mac__name">
                          <NodeIcon node={node} size={16} />
                          <span>{node.label}</span>
                        </span>
                      </td>
                      <td>{formatModified(node.modified)}</td>
                      <td>{node.type === 'folder' ? `${node.children?.length ?? 0} items` : (node.size ?? '—')}</td>
                      <td>{node.kindLabel}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          )}
        </div>

        <footer className="finder-mac__footer">
          <ol className="finder-mac__path" aria-label="Path">
            {crumbs.map((c, i) => (
              <li key={c.path}>
                {i > 0 && <ChevronRight size={11} className="finder-mac__sep" aria-hidden="true" />}
                <button onDoubleClick={() => go(c.path)} onClick={() => i < crumbs.length - 1 && go(c.path)}>
                  {c.path === RECENTS ? <Clock size={12} /> : c.path === '/' ? <House size={12} /> : <Folder size={12} />}
                  {c.label}
                </button>
              </li>
            ))}
            {selectedNode && (
              <li>
                <ChevronRight size={11} className="finder-mac__sep" aria-hidden="true" />
                <span className="finder-mac__crumb-file">
                  <NodeIcon node={selectedNode} size={12} />
                  {selectedNode.label}
                </span>
              </li>
            )}
          </ol>
          <span className="finder-mac__status">
            {selectedNode ? `1 of ${items.length} selected` : `${items.length} item${items.length === 1 ? '' : 's'}`}
          </span>
        </footer>
      </section>
    </div>
  )
}

function SidebarSection({ title, items, current, onPick }: { title: string; items: SidebarItem[]; current: string; onPick: (p: string) => void }) {
  return (
    <div className="finder-mac__section">
      <div className="finder-mac__section-title">{title}</div>
      {items.map(({ path, label, icon: Icon }) => (
        <button
          key={path}
          className={`finder-mac__side-item${current === path ? ' is-current' : ''}`}
          onClick={() => onPick(path)}
          aria-current={current === path ? 'page' : undefined}
        >
          <Icon size={15} strokeWidth={2} className="finder-mac__side-icon" />
          <span>{label}</span>
        </button>
      ))}
    </div>
  )
}

