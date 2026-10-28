// TEMPORARY dev harness for the files agent (deleted after testing).
import { createRoot } from 'react-dom/client'
import { AppFrame } from '../../components/shared/AppFrame'
import { useThemeSync } from '../../lib/theme'
import type { AppId } from '../types'
import '../../styles/global.css'
const q = new URLSearchParams(location.search)
const platform = innerWidth >= 768 ? 'mac' : 'ios'
function H() {
  useThemeSync()
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'var(--bg)' }}>
      <AppFrame appId={(q.get('app') ?? 'preview') as AppId} instanceId="h" platform={platform} active params={{ path: q.get('path') ?? undefined, command: q.get('command') ?? undefined, nonce: 1 }} setTitle={() => {}} close={() => {}} />
    </div>
  )
}
createRoot(document.getElementById('root')!).render(<H />)
