import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useSystem } from '../../state/system'
import { ResumeDocument } from './ResumeDocument'
import { ResumeToolbar } from './ResumeToolbar'
import './Resume.css'

const FOCUSABLE = 'a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])'

/**
 * The recruiter escape hatch: a plain one-page resume over everything, with
 * no OS chrome. Rendered by App while useSystem().resumeOpen is true.
 */
export default function ResumeOverlay() {
  const close = useSystem((s) => s.closeResume)
  const rootRef = useRef<HTMLDivElement>(null)
  const backRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    document.body.classList.add('resume-open')
    backRef.current?.focus()

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        e.stopPropagation()
        close()
        return
      }
      if (e.key !== 'Tab' || !rootRef.current) return
      const items = Array.from(rootRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => el.offsetParent !== null)
      if (!items.length) return
      const first = items[0]
      const last = items[items.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      } else if (!rootRef.current.contains(document.activeElement)) {
        e.preventDefault()
        first.focus()
      }
    }
    window.addEventListener('keydown', onKey, true)
    return () => {
      window.removeEventListener('keydown', onKey, true)
      document.body.classList.remove('resume-open')
      previous?.focus?.()
    }
  }, [close])

  return createPortal(
    <div ref={rootRef} className="resume-shell resume-overlay" role="dialog" aria-modal="true" aria-label="Resume">
      <ResumeToolbar variant="overlay" onBack={close} backRef={backRef} />
      <div className="resume-stage">
        <ResumeDocument className="resume-sheet" />
      </div>
    </div>,
    document.body,
  )
}
