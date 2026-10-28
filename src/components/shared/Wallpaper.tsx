import { asset } from '../../lib/assets'
import { useResolvedTheme } from '../../lib/theme'
import { useSettings, wallpaperById } from '../../state/settings'
import './Wallpaper.css'

/** Full-bleed wallpaper. `blur` for login/lock-style backdrops, `dim` for the iOS home screen. */
export function Wallpaper({ blur = false, dim = 0 }: { blur?: boolean; dim?: number }) {
  const id = useSettings((s) => s.wallpaper)
  const theme = useResolvedTheme()
  const wp = wallpaperById(id)
  const darken = (theme === 'dark' && wp.tone === 'light' ? 0.22 : 0) + dim
  return (
    <div className={`wallpaper${blur ? ' wallpaper--blur' : ''}`} aria-hidden="true">
      <div className="wallpaper__img" style={{ backgroundImage: `url("${asset(wp.src)}")`, backgroundColor: wp.tint }} />
      {darken > 0 && <div className="wallpaper__dim" style={{ opacity: darken }} />}
    </div>
  )
}
