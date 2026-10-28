// STUB — replaced by the agent that owns this app.
import { useApp } from '../types'
import { apps } from '../registry'
export default function App() {
  const { appId } = useApp()
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', background: 'var(--bg)', color: 'var(--fg-secondary)' }}>
      {apps[appId].name} is coming soon.
    </div>
  )
}
