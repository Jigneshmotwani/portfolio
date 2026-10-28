import { Moon, Sun, Volume1, Volume2, VolumeX } from 'lucide-react'
import { content } from '../../data/content'
import { asset } from '../../lib/assets'
import { useMediaQuery } from '../../lib/hooks'
import { launch, openResume } from '../../lib/launch'
import { playSound, type SoundName } from '../../lib/sound'
import { useResolvedTheme } from '../../lib/theme'
import { ACCENTS, WALLPAPERS, useSettings, type AccentId, type ThemePref } from '../../state/settings'
import { IOSGroup, IOSRow, MacGroup, MacRow, Segmented, Slider, Switch } from './kit'

type P = { platform: 'mac' | 'ios' }

export const VERSION_LABEL = 'JigneshOS 26'

/* ── Appearance ───────────────────────────────────────────────────────── */

function ThemePreview({ mode }: { mode: ThemePref }) {
  const light = (
    <>
      <rect width="88" height="58" fill="#cfe0f7" />
      <rect width="88" height="5" fill="#ffffff" opacity=".7" />
      <rect x="12" y="13" width="54" height="36" rx="4" fill="#ffffff" />
      <rect x="12" y="13" width="17" height="36" rx="4" fill="#e6e6ea" />
      <circle cx="16" cy="17" r="1.4" fill="#ff5f57" />
      <circle cx="20" cy="17" r="1.4" fill="#febc2e" />
      <circle cx="24" cy="17" r="1.4" fill="#28c840" />
      <rect x="34" y="20" width="24" height="3" rx="1.5" fill="var(--accent)" />
      <rect x="34" y="27" width="28" height="2.5" rx="1.25" fill="#d6d6dc" />
      <rect x="34" y="32" width="20" height="2.5" rx="1.25" fill="#d6d6dc" />
    </>
  )
  const dark = (
    <>
      <rect width="88" height="58" fill="#2b3550" />
      <rect width="88" height="5" fill="#000000" opacity=".35" />
      <rect x="12" y="13" width="54" height="36" rx="4" fill="#1f1f22" />
      <rect x="12" y="13" width="17" height="36" rx="4" fill="#2c2c30" />
      <circle cx="16" cy="17" r="1.4" fill="#ff5f57" />
      <circle cx="20" cy="17" r="1.4" fill="#febc2e" />
      <circle cx="24" cy="17" r="1.4" fill="#28c840" />
      <rect x="34" y="20" width="24" height="3" rx="1.5" fill="var(--accent)" />
      <rect x="34" y="27" width="28" height="2.5" rx="1.25" fill="#3a3a3f" />
      <rect x="34" y="32" width="20" height="2.5" rx="1.25" fill="#3a3a3f" />
    </>
  )
  return (
    <svg viewBox="0 0 88 58" className="settings-theme__svg" aria-hidden>
      <defs>
        <clipPath id={`clip-${mode}`}>
          <rect width="88" height="58" rx="6" />
        </clipPath>
        <clipPath id="half-right">
          <path d="M44 0H88V58H44Z" />
        </clipPath>
      </defs>
      <g clipPath={`url(#clip-${mode})`}>
        {mode === 'dark' ? dark : light}
        {mode === 'auto' && <g clipPath="url(#half-right)">{dark}</g>}
      </g>
    </svg>
  )
}

const THEME_OPTIONS: { value: ThemePref; label: string }[] = [
  { value: 'auto', label: 'Auto' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
]

function AccentDots({ platform }: P) {
  const accent = useSettings((s) => s.accent)
  const update = useSettings((s) => s.update)
  const theme = useResolvedTheme()
  return (
    <div className={`settings-accents settings-accents--${platform}`} role="radiogroup" aria-label="Accent colour">
      {(Object.keys(ACCENTS) as AccentId[]).map((id) => (
        <button
          key={id}
          type="button"
          role="radio"
          aria-checked={accent === id}
          aria-label={ACCENTS[id].label}
          title={ACCENTS[id].label}
          className={`settings-accent${accent === id ? ' is-on' : ''}`}
          style={{ background: ACCENTS[id][theme] }}
          onClick={() => {
            update({ accent: id })
            playSound('click')
          }}
        />
      ))}
    </div>
  )
}

export function AppearancePane({ platform }: P) {
  const theme = useSettings((s) => s.theme)
  const magnify = useSettings((s) => s.dockMagnification)
  const brightness = useSettings((s) => s.brightness)
  const update = useSettings((s) => s.update)
  const resolved = useResolvedTheme()

  if (platform === 'ios') {
    return (
      <>
        <IOSGroup header="Appearance">
          <div className="settings-iosthemes">
            {(['light', 'dark'] as const).map((mode) => {
              const on = theme === 'auto' ? resolved === mode : theme === mode
              return (
                <button key={mode} type="button" className="settings-iostheme" aria-pressed={on} onClick={() => update({ theme: mode })}>
                  <span className={`settings-iostheme__phone settings-iostheme__phone--${mode}`}>
                    <span className="settings-iostheme__time">9:41</span>
                  </span>
                  <span className="settings-iostheme__label">{mode === 'light' ? 'Light' : 'Dark'}</span>
                  <span className={`settings-radio${on ? ' is-on' : ''}`} aria-hidden />
                </button>
              )
            })}
          </div>
          <IOSRow
            label="Automatic"
            accessory={
              <Switch
                platform="ios"
                label="Automatic appearance"
                checked={theme === 'auto'}
                onChange={(v) => update({ theme: v ? 'auto' : resolved })}
              />
            }
          />
        </IOSGroup>
        <IOSGroup header="Brightness">
          <div className="settings-iosslider">
            <Sun size={16} aria-hidden />
            <Slider platform="ios" label="Brightness" min={0.35} max={1} value={brightness} onChange={(v) => update({ brightness: v })} />
            <Sun size={24} aria-hidden />
          </div>
        </IOSGroup>
        <IOSGroup header="Accent colour" footer="Used for buttons, selections and links across the portfolio.">
          <div className="settings-iospad">
            <AccentDots platform="ios" />
          </div>
        </IOSGroup>
      </>
    )
  }

  return (
    <>
      <MacGroup title="Appearance">
        <div className="settings-themes" role="radiogroup" aria-label="Appearance">
          {THEME_OPTIONS.map((o) => (
            <button
              key={o.value}
              type="button"
              role="radio"
              aria-checked={theme === o.value}
              className={`settings-theme${theme === o.value ? ' is-on' : ''}`}
              onClick={() => update({ theme: o.value })}
            >
              <span className="settings-theme__frame">
                <ThemePreview mode={o.value} />
              </span>
              <span className="settings-theme__label">{o.label}</span>
            </button>
          ))}
        </div>
      </MacGroup>
      <MacGroup footer="Auto follows your device's light or dark setting.">
        <MacRow label="Accent colour">
          <AccentDots platform="mac" />
        </MacRow>
        <MacRow label="Display brightness" htmlFor="settings-brightness">
          <div className="settings-inline-slider">
            <Slider id="settings-brightness" label="Display brightness" min={0.35} max={1} value={brightness} onChange={(v) => update({ brightness: v })} />
          </div>
        </MacRow>
      </MacGroup>
      <MacGroup title="Dock">
        <MacRow label="Magnification" detail="Icons grow as the pointer moves across the Dock.">
          <Switch label="Dock magnification" checked={magnify} onChange={(v) => update({ dockMagnification: v })} />
        </MacRow>
      </MacGroup>
    </>
  )
}

/* ── Wallpaper ────────────────────────────────────────────────────────── */

export function WallpaperPane({ platform }: P) {
  const current = useSettings((s) => s.wallpaper)
  const update = useSettings((s) => s.update)
  const wp = WALLPAPERS.find((w) => w.id === current) ?? WALLPAPERS[0]

  const grid = (
    <div className={`settings-wallgrid settings-wallgrid--${platform}`} role="radiogroup" aria-label="Wallpaper">
      {WALLPAPERS.map((w) => (
        <button
          key={w.id}
          type="button"
          role="radio"
          aria-checked={current === w.id}
          className={`settings-wall${current === w.id ? ' is-on' : ''}`}
          onClick={() => {
            update({ wallpaper: w.id })
            playSound('click')
          }}
        >
          <span className="settings-wall__img" style={{ backgroundImage: `url("${asset(w.src)}")`, backgroundColor: w.tint }} />
          <span className="settings-wall__name">{w.name}</span>
        </button>
      ))}
    </div>
  )

  if (platform === 'ios') {
    return (
      <>
        <div className="settings-iosphones">
          <div className="settings-iosphone" style={{ backgroundImage: `url("${asset(wp.src)}")`, backgroundColor: wp.tint }}>
            <span className="settings-iosphone__date">Tuesday 28 October</span>
            <span className="settings-iosphone__clock">9:41</span>
          </div>
          <div className="settings-iosphone settings-iosphone--home" style={{ backgroundImage: `url("${asset(wp.src)}")`, backgroundColor: wp.tint }}>
            {Array.from({ length: 12 }, (_, i) => (
              <span key={i} className="settings-iosphone__app" />
            ))}
          </div>
        </div>
        <IOSGroup header={`Current: ${wp.name}`}>
          <div className="settings-iospad">{grid}</div>
        </IOSGroup>
      </>
    )
  }

  return (
    <>
      <div className="settings-wallhero">
        <span className="settings-wallhero__img" style={{ backgroundImage: `url("${asset(wp.src)}")`, backgroundColor: wp.tint }} />
        <div>
          <div className="settings-wallhero__name">{wp.name}</div>
          <div className="settings-wallhero__meta">Original artwork · {wp.tone === 'dark' ? 'Dark' : 'Light'} tone</div>
        </div>
      </div>
      <MacGroup title="Wallpapers">
        <div className="settings-pad">{grid}</div>
      </MacGroup>
    </>
  )
}

/* ── Sound ────────────────────────────────────────────────────────────── */

const PREVIEW_SOUNDS: { name: SoundName; label: string }[] = [
  { name: 'click', label: 'Click' },
  { name: 'notify', label: 'Notification' },
  { name: 'open', label: 'Open app' },
  { name: 'send', label: 'Mail sent' },
  { name: 'error', label: 'Alert' },
]

export function SoundPane({ platform }: P) {
  const volume = useSettings((s) => s.volume)
  const muted = useSettings((s) => s.muted)
  const update = useSettings((s) => s.update)
  const VolIcon = muted || volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2

  if (platform === 'ios') {
    return (
      <>
        <IOSGroup header="Sound effects" footer="UI clicks, the notification chime, game sounds and the lo-fi player all use this volume.">
          <div className="settings-iosslider">
            <VolumeX size={18} aria-hidden />
            <Slider platform="ios" label="Volume" value={volume} onChange={(v) => update({ volume: v, muted: false })} />
            <Volume2 size={18} aria-hidden />
          </div>
          <IOSRow label="Mute" accessory={<Switch platform="ios" label="Mute sound effects" checked={muted} onChange={(v) => update({ muted: v })} />} />
        </IOSGroup>
        <IOSGroup header="Preview">
          {PREVIEW_SOUNDS.map((s) => (
            <IOSRow key={s.name} label={s.label} chevron={false} tinted onClick={() => playSound(s.name)} />
          ))}
        </IOSGroup>
      </>
    )
  }

  return (
    <>
      <MacGroup title="Sound effects" footer="UI clicks, the notification chime, game sounds and the lo-fi player all use this volume.">
        <MacRow label="Volume" htmlFor="settings-volume">
          <div className="settings-inline-slider">
            <VolIcon size={14} aria-hidden className="settings-dim" />
            <Slider id="settings-volume" label="Volume" value={volume} onChange={(v) => update({ volume: v, muted: false })} />
          </div>
        </MacRow>
        <MacRow label="Mute sound effects">
          <Switch label="Mute sound effects" checked={muted} onChange={(v) => update({ muted: v })} />
        </MacRow>
      </MacGroup>
      <MacGroup title="Preview">
        <div className="settings-pad settings-soundbtns">
          {PREVIEW_SOUNDS.map((s) => (
            <button key={s.name} type="button" className="btn" onClick={() => playSound(s.name)}>
              {s.label}
            </button>
          ))}
        </div>
      </MacGroup>
    </>
  )
}

/* ── Notifications ────────────────────────────────────────────────────── */

export function NotificationsPane({ platform }: P) {
  const dnd = useSettings((s) => s.dnd)
  const update = useSettings((s) => s.update)
  const footer = 'Banners stay silent while Do Not Disturb is on. Notifications still collect in Notification Center.'
  if (platform === 'ios') {
    return (
      <IOSGroup header="Focus" footer={footer}>
        <IOSRow
          icon={<span className="settings-iosicon" style={{ background: '#5e5ce6' }}><Moon size={17} fill="currentColor" /></span>}
          label="Do Not Disturb"
          accessory={<Switch platform="ios" label="Do Not Disturb" checked={dnd} onChange={(v) => update({ dnd: v })} />}
        />
      </IOSGroup>
    )
  }
  return (
    <MacGroup title="Focus" footer={footer}>
      <MacRow label="Do Not Disturb" detail="Silence notification banners and the chime.">
        <Switch label="Do Not Disturb" checked={dnd} onChange={(v) => update({ dnd: v })} />
      </MacRow>
    </MacGroup>
  )
}

/* ── Accessibility ────────────────────────────────────────────────────── */

type MotionChoice = 'system' | 'on' | 'off'

export function AccessibilityPane({ platform }: P) {
  const reduce = useSettings((s) => s.reduceMotion)
  const update = useSettings((s) => s.update)
  const os = useMediaQuery('(prefers-reduced-motion: reduce)')
  const value: MotionChoice = reduce == null ? 'system' : reduce ? 'on' : 'off'
  const set = (v: MotionChoice) => update({ reduceMotion: v === 'system' ? null : v === 'on' })
  const options = [
    { value: 'system' as const, label: 'System' },
    { value: 'on' as const, label: 'On' },
    { value: 'off' as const, label: 'Off' },
  ]
  const footer = `Turns off window, Dock and app animations. Your device currently ${os ? 'prefers' : "doesn't prefer"} reduced motion.`
  if (platform === 'ios') {
    return (
      <IOSGroup header="Reduce motion" footer={footer}>
        <div className="settings-iospad">
          <Segmented platform="ios" label="Reduce motion" options={options} value={value} onChange={set} />
        </div>
      </IOSGroup>
    )
  }
  return (
    <MacGroup title="Display" footer={footer}>
      <MacRow label="Reduce motion">
        <Segmented label="Reduce motion" options={options} value={value} onChange={set} />
      </MacRow>
    </MacGroup>
  )
}

/* ── About ────────────────────────────────────────────────────────────── */

function first(id: string, n: number) {
  return content.skills.find((g) => g.id === id)?.items.slice(0, n) ?? []
}

export function aboutSpecs(): { label: string; value: string }[] {
  const edu = content.education[0]
  const memory = [...first('languages', 2), ...first('frontend', 1), ...first('cloud', 1)].join(' · ')
  return [
    { label: 'Role', value: content.profile.headline },
    { label: 'Chip', value: 'SUTD Computer Science & Design · Minor in AI' },
    { label: 'Memory', value: memory },
    { label: 'Startup Disk', value: `${content.currentlyBuilding.title} (in progress)` },
    { label: 'Location', value: content.profile.location },
    { label: 'Graduated', value: `${edu.school.replace(/ \(SUTD\)$/, '')}, ${edu.end}` },
  ]
}

export function AboutPane({ platform }: P) {
  const { profile } = content
  const specs = aboutSpecs()
  const year = new Date().getFullYear()
  const buttons = (
    <div className="settings-about__buttons">
      <button type="button" className={platform === 'ios' ? 'settings-iosbtn' : 'btn'} onClick={() => openResume()}>
        View Resume
      </button>
      <button type="button" className={platform === 'ios' ? 'settings-iosbtn' : 'btn'} onClick={() => launch('notes', { note: 'about' })}>
        More Info…
      </button>
    </div>
  )

  if (platform === 'ios') {
    return (
      <>
        <div className="settings-about settings-about--ios">
          <img className="settings-about__photo" src={asset(profile.photo)} alt={profile.name} draggable={false} />
          <h2 className="settings-about__name">{profile.name}</h2>
          <p className="settings-about__headline">{profile.headline}</p>
        </div>
        <IOSGroup>
          <IOSRow label="Name" value={profile.name} />
          <IOSRow label="Software Version" value={VERSION_LABEL} />
          {specs.map((s) => (
            <IOSRow key={s.label} label={s.label} detail={s.value} multiline />
          ))}
        </IOSGroup>
        <IOSGroup footer={`™ and © ${year} ${profile.name}`}>
          <IOSRow label="View Resume" tinted onClick={() => openResume()} chevron={false} />
          <IOSRow label="More Info…" tinted onClick={() => launch('notes', { note: 'about' })} chevron={false} />
        </IOSGroup>
      </>
    )
  }

  return (
    <div className="settings-about">
      <img className="settings-about__photo" src={asset(profile.photo)} alt={profile.name} draggable={false} />
      <h2 className="settings-about__name">{profile.name}</h2>
      <p className="settings-about__headline">{profile.headline}</p>
      <p className="settings-about__version">{VERSION_LABEL}</p>
      <dl className="settings-about__specs">
        {specs.map((s) => (
          <div key={s.label} className="settings-about__spec">
            <dt>{s.label}</dt>
            <dd>{s.value}</dd>
          </div>
        ))}
      </dl>
      {buttons}
      <p className="settings-about__legal">
        ™ and © {year} {profile.name}. All rights reserved.
      </p>
    </div>
  )
}
