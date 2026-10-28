import type { WeatherIconId } from './weather'

const SUN = '#FFD43B'
const CLOUD = '#FFFFFF'
const CLOUD_SHADE = '#DCE4EE'
const DROP = '#6CCBFF'

function Cloud({ dx = 0, dy = 0, scale = 1, shade = false }: { dx?: number; dy?: number; scale?: number; shade?: boolean }) {
  return (
    <path
      transform={`translate(${dx} ${dy}) scale(${scale})`}
      d="M9 27a7 7 0 0 1 .8-14A9.5 9.5 0 0 1 28 10.6 6.8 6.8 0 0 1 31 27z"
      fill={shade ? CLOUD_SHADE : CLOUD}
    />
  )
}

function Sun({ cx = 18, cy = 18, r = 7 }: { cx?: number; cy?: number; r?: number }) {
  const rays = Array.from({ length: 8 }, (_, i) => {
    const a = (i * Math.PI) / 4
    const x1 = cx + Math.cos(a) * (r + 3.2)
    const y1 = cy + Math.sin(a) * (r + 3.2)
    const x2 = cx + Math.cos(a) * (r + 6.4)
    const y2 = cy + Math.sin(a) * (r + 6.4)
    return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={SUN} strokeWidth="2.4" strokeLinecap="round" />
  })
  return (
    <g>
      {rays}
      <circle cx={cx} cy={cy} r={r} fill={SUN} />
    </g>
  )
}

function Moon({ dx = 0, dy = 0, scale = 1 }: { dx?: number; dy?: number; scale?: number }) {
  return <path transform={`translate(${dx} ${dy}) scale(${scale})`} d="M22 6.5A11.5 11.5 0 1 0 30 26 9.5 9.5 0 0 1 22 6.5z" fill="#F5F0D8" />
}

function Drops({ n, long = true }: { n: number; long?: boolean }) {
  const xs = n === 2 ? [14, 22] : [11, 18, 25]
  return (
    <g stroke={DROP} strokeWidth="2.4" strokeLinecap="round">
      {xs.map((x) => (
        <line key={x} x1={x} y1="29.5" x2={x - 2} y2={long ? 35 : 32.5} />
      ))}
    </g>
  )
}

/** Hand-drawn weather glyphs (36×36 viewBox). Decorative: pair with a text label. */
export function WeatherIcon({ icon, size = 24 }: { icon: WeatherIconId; size?: number }) {
  let body
  switch (icon) {
    case 'sun':
      body = <Sun />
      break
    case 'moon':
      body = <Moon />
      break
    case 'partly-day':
      body = (
        <>
          <Sun cx={13} cy={13} r={6} />
          <Cloud dx={4} dy={6} scale={0.86} />
        </>
      )
      break
    case 'partly-night':
      body = (
        <>
          <Moon dx={-4} dy={-3} scale={0.8} />
          <Cloud dx={4} dy={6} scale={0.86} />
        </>
      )
      break
    case 'cloud':
      body = (
        <>
          <Cloud dx={6} dy={-3} scale={0.72} shade />
          <Cloud dy={4} />
        </>
      )
      break
    case 'fog':
      body = (
        <>
          <Cloud dy={-2} scale={0.95} shade />
          <g stroke={CLOUD} strokeWidth="2.6" strokeLinecap="round">
            <line x1="6" y1="28" x2="30" y2="28" />
            <line x1="10" y1="33" x2="26" y2="33" />
          </g>
        </>
      )
      break
    case 'drizzle':
      body = (
        <>
          <Cloud dy={-1} />
          <Drops n={2} long={false} />
        </>
      )
      break
    case 'rain':
      body = (
        <>
          <Cloud dy={-1} />
          <Drops n={3} />
        </>
      )
      break
    case 'storm':
      body = (
        <>
          <Cloud dy={-2} shade />
          <path d="M19 24l-5 7h4.5l-2.5 5.5 7-8h-4.5l2.5-4.5z" fill={SUN} />
        </>
      )
      break
    case 'snow':
      body = (
        <>
          <Cloud dy={-1} />
          <g fill={CLOUD}>
            <circle cx="12" cy="31.5" r="1.7" />
            <circle cx="18" cy="34" r="1.7" />
            <circle cx="24" cy="31.5" r="1.7" />
          </g>
        </>
      )
      break
  }
  return (
    <svg className="widget-wicon" viewBox="0 0 36 36" width={size} height={size} aria-hidden="true">
      {body}
    </svg>
  )
}
