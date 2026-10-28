/**
 * Original app / folder / file icons, drawn as SVG strings and served as
 * data: URIs so every <img> has its own gradient ids (no clashes) and the
 * browser can cache the decoded bitmaps. Styled after macOS/iOS icons but
 * not copied from Apple assets.
 */

const svg = (viewBox: string, body: string) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}">${body}</svg>`
const lg = (id: string, stops: [number, string, number?][], x2 = 0, y2 = 1) =>
  `<linearGradient id="${id}" x1="0" y1="0" x2="${x2}" y2="${y2}">${stops
    .map(([o, c, a]) => `<stop offset="${o}" stop-color="${c}"${a != null ? ` stop-opacity="${a}"` : ''}/>`)
    .join('')}</linearGradient>`
const tile = (fill: string) =>
  `<rect width="100" height="100" rx="22.5" fill="${fill}"/><rect x=".75" y=".75" width="98.5" height="98.5" rx="21.8" fill="none" stroke="#fff" stroke-opacity=".16" stroke-width="1.5"/>`
const sheen = `<rect width="100" height="50" rx="22.5" fill="url(#sheen)" opacity=".5"/>`
const sheenDef = lg('sheen', [[0, '#fff', 0.35], [1, '#fff', 0]])

const tetrisCells: [number, number, string][] = [
  [1, 0, '#B65CFF'], [2, 0, '#B65CFF'], [3, 0, '#B65CFF'], [2, 1, '#B65CFF'],
  [0, 3, '#FF9F2E'], [1, 3, '#FF9F2E'], [3, 3, '#3DDC84'], [4, 3, '#FFD43B'], [5, 3, '#FFD43B'],
  [0, 4, '#FF9F2E'], [1, 4, '#3DDC84'], [2, 4, '#3DDC84'], [3, 4, '#3DDC84'], [4, 4, '#FFD43B'], [5, 4, '#FFD43B'],
  [0, 5, '#35C8F2'], [1, 5, '#35C8F2'], [2, 5, '#35C8F2'], [3, 5, '#35C8F2'], [4, 5, '#FF5A6E'], [5, 5, '#FF5A6E'],
]

export const appIconSvg = {
  finder: svg(
    '0 0 100 100',
    `<defs>${lg('bg', [[0, '#62CEFF'], [1, '#1474EA']])}${lg('front', [[0, '#FFFFFF'], [1, '#D9EAFF']])}${sheenDef}</defs>
    ${tile('url(#bg)')}${sheen}
    <path d="M19 33a7 7 0 0 1 7-7h14.5l6.5 6.5H74a7 7 0 0 1 7 7V70a7 7 0 0 1-7 7H26a7 7 0 0 1-7-7Z" fill="#B7DAFF"/>
    <path d="M19 44a7 7 0 0 1 7-7h48a7 7 0 0 1 7 7v27a7 7 0 0 1-7 7H26a7 7 0 0 1-7-7Z" fill="url(#front)"/>
    <circle cx="41" cy="52" r="3.2" fill="#1474EA"/><circle cx="59" cy="52" r="3.2" fill="#1474EA"/>
    <path d="M40 60.5c5.5 6 14.5 6 20 0" fill="none" stroke="#1474EA" stroke-width="4" stroke-linecap="round"/>`,
  ),
  safari: svg(
    '0 0 100 100',
    `<defs>${lg('bg', [[0, '#49C2FF'], [1, '#1560E8']])}${sheenDef}</defs>
    ${tile('url(#bg)')}${sheen}
    <circle cx="48" cy="48" r="27" fill="#fff" fill-opacity=".14" stroke="#fff" stroke-width="5"/>
    <ellipse cx="48" cy="48" rx="11.5" ry="27" fill="none" stroke="#fff" stroke-width="4"/>
    <path d="M21 48h54M26.6 35h42.8M26.6 61h42.8" stroke="#fff" stroke-width="4"/>
    <path d="M60 58l22 8.5-9 3.8-3.8 9z" fill="#FF9F0A" stroke="#fff" stroke-width="3" stroke-linejoin="round"/>`,
  ),
  mail: svg(
    '0 0 100 100',
    `<defs>${lg('bg', [[0, '#4FB2FF'], [1, '#155BE0']])}${lg('env', [[0, '#FFFFFF'], [1, '#E3EEFF']])}${sheenDef}</defs>
    ${tile('url(#bg)')}${sheen}
    <rect x="17" y="27" width="66" height="47" rx="8" fill="url(#env)"/>
    <path d="M20 31l30 23 30-23" fill="none" stroke="#8DB8FF" stroke-width="4.5" stroke-linejoin="round" stroke-linecap="round"/>
    <path d="M20 71l21-19M80 71L59 52" stroke="#C7DCFF" stroke-width="3" stroke-linecap="round"/>`,
  ),
  photos: svg(
    '0 0 100 100',
    `<defs>${lg('bg', [[0, '#FFFFFF'], [1, '#ECECF2']])}${lg('sky', [[0, '#FFC36B'], [0.6, '#FF7A8A'], [1, '#B55BFF']])}<clipPath id="c"><rect x="18" y="20" width="64" height="60" rx="11"/></clipPath></defs>
    ${tile('url(#bg)')}
    <rect x="18" y="20" width="64" height="60" rx="11" fill="url(#sky)"/>
    <g clip-path="url(#c)">
      <circle cx="64" cy="38" r="8" fill="#FFF3C9"/>
      <path d="M10 70l20-20 14 13 10-9 32 28v10H10z" fill="#25A36F"/>
      <path d="M10 76l24-14 16 9 12-6 28 14v15H10z" fill="#167D55"/>
    </g>`,
  ),
  contacts: svg(
    '0 0 100 100',
    `<defs>${lg('bg', [[0, '#FBF6EE'], [1, '#DCCFBF']])}</defs>
    ${tile('url(#bg)')}
    <rect x="80" y="20" width="9" height="14" rx="3" fill="#FF6B5E"/>
    <rect x="80" y="38" width="9" height="14" rx="3" fill="#FFB340"/>
    <rect x="80" y="56" width="9" height="14" rx="3" fill="#43C66B"/>
    <circle cx="46" cy="39" r="14" fill="#8A7663"/>
    <path d="M20 80c2-16 13-25 26-25s24 9 26 25z" fill="#8A7663"/>`,
  ),
  notes: svg(
    '0 0 100 100',
    `<defs>${lg('bg', [[0, '#FFE37A'], [1, '#F5B400']])}${sheenDef}</defs>
    ${tile('url(#bg)')}${sheen}
    <g transform="rotate(-7 48 52)">
      <rect x="22" y="18" width="52" height="66" rx="7" fill="#fff"/>
      <path d="M31 34h34M31 45h34M31 56h28M31 67h18" stroke="#E9D9A0" stroke-width="4" stroke-linecap="round"/>
    </g>
    <path d="M60 80l17-33 8 4.2-17 33-9.5 4.5z" fill="#FF7A3D"/>
    <path d="M77 47l3.2-6.2 8 4.2-3.2 6.2z" fill="#FFB8A0"/>`,
  ),
  terminal: svg(
    '0 0 100 100',
    `<defs>${lg('bg', [[0, '#3A3A3E'], [1, '#121214']])}</defs>
    ${tile('url(#bg)')}
    <rect x="8" y="8" width="84" height="12" rx="6" fill="#fff" fill-opacity=".08"/>
    <path d="M25 40l14 11.5L25 63" fill="none" stroke="#fff" stroke-width="6.5" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M45 65h24" stroke="#5CF08F" stroke-width="6.5" stroke-linecap="round"/>`,
  ),
  github: svg(
    '0 0 100 100',
    `<defs>${lg('bg', [[0, '#3B4250'], [1, '#12161D']])}</defs>
    ${tile('url(#bg)')}
    <path d="M36 36v28M68 44c0 13-13 15-27 20" fill="none" stroke="#fff" stroke-width="5.5" stroke-linecap="round"/>
    <circle cx="36" cy="29" r="7.5" fill="#12161D" stroke="#fff" stroke-width="5.5"/>
    <circle cx="36" cy="72" r="7.5" fill="#12161D" stroke="#fff" stroke-width="5.5"/>
    <circle cx="68" cy="37" r="7.5" fill="#12161D" stroke="#3FB950" stroke-width="5.5"/>`,
  ),
  settings: svg(
    '0 0 100 100',
    `<defs>${lg('bg', [[0, '#DADADF'], [1, '#8C8C93']])}${lg('gear', [[0, '#6B6B72'], [1, '#3F3F45']])}</defs>
    ${tile('url(#bg)')}
    <circle cx="50" cy="50" r="28" fill="none" stroke="url(#gear)" stroke-width="12" stroke-dasharray="7.33 7.33"/>
    <circle cx="50" cy="50" r="24" fill="url(#gear)"/>
    <circle cx="50" cy="50" r="17" fill="#B9B9C0"/>
    <circle cx="50" cy="50" r="9" fill="url(#gear)"/>`,
  ),
  assistant: svg(
    '0 0 100 100',
    `<defs>${lg('bg', [[0, '#1B1640'], [1, '#07060F']])}
      <radialGradient id="o1" cx=".3" cy=".35" r=".75"><stop offset="0" stop-color="#6EF3FF"/><stop offset="1" stop-color="#6EF3FF" stop-opacity="0"/></radialGradient>
      <radialGradient id="o2" cx=".72" cy=".38" r=".75"><stop offset="0" stop-color="#FF4FD8"/><stop offset="1" stop-color="#FF4FD8" stop-opacity="0"/></radialGradient>
      <radialGradient id="o3" cx=".5" cy=".78" r=".75"><stop offset="0" stop-color="#7B5CFF"/><stop offset="1" stop-color="#7B5CFF" stop-opacity="0"/></radialGradient>
      <radialGradient id="halo" cx=".5" cy=".5" r=".5"><stop offset=".55" stop-color="#8F7BFF" stop-opacity=".45"/><stop offset="1" stop-color="#8F7BFF" stop-opacity="0"/></radialGradient>
    </defs>
    ${tile('url(#bg)')}
    <circle cx="50" cy="50" r="40" fill="url(#halo)"/>
    <circle cx="50" cy="50" r="27" fill="#120E2B"/>
    <circle cx="50" cy="50" r="27" fill="url(#o3)"/>
    <circle cx="50" cy="50" r="27" fill="url(#o2)"/>
    <circle cx="50" cy="50" r="27" fill="url(#o1)"/>
    <ellipse cx="41" cy="37" rx="9" ry="5" fill="#fff" opacity=".4"/>`,
  ),
  tetris: svg(
    '0 0 100 100',
    `<defs>${lg('bg', [[0, '#252A55'], [1, '#0B0D22']])}${lg('hi', [[0, '#fff', 0.45], [1, '#fff', 0]])}</defs>
    ${tile('url(#bg)')}
    ${tetrisCells
      .map(
        ([c, r, color]) =>
          `<rect x="${17 + c * 11}" y="${17 + r * 11}" width="10" height="10" rx="2" fill="${color}"/><rect x="${17 + c * 11}" y="${17 + r * 11}" width="10" height="5" rx="2" fill="url(#hi)"/>`,
      )
      .join('')}`,
  ),
  chess: svg(
    '0 0 100 100',
    `<defs>${lg('bg', [[0, '#3C7A55'], [1, '#1D4A33']])}${lg('piece', [[0, '#FFFFFF'], [1, '#DCE6E0']])}</defs>
    ${tile('url(#bg)')}
    <clipPath id="tc"><rect width="100" height="100" rx="22.5"/></clipPath>
    <g fill="#fff" fill-opacity=".08" clip-path="url(#tc)">
      <rect x="0" y="0" width="25" height="25"/><rect x="50" y="0" width="25" height="25"/>
      <rect x="25" y="25" width="25" height="25"/><rect x="75" y="25" width="25" height="25"/>
      <rect x="0" y="50" width="25" height="25"/><rect x="50" y="50" width="25" height="25"/>
      <rect x="25" y="75" width="25" height="25"/><rect x="75" y="75" width="25" height="25"/>
    </g>
    <path d="M33 80h36v-5.5c0-3-2-4.8-4.6-5.6-2.6-9.8-.8-17.8 4.4-24.6 3.4-4.4 3.6-10.1.4-14.4-4.6-6.1-11.9-8.9-19.7-8.4L45.7 17l-3.3 6.4c-6.7 2.4-11.4 7.9-13.6 14.6l-5.3 9.3c-1.2 2.6.6 5.2 3.6 5.1l6.6-1.7c2.2-.3 4.2-1.5 5.8-3.1 1.5 4.3-1.1 8.6-4.9 12.5-3.4 3.5-5.4 7.7-5.6 12.5-2.6.9-4 2.9-4 5.6z" fill="url(#piece)"/>
    <circle cx="45" cy="33" r="2.6" fill="#1D4A33"/>`,
  ),
  preview: svg(
    '0 0 100 100',
    `<defs>${lg('bg', [[0, '#EAF3FF'], [1, '#BFD6F6']])}</defs>
    ${tile('url(#bg)')}
    <path d="M26 16h32l16 16v48a5 5 0 0 1-5 5H26a5 5 0 0 1-5-5V21a5 5 0 0 1 5-5z" fill="#fff"/>
    <path d="M58 16v11a5 5 0 0 0 5 5h11" fill="#DCE6F5"/>
    <path d="M30 40h28M30 49h34M30 58h22" stroke="#C8D6EC" stroke-width="4" stroke-linecap="round"/>
    <circle cx="58" cy="62" r="12" fill="#fff" fill-opacity=".5" stroke="#2F6FDB" stroke-width="5"/>
    <path d="M67 71l11 11" stroke="#2F6FDB" stroke-width="7" stroke-linecap="round"/>`,
  ),
  missioncontrol: svg(
    '0 0 100 100',
    `<defs>${lg('bg', [[0, '#7A86FF'], [1, '#3424C9']])}${sheenDef}</defs>
    ${tile('url(#bg)')}${sheen}
    <rect x="16" y="22" width="31" height="23" rx="4" fill="#fff" fill-opacity=".92"/>
    <rect x="53" y="22" width="31" height="23" rx="4" fill="#fff" fill-opacity=".72"/>
    <rect x="16" y="51" width="31" height="23" rx="4" fill="#fff" fill-opacity=".72"/>
    <rect x="53" y="51" width="31" height="23" rx="4" fill="#fff" fill-opacity=".92"/>
    <rect x="30" y="80" width="40" height="5" rx="2.5" fill="#fff" fill-opacity=".55"/>`,
  ),
  trash: svg(
    '0 0 100 100',
    `<defs>${lg('bin', [[0, '#F4F4F7', 0.95], [1, '#C9C9D0', 0.95]])}</defs>
    <path d="M21 25h58l-5.5 62a7 7 0 0 1-7 6.5h-33a7 7 0 0 1-7-6.5z" fill="url(#bin)" stroke="#A3A3AB" stroke-width="1.6"/>
    <path d="M33 31l3 57M42 31l1 58M50 31v58M58 31l-1 58M67 31l-3 57" stroke="#A3A3AB" stroke-width="1.6" opacity=".7"/>
    <ellipse cx="50" cy="25" rx="30" ry="6.5" fill="#E9E9EE" stroke="#A3A3AB" stroke-width="1.6"/>
    <ellipse cx="50" cy="25" rx="24" ry="3.6" fill="#B9B9C1"/>`,
  ),
  resume: svg(
    '0 0 100 100',
    `<defs>${lg('bg', [[0, '#FFFFFF'], [1, '#E7E7EE']])}</defs>
    ${tile('url(#bg)')}
    <rect x="24" y="14" width="52" height="72" rx="6" fill="#fff" stroke="#D5D5DD" stroke-width="2"/>
    <circle cx="36" cy="29" r="6" fill="#2F8CFF"/>
    <path d="M46 26h20M46 32h14M32 46h36M32 54h36M32 62h28M32 70h32" stroke="#C9CCD6" stroke-width="3.5" stroke-linecap="round"/>`,
  ),
} as const

export type AppIconId = keyof typeof appIconSvg

/** Folder emblems drawn on the folder's front face. */
const folderEmblems: Record<string, string> = {
  projects: `<path d="M40 40l-8 8 8 8M60 40l8 8-8 8M53 36l-6 24" fill="none" stroke="#2F7ECF" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" opacity=".85"/>`,
  resume: `<rect x="40" y="34" width="20" height="26" rx="3" fill="none" stroke="#2F7ECF" stroke-width="3.5" opacity=".85"/><path d="M45 42h10M45 48h10M45 54h6" stroke="#2F7ECF" stroke-width="3" stroke-linecap="round" opacity=".85"/>`,
  certifications: `<circle cx="50" cy="43" r="9" fill="none" stroke="#2F7ECF" stroke-width="3.8" opacity=".85"/><path d="M44 50l-3 12 9-4 9 4-3-12" fill="none" stroke="#2F7ECF" stroke-width="3.5" stroke-linejoin="round" opacity=".85"/>`,
  experience: `<rect x="35" y="40" width="30" height="20" rx="4" fill="none" stroke="#2F7ECF" stroke-width="3.8" opacity=".85"/><path d="M44 40v-4a3 3 0 0 1 3-3h6a3 3 0 0 1 3 3v4M35 49h30" fill="none" stroke="#2F7ECF" stroke-width="3.5" opacity=".85"/>`,
  notes: `<path d="M38 36h24M38 44h24M38 52h16" stroke="#2F7ECF" stroke-width="3.8" stroke-linecap="round" opacity=".85"/>`,
  photos: `<circle cx="44" cy="42" r="4" fill="#2F7ECF" opacity=".85"/><path d="M36 58l9-9 6 6 4-3 9 6" fill="none" stroke="#2F7ECF" stroke-width="3.5" stroke-linejoin="round" opacity=".85"/>`,
  education: `<path d="M50 34l18 8-18 8-18-8z" fill="none" stroke="#2F7ECF" stroke-width="3.5" stroke-linejoin="round" opacity=".85"/><path d="M38 46v8c4 4 20 4 24 0v-8" fill="none" stroke="#2F7ECF" stroke-width="3.5" opacity=".85"/>`,
  none: '',
}

export function folderSvg(emblem = 'none'): string {
  return svg(
    '0 0 100 82',
    `<defs>${lg('back', [[0, '#5EAEF0'], [1, '#3D8FE0']])}${lg('front', [[0, '#93D2FF'], [1, '#5CB0F4']])}</defs>
    <path d="M4 12a7 7 0 0 1 7-7h23.5l8 8H89a7 7 0 0 1 7 7v48a7 7 0 0 1-7 7H11a7 7 0 0 1-7-7Z" fill="url(#back)"/>
    <path d="M4 27a7 7 0 0 1 7-7h78a7 7 0 0 1 7 7v42a7 7 0 0 1-7 7H11a7 7 0 0 1-7-7Z" fill="url(#front)"/>
    <path d="M11 20.8h78" stroke="#fff" stroke-opacity=".55" stroke-width="1.5"/>
    <g transform="translate(0 2)">${folderEmblems[emblem] ?? ''}</g>`,
  )
}

export type FileKind = 'pdf' | 'doc' | 'project' | 'cert' | 'job' | 'note' | 'image' | 'text' | 'link' | 'app'

const fileBadges: Record<FileKind, string> = {
  pdf: `<rect x="14" y="58" width="52" height="20" rx="4" fill="#E5483B"/><text x="40" y="73" font-family="Helvetica, Arial, sans-serif" font-size="14" font-weight="700" text-anchor="middle" fill="#fff">PDF</text>`,
  doc: `<path d="M18 36h44M18 46h44M18 56h44M18 66h30" stroke="#C9CCD6" stroke-width="4" stroke-linecap="round"/>`,
  project: `<path d="M30 52l-9 8 9 8M50 52l9 8-9 8M43 48l-6 26" fill="none" stroke="#7C4DFF" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/>`,
  cert: `<circle cx="40" cy="52" r="12" fill="#FFC53D"/><circle cx="40" cy="52" r="6.5" fill="#FFE59A"/><path d="M33 62l-4 16 11-6 11 6-4-16" fill="#E8A317"/>`,
  job: `<rect x="20" y="50" width="40" height="27" rx="5" fill="#8B5E3C"/><path d="M33 50v-5a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3v5" fill="none" stroke="#8B5E3C" stroke-width="4"/><rect x="20" y="60" width="40" height="3" fill="#6E4A2F"/>`,
  note: `<rect x="16" y="30" width="48" height="8" rx="2" fill="#FFD43B"/><path d="M18 50h44M18 60h44M18 70h28" stroke="#D9D2B8" stroke-width="4" stroke-linecap="round"/>`,
  image: `<rect x="16" y="44" width="48" height="36" rx="5" fill="#7FC8FF"/><circle cx="50" cy="54" r="5" fill="#FFF3C9"/><path d="M16 74l14-14 10 9 8-6 16 13v4H16z" fill="#2FA36F"/>`,
  text: `<path d="M18 40h44M18 50h44M18 60h36M18 70h40" stroke="#B7BAC5" stroke-width="3.5" stroke-linecap="round"/>`,
  link: `<path d="M33 66l14-14M36 50l5-5a8 8 0 0 1 11 11l-5 5M44 68l-5 5a8 8 0 0 1-11-11l5-5" fill="none" stroke="#2F8CFF" stroke-width="4.5" stroke-linecap="round"/>`,
  app: `<rect x="22" y="42" width="36" height="36" rx="9" fill="#2F8CFF"/>`,
}

export function fileSvg(kind: FileKind): string {
  return svg(
    '0 0 80 100',
    `<path d="M10 3h43l24 24v63a7 7 0 0 1-7 7H10a7 7 0 0 1-7-7V10a7 7 0 0 1 7-7z" fill="#fff" stroke="#CBCBD3" stroke-width="2"/>
    <path d="M53 3v17a7 7 0 0 0 7 7h17" fill="#ECECF1" stroke="#CBCBD3" stroke-width="2" stroke-linejoin="round"/>
    ${fileBadges[kind]}`,
  )
}

const cache = new Map<string, string>()
export function svgUrl(markup: string): string {
  let url = cache.get(markup)
  if (!url) {
    url = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(markup.replace(/\s{2,}/g, ' '))}`
    cache.set(markup, url)
  }
  return url
}

export const appIconUrl = (id: AppIconId) => svgUrl(appIconSvg[id])
export const folderIconUrl = (emblem?: string) => svgUrl(folderSvg(emblem))
export const fileIconUrl = (kind: FileKind) => svgUrl(fileSvg(kind))
