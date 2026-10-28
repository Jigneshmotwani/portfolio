import { useChat } from './chatStore'

/** "Live AI" when answers stream from the proxy, "Offline answers" for keyword search. */
export function ModeBadge() {
  const mode = useChat((s) => s.mode)
  return (
    <span
      className={`aj-badge aj-badge--${mode}`}
      title={
        mode === 'live'
          ? 'Answers stream from an AI model, grounded in this portfolio'
          : 'Answers come from a keyword search over this portfolio (no AI service connected)'
      }
    >
      <span className="aj-badge__dot" />
      {mode === 'live' ? 'Live AI' : 'Offline answers'}
    </span>
  )
}
