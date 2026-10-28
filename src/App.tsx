import { lazy, Suspense, useEffect } from 'react'
import { apps } from './apps/registry'
import type { AppId } from './apps/types'
import { AppFrame } from './components/shared/AppFrame'
import { launch } from './lib/launch'
import { usePlatform } from './lib/platform'
import { unlockAudio } from './lib/sound'
import { useThemeSync } from './lib/theme'
import { useSettings } from './state/settings'
import { startupParams, useSystem } from './state/system'
import './App.css'

const MacOS = lazy(() => import('./components/macos/MacOS'))
const IOS = lazy(() => import('./components/ios/IOS'))
const ResumeOverlay = lazy(() => import('./components/resume/ResumeOverlay'))

const isAppId = (v: string | null): v is AppId => !!v && v in apps

export default function App() {
  useThemeSync()
  const platform = usePlatform()
  const resumeOpen = useSystem((s) => s.resumeOpen)
  const brightness = useSettings((s) => s.brightness)

  useEffect(() => {
    const unlock = () => unlockAudio()
    window.addEventListener('pointerdown', unlock, { once: true, capture: true })
    window.addEventListener('keydown', unlock, { once: true, capture: true })
    // Deep links: #resume opens the plain resume, ?open=<app> launches an app.
    if (window.location.hash === '#resume') useSystem.getState().openResume()
    if (isAppId(startupParams.open)) {
      const id = startupParams.open
      window.setTimeout(() => launch(id), 400)
    }
    return () => {
      window.removeEventListener('pointerdown', unlock, { capture: true })
      window.removeEventListener('keydown', unlock, { capture: true })
    }
  }, [])

  if (isAppId(startupParams.harness)) return <Harness appId={startupParams.harness} platform={platform} />

  return (
    <div className={`os os--${platform}`}>
      <Suspense fallback={<div className="os__loading" />}>{platform === 'mac' ? <MacOS /> : <IOS />}</Suspense>
      {resumeOpen && (
        <Suspense fallback={null}>
          <ResumeOverlay />
        </Suspense>
      )}
      {brightness < 1 && <div className="os__brightness" style={{ opacity: (1 - brightness) * 0.8 }} />}
    </div>
  )
}

const noop = () => {}

/** Dev helper: ?harness=<appId> renders one app full-page without a shell. */
function Harness({ appId, platform }: { appId: AppId; platform: 'mac' | 'ios' }) {
  return (
    <div className="os__harness">
      <AppFrame appId={appId} instanceId={`harness-${appId}`} platform={platform} active params={undefined} setTitle={noop} close={noop} />
    </div>
  )
}
