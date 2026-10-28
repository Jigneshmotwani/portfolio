import { useCallback, useEffect, useState } from 'react'
import { useKeydown } from '../../lib/hooks'
import { useSystem } from '../../state/system'
import { useWindows } from '../../state/windows'
import { useWelcomeNotification } from '../shared/welcome'
import { Desktop } from './Desktop'
import { BootScreen, LoginScreen } from './Screens'

/** macOS shell: boot → login → desktop, plus global keyboard shortcuts. */
export default function MacOS() {
  const phase = useSystem((s) => s.macPhase)
  const setPhase = useSystem((s) => s.setMacPhase)

  // Keep the desktop (and its running apps) mounted behind the login screen after "Lock Screen".
  const [unlockedOnce, setUnlockedOnce] = useState(phase === 'desktop')

  useWelcomeNotification(phase === 'desktop')

  useEffect(() => {
    if (phase === 'desktop') {
      setUnlockedOnce(true)
      useSystem.getState().markLoggedIn()
    }
  }, [phase])

  const toLogin = useCallback(() => setPhase('login'), [setPhase])
  const toDesktop = useCallback(() => setPhase('desktop'), [setPhase])
  const lock = useCallback(() => {
    useSystem.getState().closeOverlays()
    setPhase('login')
  }, [setPhase])
  const restart = useCallback(() => {
    const st = useWindows.getState()
    for (const w of st.windows) st.close(w.id)
    useSystem.getState().closeOverlays()
    setUnlockedOnce(false)
    setPhase('boot')
  }, [setPhase])

  useKeydown((e) => {
    if (phase !== 'desktop' || e.defaultPrevented) return
    const mod = e.metaKey || e.ctrlKey
    const sys = useSystem.getState()
    if (mod && (e.code === 'Space' || e.key.toLowerCase() === 'k')) {
      e.preventDefault()
      if (sys.spotlight.open) sys.closeSpotlight()
      else sys.openSpotlight()
    } else if (e.key === 'F3' || (e.ctrlKey && e.key === 'ArrowUp')) {
      e.preventDefault()
      sys.toggleMissionControl()
    } else if (e.ctrlKey && e.metaKey && e.key.toLowerCase() === 'q') {
      e.preventDefault()
      lock()
    } else if (e.key === 'Escape') {
      if (sys.missionControl || sys.spotlight.open || sys.controlCenter || sys.notificationCenter) sys.closeOverlays()
    }
  })

  return (
    <>
      {(phase === 'desktop' || (phase === 'login' && unlockedOnce)) && <Desktop onLock={lock} onRestart={restart} />}
      {phase === 'login' && <LoginScreen onLogin={toDesktop} />}
      {phase === 'boot' && <BootScreen onDone={toLogin} />}
    </>
  )
}
