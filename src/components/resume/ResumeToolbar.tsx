import { ArrowLeft, Check, Download, ExternalLink, Link as LinkIcon, Printer } from 'lucide-react'
import { useEffect, useRef, useState, type Ref } from 'react'
import { content } from '../../data/content'
import { asset } from '../../lib/assets'

export const RESUME_SHARE_URL = `${content.site.url.replace(/\/?$/, '/')}resume/`
export const RESUME_PDF_NAME = `${content.profile.name.replace(/\s+/g, '_')}_Resume.pdf`

/** Copies text to the clipboard; resolves false when the browser refuses. */
async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}

interface ToolbarProps {
  variant: 'overlay' | 'page'
  onBack?: () => void
  backRef?: Ref<HTMLButtonElement>
  pdfHref?: string
}

/** Slim action bar shared by the in-app overlay and the standalone /resume/ page. */
export function ResumeToolbar({ variant, onBack, backRef, pdfHref = asset(content.site.resumePdf) }: ToolbarProps) {
  const [copied, setCopied] = useState<'idle' | 'done' | 'manual'>('idle')
  const manualRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (copied === 'manual') manualRef.current?.select()
    if (copied !== 'done') return
    const t = window.setTimeout(() => setCopied('idle'), 1800)
    return () => window.clearTimeout(t)
  }, [copied])

  const onCopy = async () => setCopied((await copyText(RESUME_SHARE_URL)) ? 'done' : 'manual')

  return (
    <div className="resume-toolbar" role="toolbar" aria-label="Resume actions">
      <div className="resume-toolbar__start">
        {variant === 'overlay' ? (
          <button ref={backRef} type="button" className="resume-btn resume-btn--ghost" onClick={onBack}>
            <ArrowLeft size={16} aria-hidden="true" />
            <span>
              Back<span className="resume-toolbar__wide"> to portfolio</span>
            </span>
          </button>
        ) : (
          <a className="resume-btn resume-btn--ghost" href="../">
            <ArrowLeft size={16} aria-hidden="true" />
            <span className="resume-toolbar__wide">Open interactive portfolio</span>
            <span className="resume-toolbar__narrow">Portfolio</span>
          </a>
        )}
      </div>
      <div className="resume-toolbar__title" aria-hidden="true">
        {content.profile.name} · Resume
      </div>
      <div className="resume-toolbar__end">
        {copied === 'manual' && (
          <input
            ref={manualRef}
            className="resume-toolbar__manual"
            readOnly
            value={RESUME_SHARE_URL}
            aria-label="Resume link"
            onBlur={() => setCopied('idle')}
          />
        )}
        <button
          type="button"
          className="resume-btn resume-btn--ghost"
          onClick={onCopy}
          aria-label={copied === 'done' ? 'Link copied' : 'Copy link to this resume'}
          title="Copy link"
        >
          {copied === 'done' ? <Check size={16} aria-hidden="true" /> : <LinkIcon size={16} aria-hidden="true" />}
          <span className="resume-toolbar__wide" aria-hidden="true">
            {copied === 'done' ? 'Copied' : 'Copy link'}
          </span>
        </button>
        <button
          type="button"
          className="resume-btn resume-btn--ghost resume-toolbar__print"
          onClick={() => window.print()}
          aria-label="Print"
          title="Print"
        >
          <Printer size={16} aria-hidden="true" />
          <span className="resume-toolbar__wide" aria-hidden="true">
            Print
          </span>
        </button>
        <a className="resume-btn resume-btn--primary" href={pdfHref} download={RESUME_PDF_NAME}>
          <Download size={16} aria-hidden="true" />
          <span>
            <span className="resume-toolbar__wide">Download </span>PDF
          </span>
        </a>
        {variant === 'page' && (
          <a
            className="resume-btn resume-btn--ghost resume-toolbar__extra"
            href={content.contact.linkedin}
            target="_blank"
            rel="noreferrer"
            aria-label="LinkedIn profile"
            title="LinkedIn"
          >
            <ExternalLink size={16} aria-hidden="true" />
            <span className="resume-toolbar__wide" aria-hidden="true">
              LinkedIn
            </span>
          </a>
        )}
      </div>
    </div>
  )
}
