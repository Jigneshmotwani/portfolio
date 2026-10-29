import { useCallback, useRef, useState } from 'react'
import { SiriOverlay } from '../../apps/assistant/SiriOverlay'
import { useIOS } from '../../state/ios'
import { useSystem } from '../../state/system'
import { ControlCenter } from '../shared/ControlCenter'
import { NotificationBanners } from '../shared/NotificationBanners'
import { NotificationCenter } from '../shared/NotificationCenter'
import { Spotlight } from '../shared/Spotlight'
import { Wallpaper } from '../shared/Wallpaper'
import { useWelcomeNotification } from '../shared/welcome'
import { AppLayer } from './AppLayer'
import { HomeScreen } from './HomeScreen'
import { LockScreen } from './LockScreen'
import { StatusBar } from './StatusBar'
import './IOS.css'

/**
 * iOS shell for phones: lock screen → home screen, full-screen apps with
 * the home-indicator gesture and App Switcher, Dynamic Island, and the
 * shared system overlays (Spotlight, Control Center, notifications, Siri).
 *
 * Apps get two CSS variables on their container:
 *   --ios-safe-top     height of the status bar / Dynamic Island area
 *   --ios-safe-bottom  height of the home-indicator gesture area
 */
export default function IOS() {
  const phase = useSystem((s) => s.iosPhase)
  const setIosPhase = useSystem((s) => s.setIosPhase)
  const markLoggedIn = useSystem((s) => s.markLoggedIn)
  const active = useIOS((s) => s.active)
  const switcher = useIOS((s) => s.switcher)
  const [unlocking, setUnlocking] = useState(false)
  // The lock screen only slides in when the phone is re-locked, not on first load.
  const firstPhase = useRef(phase)
  const relocked = phase === 'lock' && firstPhase.current !== 'lock'

  useWelcomeNotification(phase === 'home')

  const onUnlockStart = useCallback(() => setUnlocking(true), [])
  const onUnlocked = useCallback(() => {
    setIosPhase('home')
    markLoggedIn()
    setUnlocking(false)
    firstPhase.current = 'home'
  }, [setIosPhase, markLoggedIn])

  const locked = phase === 'lock'
  const homeState = locked && !unlocking ? 'locked' : unlocking ? 'entering' : active || switcher ? 'behind' : 'idle'
  const tone = !locked && active && !switcher ? 'adaptive' : 'light'

  return (
    <div className="ios" data-phase={phase}>
      <Wallpaper />
      <HomeScreen state={homeState} />
      {!locked && <AppLayer />}
      {locked && <LockScreen animateIn={relocked} onUnlockStart={onUnlockStart} onUnlocked={onUnlocked} />}
      <StatusBar tone={tone} carrier={locked && !unlocking} />

      <NotificationBanners platform="ios" />
      <NotificationCenter platform="ios" />
      <ControlCenter platform="ios" />
      <Spotlight platform="ios" />
      <SiriOverlay />
    </div>
  )
}
