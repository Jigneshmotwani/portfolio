// STUB — replaced by the resume agent.
import { useSystem } from '../../state/system'
export default function ResumeOverlay() {
  const close = useSystem((s) => s.closeResume)
  return (
    <div style={{ position: 'fixed', inset: 0, background: '#fff', color: '#000', zIndex: 1e6, padding: 24 }}>
      Resume (coming soon) <button onClick={close}>Close</button>
    </div>
  )
}
