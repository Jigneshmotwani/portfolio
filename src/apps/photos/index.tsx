import { ChevronLeft, ChevronRight, Images, LayoutGrid, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type PointerEvent as RPointerEvent } from 'react'
import { content } from '../../data/content'
import type { Photo } from '../../data/types'
import { asset } from '../../lib/assets'
import { projectCoverUrl } from '../../lib/covers'
import { useApp } from '../types'
import './photos.css'

interface Item extends Photo {
  url: string
  albumId: string
  albumName: string
}

const LIBRARY = 'library'

function resolve(src: string): string {
  if (src.startsWith('cover:')) {
    const p = content.projects.find((x) => x.id === src.slice(6))
    return p ? projectCoverUrl(p) : ''
  }
  return asset(src)
}

const allItems: Item[] = content.albums.flatMap((a) =>
  a.photos.map((p) => ({ ...p, url: resolve(p.src), albumId: a.id, albumName: a.name })),
)

function itemsFor(albumId: string): Item[] {
  return albumId === LIBRARY ? allItems : allItems.filter((i) => i.albumId === albumId)
}

function albumName(albumId: string) {
  return albumId === LIBRARY ? 'Library' : (content.albums.find((a) => a.id === albumId)?.name ?? 'Library')
}

export default function PhotosApp() {
  const { platform, params, active, setTitle } = useApp()
  const [album, setAlbum] = useState<string>(() => (params?.album && content.albums.some((a) => a.id === params.album) ? params.album : LIBRARY))
  const [open, setOpen] = useState<number | null>(null)
  const [selected, setSelected] = useState<string | null>(null)
  const [thumb, setThumb] = useState(150)
  const [iosTab, setIosTab] = useState<'library' | 'albums'>(params?.album ? 'albums' : 'library')
  const [iosAlbum, setIosAlbum] = useState<string | null>(params?.album ?? null)
  const handled = useRef<number | undefined>(undefined)

  // Launch intents: open an album and/or a photo.
  useEffect(() => {
    if (!params || params.nonce === handled.current) return
    handled.current = params.nonce
    const target = params.album && content.albums.some((a) => a.id === params.album) ? params.album : null
    if (target) {
      setAlbum(target)
      setIosTab('albums')
      setIosAlbum(target)
    }
    if (params.photo) {
      const list = itemsFor(target ?? LIBRARY)
      const i = list.findIndex((p) => p.id === params.photo)
      if (i >= 0) setOpen(i)
    }
  }, [params])

  const currentAlbum = platform === 'ios' ? (iosTab === 'albums' ? iosAlbum : LIBRARY) : album
  const items = useMemo(() => (currentAlbum ? itemsFor(currentAlbum) : []), [currentAlbum])

  useEffect(() => {
    if (platform === 'mac') setTitle(albumName(album))
  }, [album, platform, setTitle])

  const lightbox =
    open !== null && items[open] ? (
      <Lightbox items={items} index={open} onIndex={setOpen} onClose={() => setOpen(null)} active={active} platform={platform} />
    ) : null

  if (platform === 'ios') {
    return (
      <div className="photos photos--ios">
        <div className="photos-ios-scroll scroll">
          {iosTab === 'library' ? (
            <>
              <header className="photos-ios-head">
                <h1>Library</h1>
                <p>{allItems.length} Photos</p>
              </header>
              <Grid items={items} onOpen={setOpen} ios />
            </>
          ) : iosAlbum ? (
            <>
              <button className="photos-ios-back" onClick={() => setIosAlbum(null)}>
                <ChevronLeft size={24} /> Albums
              </button>
              <header className="photos-ios-head">
                <h1>{albumName(iosAlbum)}</h1>
                <p>{items.length} Photos</p>
              </header>
              <Grid items={items} onOpen={setOpen} ios />
            </>
          ) : (
            <>
              <header className="photos-ios-head">
                <h1>Albums</h1>
              </header>
              <div className="photos-albums">
                {content.albums.map((a) => {
                  const first = itemsFor(a.id)[0]
                  return (
                    <button key={a.id} className="photos-album" onClick={() => setIosAlbum(a.id)}>
                      <span className="photos-album__cover">
                        {first && <img src={first.url} alt="" draggable={false} className={first.src.startsWith('cover:') ? 'is-cover' : undefined} />}
                      </span>
                      <strong>{a.name}</strong>
                      <span>{a.photos.length}</span>
                    </button>
                  )
                })}
              </div>
            </>
          )}
        </div>
        <nav className="photos-tabbar" aria-label="Photos sections">
          <button className={iosTab === 'library' ? 'is-on' : ''} onClick={() => setIosTab('library')}>
            <Images size={24} />
            Library
          </button>
          <button
            className={iosTab === 'albums' ? 'is-on' : ''}
            onClick={() => {
              if (iosTab === 'albums') setIosAlbum(null)
              setIosTab('albums')
            }}
          >
            <LayoutGrid size={24} />
            Albums
          </button>
        </nav>
        {lightbox}
      </div>
    )
  }

  return (
    <div className="photos photos--mac">
      <aside className="photos-side" data-drag>
        <div className="photos-side__spacer" data-drag />
        <p className="photos-side__label">Photos</p>
        <button className={`photos-side__item${album === LIBRARY ? ' is-on' : ''}`} onClick={() => setAlbum(LIBRARY)}>
          <Images size={15} /> Library
        </button>
        <p className="photos-side__label">Albums</p>
        {content.albums.map((a) => (
          <button key={a.id} className={`photos-side__item${album === a.id ? ' is-on' : ''}`} onClick={() => setAlbum(a.id)}>
            <LayoutGrid size={15} /> {a.name}
            <span>{a.photos.length}</span>
          </button>
        ))}
      </aside>
      <div className="photos-main">
        <header className="photos-toolbar" data-drag>
          <div className="photos-toolbar__title" data-drag>
            <strong>{albumName(album)}</strong>
            <span>{items.length} items</span>
          </div>
          <label className="photos-zoom" title="Thumbnail size">
            <span aria-hidden>−</span>
            <input type="range" min={90} max={260} value={thumb} onChange={(e) => setThumb(Number(e.target.value))} aria-label="Thumbnail size" />
            <span aria-hidden>+</span>
          </label>
        </header>
        <div className="photos-scroll scroll" style={{ ['--thumb' as string]: `${thumb}px` }} onClick={(e) => e.target === e.currentTarget && setSelected(null)}>
          <Grid items={items} onOpen={setOpen} selected={selected} onSelect={setSelected} />
        </div>
      </div>
      {lightbox}
    </div>
  )
}

function Grid({
  items,
  onOpen,
  selected,
  onSelect,
  ios = false,
}: {
  items: Item[]
  onOpen: (i: number) => void
  selected?: string | null
  onSelect?: (id: string) => void
  ios?: boolean
}) {
  return (
    <div className={`photos-grid${ios ? ' photos-grid--ios' : ''}`} role="list">
      {items.map((p, i) => (
        <button
          key={`${p.albumId}-${p.id}`}
          role="listitem"
          className={`photos-thumb${selected === p.id ? ' is-selected' : ''}`}
          onClick={() => (ios ? onOpen(i) : onSelect?.(p.id))}
          onDoubleClick={() => !ios && onOpen(i)}
          onKeyDown={(e) => {
            if (!ios && (e.key === 'Enter' || e.key === ' ')) {
              e.preventDefault()
              onOpen(i)
            }
          }}
          aria-label={p.caption}
          title={ios ? undefined : `${p.caption} — double-click to open`}
        >
          <img src={p.url} alt="" loading="lazy" draggable={false} className={p.src.startsWith('cover:') ? 'is-cover' : undefined} />
        </button>
      ))}
    </div>
  )
}

function Lightbox({
  items,
  index,
  onIndex,
  onClose,
  active,
  platform,
}: {
  items: Item[]
  index: number
  onIndex: (i: number) => void
  onClose: () => void
  active: boolean
  platform: 'mac' | 'ios'
}) {
  const item = items[index]
  const [chrome, setChrome] = useState(true)
  const [drag, setDrag] = useState({ x: 0, y: 0 })
  const start = useRef<{ x: number; y: number; t: number } | null>(null)
  const prev = () => onIndex((index - 1 + items.length) % items.length)
  const next = () => onIndex((index + 1) % items.length)

  useEffect(() => {
    if (!active) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') prev()
      else if (e.key === 'ArrowRight') next()
      else if (e.key === 'Escape') onClose()
      else return
      e.preventDefault()
      e.stopPropagation()
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  })

  const onDown = (e: RPointerEvent) => {
    if (platform !== 'ios') return
    start.current = { x: e.clientX, y: e.clientY, t: Date.now() }
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  }
  const onMove = (e: RPointerEvent) => {
    if (!start.current) return
    const dx = e.clientX - start.current.x
    const dy = e.clientY - start.current.y
    setDrag(Math.abs(dy) > Math.abs(dx) && dy > 0 ? { x: 0, y: dy } : { x: dx, y: 0 })
  }
  const onUp = () => {
    if (!start.current) return
    const { x, y } = drag
    const quick = Date.now() - start.current.t < 250
    start.current = null
    setDrag({ x: 0, y: 0 })
    if (y > 120 || (quick && y > 40)) onClose()
    else if (x < -70 || (quick && x < -25)) next()
    else if (x > 70 || (quick && x > 25)) prev()
    else if (Math.abs(x) < 6 && y < 6) setChrome((c) => !c)
  }

  const fade = Math.max(0.35, 1 - drag.y / 400)
  return (
    <div
      className={`photos-lightbox photos-lightbox--${platform}${chrome ? '' : ' no-chrome'}`}
      role="dialog"
      aria-label={item.caption}
      style={{ background: `rgb(0 0 0 / ${platform === 'ios' ? fade : 0.94})` }}
    >
      <div className="photos-lightbox__top">
        <button className="photos-lb-btn" onClick={onClose} aria-label="Close">
          {platform === 'ios' ? <ChevronLeft size={26} /> : <X size={18} />}
        </button>
        <span className="photos-lightbox__count">
          {index + 1} of {items.length}
        </span>
        <span className="photos-lb-btn photos-lb-spacer" />
      </div>
      <div
        className="photos-lightbox__stage"
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        onClick={(e) => platform === 'mac' && e.target === e.currentTarget && onClose()}
      >
        <img
          key={item.id}
          src={item.url}
          alt={item.caption}
          draggable={false}
          style={{
            transform: `translate(${drag.x}px, ${drag.y}px) scale(${1 - Math.min(drag.y, 300) / 1200})`,
            transition: start.current ? 'none' : undefined,
          }}
        />
      </div>
      {items.length > 1 && (
        <>
          <button className="photos-lb-nav photos-lb-nav--prev" onClick={prev} aria-label="Previous photo">
            <ChevronLeft size={28} />
          </button>
          <button className="photos-lb-nav photos-lb-nav--next" onClick={next} aria-label="Next photo">
            <ChevronRight size={28} />
          </button>
        </>
      )}
      <div className="photos-lightbox__caption">
        <strong>{item.caption}</strong>
        <span>{item.albumName}</span>
      </div>
    </div>
  )
}
