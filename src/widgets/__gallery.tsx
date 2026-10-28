// THROWAWAY screenshot gallery — delete before finishing.
import { createRoot } from 'react-dom/client'
import '../styles/global.css'
import { useMusic } from '../state/music'
import { useIsland } from '../state/island'
import { playSound } from '../lib/sound'
import { useSettings } from '../state/settings'
import { ClockWeatherWidget, CurrentlyBuildingWidget, GitHubContributionsWidget } from './index'

Object.assign(window, { __music: useMusic, __island: useIsland, __play: playSound, __settings: useSettings })
const q = new URLSearchParams(location.search)
const theme = q.get('theme') ?? 'light'
const platform = (q.get('platform') ?? 'mac') as 'mac' | 'ios'
document.documentElement.setAttribute('data-os-theme', theme)
document.body.style.background = `url(/wallpapers/${theme === 'dark' ? 'aurora' : 'dunes'}.svg) center/cover`
document.body.style.overflow = 'auto'

const sizes = ['small', 'medium', 'large'] as const
function Cell({ children, size }: { children: React.ReactNode; size: string }) {
  if (platform === 'mac') return <div>{children}</div>
  const w = size === 'small' ? 165 : 350
  return <div style={{ width: w }}>{children}</div>
}
createRoot(document.getElementById('root')!).render(
  <div style={{ display: 'flex', flexDirection: 'column', gap: 18, padding: 18 }}>
    <button id="music" onClick={() => useMusic.getState().toggle()}>toggle music</button>
    {[ClockWeatherWidget, GitHubContributionsWidget, CurrentlyBuildingWidget].map((W, i) => (
      <div key={i} style={{ display: 'flex', gap: 18, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        {sizes.map((s) => (
          <Cell key={s} size={s}>
            <W size={s} platform={platform} />
          </Cell>
        ))}
      </div>
    ))}
  </div>,
)
