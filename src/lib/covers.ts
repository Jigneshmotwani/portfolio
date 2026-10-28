// STUB — replaced by the web-apps agent (Safari/Photos/GitHub).
import type { Project } from '../data/types'
import { svgUrl } from '../assets/icons'

/** Generated cover art for a project (data: URI). Used until real screenshots exist. */
export function projectCoverUrl(p: Project): string {
  return svgUrl(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${p.cover.from}"/><stop offset="1" stop-color="${p.cover.to}"/></linearGradient></defs><rect width="800" height="500" fill="url(#g)"/></svg>`,
  )
}
