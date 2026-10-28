import { useEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react'
import { useLongPress, useMediaQuery } from '../../lib/hooks'
import { playSound } from '../../lib/sound'
import { useTopActivity, type IslandActivity } from '../../state/island'
import { currentTrack, useMusic } from '../../state/music'
import { useSystem } from '../../state/system'
import { AppIcon } from '../shared/AppIcon'
import { PlayGlyph, SkipGlyph } from './glyphs'
import './DynamicIsland.css'

/**
 * The iPhone Dynamic Island. Idle: a compact black pill. With a live
 * activity (game score, AI thinking, now playing) it widens to show a
 * leading visual and a trailing value; tap to expand, long-press for Siri.
 */
export function DynamicIsland() {
  const activity = useTopActivity()
  const openSiri = useSystem((s) => s.openSiri)
  const [expanded, setExpanded] = useState(false)
  const [bump, setBump] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const narrow = useMediaQuery('(max-width: 359px)')

  // Collapse when the activity ends or changes kind.
  const kind = activity?.kind
  useEffect(() => {
    if (!kind) setExpanded(false)
  }, [kind])

  // Tap outside collapses the expanded island.
  useEffect(() => {
    if (!expanded) return
    const onDown = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setExpanded(false)
    }
    document.addEventListener('pointerdown', onDown, true)
    return () => document.removeEventListener('pointerdown', onDown, true)
  }, [expanded])

  const press = useLongPress(
    () => {
      setExpanded(false)
      playSound('click')
      openSiri()
    },
    {
      delay: 450,
      onClick: () => {
        if (activity) {
          setExpanded((v) => !v)
        } else {
          setBump(true)
          window.setTimeout(() => setBump(false), 320)
        }
      },
    },
  )

  const state = expanded && activity ? 'expanded' : activity ? 'compact' : 'idle'
  const label = activity
    ? `${activity.title}${activity.value ? `, ${activity.value}` : ''}. Tap to ${expanded ? 'collapse' : 'expand'}, long-press for Ask Jignesh.`
    : 'Dynamic Island. Long-press to Ask Jignesh.'

  return (
    <div
      ref={ref}
      className={`ios-island ios-island--${state}${activity ? ` ios-island--${activity.kind}` : ''}${bump ? ' ios-island--bump' : ''}${
        narrow ? ' ios-island--narrow' : ''
      }`}
      style={activity?.color ? ({ '--island-color': activity.color } as CSSProperties) : undefined}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div
        role="button"
        tabIndex={0}
        aria-label={label}
        aria-expanded={activity ? expanded : undefined}
        className="ios-island__hit"
        {...press}
        onPointerDown={(e: ReactPointerEvent) => {
          e.stopPropagation()
          press.onPointerDown(e)
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            if (activity) setExpanded((v) => !v)
            else openSiri()
          }
        }}
      />
      {state === 'compact' && activity && <Compact key={`c-${activity.id}`} activity={activity} />}
      {state === 'expanded' && activity && <Expanded key={`e-${activity.id}`} activity={activity} />}
    </div>
  )
}

function Leading({ activity, size }: { activity: IslandActivity; size: number }) {
  if (activity.kind === 'ai') return <span className="ios-island__orb" style={{ width: size, height: size }} />
  if (activity.kind === 'music' && !activity.icon) return <span className="ios-island__art" style={{ width: size, height: size }} />
  if (activity.icon) return <AppIcon id={activity.icon} size={size} className="ios-island__icon" />
  return <span className="ios-island__art" style={{ width: size, height: size }} />
}

function Bars({ kind }: { kind: IslandActivity['kind'] }) {
  return (
    <span className={`ios-island__bars ios-island__bars--${kind}`} aria-hidden="true">
      <i />
      <i />
      <i />
      <i />
      <i />
    </span>
  )
}

function Compact({ activity }: { activity: IslandActivity }) {
  return (
    <div className="ios-island__content ios-island__compact" aria-hidden="true">
      <Leading activity={activity} size={22} />
      {activity.value ? <span className="ios-island__value">{activity.value}</span> : <Bars kind={activity.kind} />}
    </div>
  )
}

function Expanded({ activity }: { activity: IslandActivity }) {
  const music = useMusic()
  const isMusic = activity.kind === 'music'
  const track = currentTrack(music.index)
  return (
    <div className="ios-island__content ios-island__expanded">
      <div className="ios-island__row">
        <Leading activity={activity} size={46} />
        <div className="ios-island__text">
          <strong>{isMusic ? activity.title || track.title : activity.title}</strong>
          {(activity.detail || isMusic) && <span>{activity.detail ?? track.artist}</span>}
        </div>
        {activity.value ? <span className="ios-island__value ios-island__value--lg">{activity.value}</span> : <Bars kind={activity.kind} />}
      </div>
      {isMusic && (
        <div className="ios-island__controls">
          <button aria-label="Previous track" onClick={() => music.prev()}>
            <SkipGlyph dir="prev" />
          </button>
          <button aria-label={music.playing ? 'Pause' : 'Play'} onClick={() => music.toggle()}>
            <PlayGlyph playing={music.playing} />
          </button>
          <button aria-label="Next track" onClick={() => music.next()}>
            <SkipGlyph dir="next" />
          </button>
        </div>
      )}
    </div>
  )
}
