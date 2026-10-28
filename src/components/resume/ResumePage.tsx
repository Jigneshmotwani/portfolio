import { ResumeDocument } from './ResumeDocument'
import { ResumeToolbar } from './ResumeToolbar'
import './Resume.css'

/** Standalone /resume/ page. `?print` hides the toolbar (used by the PDF generator). */
export function ResumePage() {
  const printMode = new URLSearchParams(window.location.search).has('print')
  return (
    <div className={`resume-shell resume-page${printMode ? ' resume-page--print' : ''}`}>
      {!printMode && <ResumeToolbar variant="page" pdfHref="../resume.pdf" />}
      <main className="resume-stage">
        <ResumeDocument className="resume-sheet" />
      </main>
    </div>
  )
}
