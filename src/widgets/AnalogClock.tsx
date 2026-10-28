const NUMERALS = Array.from({ length: 12 }, (_, i) => i + 1)

/** SVG analog clock face. Angles come from the caller (already in the right timezone). */
export function AnalogClock({ hour, minute, second, label, numerals = true }: { hour: number; minute: number; second: number; label?: string; numerals?: boolean }) {
  const hAngle = ((hour % 12) + minute / 60) * 30
  const mAngle = (minute + second / 60) * 6
  const sAngle = second * 6
  return (
    <svg className="widget-clock" viewBox="0 0 100 100" aria-hidden="true">
      <circle className="widget-clock__face" cx="50" cy="50" r="48" />
      {Array.from({ length: 60 }, (_, i) => {
        const major = i % 5 === 0
        if (numerals && major) return null
        return (
          <line
            key={i}
            className={major ? 'widget-clock__tick widget-clock__tick--major' : 'widget-clock__tick'}
            x1="50"
            y1={major ? 6 : 5.5}
            x2="50"
            y2={major ? 13 : 8.5}
            transform={`rotate(${i * 6} 50 50)`}
          />
        )
      })}
      {numerals &&
        NUMERALS.map((n) => {
          const a = (n * Math.PI) / 6
          return (
            <text key={n} className="widget-clock__num" x={50 + Math.sin(a) * 37} y={50 - Math.cos(a) * 37} textAnchor="middle" dominantBaseline="central">
              {n}
            </text>
          )
        })}
      {label && (
        <text className="widget-clock__label" x="50" y="70" textAnchor="middle" dominantBaseline="central">
          {label}
        </text>
      )}
      <g transform={`rotate(${hAngle} 50 50)`}>
        <line className="widget-clock__hand" x1="50" y1="50" x2="50" y2="44" strokeWidth="2" />
        <line className="widget-clock__hand" x1="50" y1="44" x2="50" y2="25" strokeWidth="5" />
      </g>
      <g transform={`rotate(${mAngle} 50 50)`}>
        <line className="widget-clock__hand" x1="50" y1="50" x2="50" y2="44" strokeWidth="2" />
        <line className="widget-clock__hand" x1="50" y1="44" x2="50" y2="10" strokeWidth="4" />
      </g>
      <circle className="widget-clock__hub" cx="50" cy="50" r="3.2" />
      <g transform={`rotate(${sAngle} 50 50)`}>
        <line className="widget-clock__second" x1="50" y1="60" x2="50" y2="8" />
      </g>
      <circle className="widget-clock__second-hub" cx="50" cy="50" r="2" />
      <circle className="widget-clock__pin" cx="50" cy="50" r="0.9" />
    </svg>
  )
}
