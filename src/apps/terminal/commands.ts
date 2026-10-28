/**
 * Pure command interpreter for the Terminal app. `runCommand` never touches
 * the DOM or stores: it returns output lines plus "effects" that the UI
 * applies (open an app, change theme, ...), which keeps it unit-testable.
 */
import { apps, appList } from '../registry'
import type { AppId, AppParams } from '../types'
import { content } from '../../data/content'
import { WALLPAPERS } from '../../state/settings'
import { formatRange, hostOf } from '../../lib/format'
import {
  displayPath,
  getNode,
  HOME_PREFIX,
  listDir,
  nodeText,
  normalizePath,
  resolvePath,
  formatModified,
  type VfsNode,
} from '../../data/vfs'

export type Tone = 'dim' | 'accent' | 'green' | 'blue' | 'yellow' | 'red' | 'magenta' | 'cyan' | 'bold'

export interface Seg {
  text: string
  tone?: Tone
  /** External link (http / mailto). */
  href?: string
  /** Clicking runs this command. */
  cmd?: string
}

export type Line = Seg[]

export type Effect =
  | { type: 'launch'; appId: AppId; params?: AppParams }
  | { type: 'open'; path: string }
  | { type: 'url'; url: string }
  | { type: 'resume' }
  | { type: 'theme'; value: 'light' | 'dark' | 'auto' }
  | { type: 'wallpaper'; id: string }
  | { type: 'ask'; query: string }
  | { type: 'close' }

export interface TermState {
  cwd: string
  history: string[]
}

export interface CommandResult {
  lines: Line[]
  state: TermState
  effects: Effect[]
  clear?: boolean
}

export const initialState = (): TermState => ({ cwd: '/', history: [] })

const s = (text: string, tone?: Tone): Seg => ({ text, tone })
const line = (...segs: (Seg | string)[]): Line => segs.map((x) => (typeof x === 'string' ? { text: x } : x))
const isTodo = (v?: string) => !!v && /^\s*TODO\b/i.test(v)
const real = (items: string[]) => items.filter((i) => !isTodo(i))

interface CommandDef {
  usage: string
  help: string
  run: (args: string[], st: TermState, raw: string) => Omit<CommandResult, 'state'> & { state?: TermState }
}

const out = (lines: Line[], effects: Effect[] = []) => ({ lines, effects })
const err = (msg: string) => out([line(s(msg, 'red'))])

function link(url: string, label?: string): Seg {
  return { text: label ?? url, href: url, tone: 'blue' }
}

function nodeSeg(n: VfsNode): Seg {
  if (n.type === 'folder') return { text: `${n.name}/`, tone: 'blue', cmd: `cd ${quote(n.path)}` }
  if (n.ref?.type === 'app') return { text: n.name, tone: 'green' }
  return { text: n.name, cmd: n.kind === 'pdf' ? `open ${quote(n.path)}` : `cat ${quote(n.path)}` }
}

function quote(p: string) {
  return /\s/.test(p) ? `"${p}"` : p
}

/** Splits a command line into words, honouring "double" and 'single' quotes. */
export function tokenize(input: string): string[] {
  const words: string[] = []
  let cur = ''
  let q: string | null = null
  let has = false
  for (const ch of input) {
    if (q) {
      if (ch === q) q = null
      else cur += ch
    } else if (ch === '"' || ch === "'") {
      q = ch
      has = true
    } else if (/\s/.test(ch)) {
      if (cur || has) words.push(cur)
      cur = ''
      has = false
    } else {
      cur += ch
    }
  }
  if (cur || has) words.push(cur)
  return words
}

function findApp(name: string): AppId | null {
  const n = name.toLowerCase().replace(/\.app$/, '')
  const hit = appList.find(
    (a) => a.id === n || a.name.toLowerCase() === n || (a.iosName ?? '').toLowerCase() === n || a.name.toLowerCase().replace(/\s+/g, '') === n,
  )
  return hit ? hit.id : null
}

function lsLong(n: VfsNode): Line {
  const perms = n.type === 'folder' ? 'drwxr-xr-x' : '-rw-r--r--'
  const size = (n.type === 'folder' ? `${n.children?.length ?? 0}` : (n.size ?? '0')).padStart(10)
  return line(s(perms, 'dim'), `  jignesh  staff ${size}  `, s(formatModified(n.modified).padEnd(12), 'dim'), ' ', nodeSeg(n))
}

function tree(node: VfsNode, prefix = '', depth = 0, lines: Line[] = []): Line[] {
  const kids = node.children ?? []
  kids.forEach((k, i) => {
    const last = i === kids.length - 1
    lines.push(line(s(`${prefix}${last ? '└── ' : '├── '}`, 'dim'), nodeSeg(k)))
    if (k.type === 'folder' && depth < 2) tree(k, `${prefix}${last ? '    ' : '│   '}`, depth + 1, lines)
  })
  return lines
}

const LOGO = [
  '        ▄██▄    ',
  '        ▀██▀    ',
  '                ',
  '        ████    ',
  '        ████    ',
  '        ████    ',
  '        ████    ',
  '  ▄▄    ████    ',
  '  ▀██▄▄▄███▀    ',
  '    ▀▀▀▀▀▀      ',
]

const COMMANDS: Record<string, CommandDef> = {
  help: {
    usage: 'help',
    help: 'List available commands',
    run: () => {
      const rows = Object.entries(COMMANDS)
        .filter(([name]) => !HIDDEN.has(name))
        .map(([name, def]) => line({ text: name.padEnd(12), tone: 'green', cmd: name }, s(def.help, 'dim')))
      return out([
        line(s('JigneshOS shell', 'bold'), s(' — click a command or type it.', 'dim')),
        ...rows,
        line(),
        line(s('Tip: ', 'dim'), 'Tab completes, ↑/↓ browse history, Ctrl+L clears.'),
      ])
    },
  },
  whoami: {
    usage: 'whoami',
    help: 'Who is Jignesh?',
    run: () =>
      out([
        line(s(content.profile.name, 'bold'), s(` — ${content.profile.headline}`, 'accent')),
        line(s(`${content.profile.location} · ${content.profile.tagline}`, 'dim')),
      ]),
  },
  about: {
    usage: 'about',
    help: 'Read about.txt',
    run: (_a, st) => COMMANDS.cat.run(['~/about.txt'], st, 'cat ~/about.txt'),
  },
  ls: {
    usage: 'ls [-la] [path]',
    help: 'List files',
    run: (args, st) => {
      const flags = args.filter((a) => a.startsWith('-')).join('')
      const target = args.find((a) => !a.startsWith('-')) ?? '.'
      const path = resolvePath(st.cwd, target)
      if (!path) return err(`ls: ${target}: No such file or directory`)
      const node = getNode(path)!
      const items = node.type === 'folder' ? (node.children ?? []) : [node]
      if (flags.includes('l')) return out([line(s(`total ${items.length}`, 'dim')), ...items.map(lsLong)])
      const segs: Seg[] = []
      items.forEach((n, i) => {
        if (i) segs.push(s('   '))
        segs.push(nodeSeg(n))
      })
      return out(items.length ? [segs] : [])
    },
  },
  cd: {
    usage: 'cd [path]',
    help: 'Change directory',
    run: (args, st) => {
      const target = args[0] ?? '~'
      const path = resolvePath(st.cwd, target)
      if (!path) return err(`cd: no such file or directory: ${target}`)
      if (getNode(path)!.type !== 'folder') return err(`cd: not a directory: ${target}`)
      return { lines: [], effects: [], state: { ...st, cwd: path } }
    },
  },
  pwd: {
    usage: 'pwd',
    help: 'Print working directory',
    run: (_a, st) => out([line(st.cwd === '/' ? HOME_PREFIX : `${HOME_PREFIX}${st.cwd}`)]),
  },
  cat: {
    usage: 'cat <file>',
    help: 'Print a file',
    run: (args, st) => {
      if (!args.length) return err('usage: cat <file>')
      const lines: Line[] = []
      for (const a of args) {
        const path = resolvePath(st.cwd, a)
        if (!path) {
          lines.push(line(s(`cat: ${a}: No such file or directory`, 'red')))
          continue
        }
        const node = getNode(path)!
        if (node.type === 'folder') {
          lines.push(line(s(`cat: ${a}: Is a directory`, 'red')))
          continue
        }
        const text = nodeText(node)
        if (text == null) {
          lines.push(line(s(`cat: ${node.name}: binary file — try `, 'yellow'), { text: `open ${quote(node.path)}`, tone: 'green', cmd: `open ${quote(node.path)}` }))
          continue
        }
        for (const l of text.split('\n')) lines.push(textLine(l))
      }
      return out(lines)
    },
  },
  tree: {
    usage: 'tree [path]',
    help: 'Show the folder tree',
    run: (args, st) => {
      const path = resolvePath(st.cwd, args[0] ?? '.')
      if (!path) return err(`tree: ${args[0]}: No such file or directory`)
      const node = getNode(path)!
      return out([line(s(displayPath(path), 'blue')), ...tree(node)])
    },
  },
  projects: {
    usage: 'projects',
    help: 'List projects',
    run: () =>
      out(
        content.projects.flatMap((p) => [
          line({ text: p.name, tone: 'green', cmd: `cat ~/Projects/${p.id}.md` }, s(` (${p.year}) `, 'dim'), p.tagline),
          line(s(`  ${p.tech.slice(0, 6).join(' · ')}`, 'dim'), ...(p.links.github ? [s('  '), link(p.links.github, hostOf(p.links.github) + new URL(p.links.github).pathname)] : [])),
        ]),
      ),
  },
  skills: {
    usage: 'skills',
    help: 'List skills',
    run: () => out(content.skills.flatMap((g) => [line(s(g.name, 'accent')), line(s('  '), real(g.items).join(', '))])),
  },
  experience: {
    usage: 'experience',
    help: 'Work history',
    run: () =>
      out(
        content.experience.flatMap((e) => [
          line({ text: e.role, tone: 'bold', cmd: `cat ~/Experience/${e.id}.md` }, s(' @ '), s(e.company, 'green')),
          line(s(`  ${formatRange(e.start, e.end)}${e.location ? ` · ${e.location}` : ''}`, 'dim')),
        ]),
      ),
  },
  education: {
    usage: 'education',
    help: 'Education',
    run: () =>
      out(
        content.education.flatMap((ed) => [
          line(s(ed.school, 'bold')),
          line(s(`  ${ed.degree} · ${ed.start.slice(0, 4)}–${ed.end.slice(0, 4)}`, 'dim')),
        ]),
      ),
  },
  certs: {
    usage: 'certs',
    help: 'Certifications and awards',
    run: () =>
      out(
        content.credentials.map((c) =>
          line(s(c.kind === 'Certification' ? '🎓 ' : '🏆 '), s(c.name, 'bold'), s(` — ${isTodo(c.issuer) ? '' : c.issuer}${isTodo(c.date) ? '' : ` (${c.date})`}`, 'dim')),
        ),
      ),
  },
  contact: {
    usage: 'contact',
    help: 'How to reach Jignesh',
    run: () => {
      const c = content.contact
      const rows: Line[] = [
        line(s('Email     ', 'dim'), link(`mailto:${c.email}`, c.email)),
        line(s('LinkedIn  ', 'dim'), link(c.linkedin, hostOf(c.linkedin) + new URL(c.linkedin).pathname)),
        line(s('GitHub    ', 'dim'), link(c.github, hostOf(c.github) + new URL(c.github).pathname)),
        line(s('Location  ', 'dim'), content.profile.location),
      ]
      return out([...rows, line(s('Try ', 'dim'), { text: 'open mail', tone: 'green', cmd: 'open mail' }, s(' to write him a message.', 'dim'))])
    },
  },
  resume: {
    usage: 'resume',
    help: 'Open the one-page resume',
    run: () => out([line(s('Opening resume…', 'dim'))], [{ type: 'resume' }]),
  },
  open: {
    usage: 'open <app | path | url>',
    help: 'Open an app, file, folder or URL',
    run: (args, st) => {
      const rest = args.filter((a) => a !== '-a')
      const target = rest.join(' ')
      if (!target) return err('usage: open <app | path | url>')
      if (/^(https?:|mailto:|jignesh:)/i.test(target)) return out([line(s(`Opening ${target}…`, 'dim'))], [{ type: 'url', url: target }])
      const path = resolvePath(st.cwd, target)
      if (path && !args.includes('-a')) {
        const node = getNode(path)!
        if (node.ref?.type === 'app') return out([], [{ type: 'launch', appId: node.ref.id }])
        return out([line(s(`Opening ${node.label}…`, 'dim'))], [{ type: 'open', path }])
      }
      const app = findApp(target)
      if (app) return out([line(s(`Opening ${apps[app].name}…`, 'dim'))], [{ type: 'launch', appId: app }])
      return err(`The file ${normalizePath(st.cwd, target)} does not exist.`)
    },
  },
  github: {
    usage: 'github',
    help: 'Open the GitHub app',
    run: () => out([line(s('Opening GitHub… ', 'dim'), link(content.contact.github))], [{ type: 'launch', appId: 'github' }]),
  },
  ask: {
    usage: 'ask <question>',
    help: 'Ask the AI assistant about Jignesh',
    run: (_a, _st, raw) => {
      const q = raw.replace(/^\s*ask\s*/i, '').trim()
      if (!q) return err('usage: ask <question>   e.g. ask what does he do at Keppel?')
      return out([line(s('Asking Ask Jignesh… ', 'dim'), s(q, 'accent'))], [{ type: 'ask', query: q }])
    },
  },
  theme: {
    usage: 'theme <light|dark|auto>',
    help: 'Switch appearance',
    run: (args) => {
      const v = args[0]?.toLowerCase()
      if (v !== 'light' && v !== 'dark' && v !== 'auto') return err('usage: theme <light|dark|auto>')
      return out([line(s(`Appearance set to ${v}.`, 'dim'))], [{ type: 'theme', value: v }])
    },
  },
  wallpaper: {
    usage: 'wallpaper [name]',
    help: 'List or set the wallpaper',
    run: (args) => {
      const ids = WALLPAPERS.map((w) => w.id)
      if (!args[0]) return out([line(s('Wallpapers: ', 'dim'), ...ids.flatMap((id, i) => [...(i ? [s(', ', 'dim')] : []), { text: id, tone: 'green' as Tone, cmd: `wallpaper ${id}` }]))])
      const id = args[0].toLowerCase()
      if (!ids.includes(id as (typeof ids)[number])) return err(`wallpaper: unknown wallpaper "${args[0]}". Try: ${ids.join(', ')}`)
      return out([line(s(`Wallpaper set to ${id}.`, 'dim'))], [{ type: 'wallpaper', id }])
    },
  },
  history: {
    usage: 'history',
    help: 'Show command history',
    run: (_a, st) => out(st.history.map((h, i) => line(s(String(i + 1).padStart(4) + '  ', 'dim'), h))),
  },
  echo: {
    usage: 'echo <text>',
    help: 'Print text',
    run: (args) => out([line(args.join(' '))]),
  },
  date: {
    usage: 'date',
    help: 'Show the date (Singapore time)',
    run: () =>
      out([
        line(
          new Date().toLocaleString('en-US', {
            timeZone: content.profile.timezone,
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            year: 'numeric',
            timeZoneName: 'short',
          }),
        ),
      ]),
  },
  neofetch: {
    usage: 'neofetch',
    help: 'System info, with style',
    run: () => {
      const p = content.profile
      const sutd = content.education[0]
      const info: [string, string][] = [
        ['OS', 'JigneshOS 26 (Singapore)'],
        ['Host', p.headline],
        ['Kernel', `${sutd.degree.replace('Bachelor of Engineering, ', 'B.Eng ')}`],
        ['Uptime', `${new Date().getFullYear() - 2021} years in tech`],
        ['Packages', `${content.projects.length} projects, ${content.credentials.length} credentials`],
        ['Shell', 'jsh 1.0'],
        ['Languages', real(content.skills.find((g) => g.id === 'languages')?.items ?? []).slice(0, 5).join(', ')],
        ['Cloud', 'Azure, AWS, Supabase, Firebase'],
        ['Location', p.location],
      ]
      const rows: Line[] = []
      const total = Math.max(LOGO.length, info.length + 2)
      for (let i = 0; i < total; i++) {
        const logo = s((LOGO[i] ?? ' '.repeat(16)) + '  ', 'accent')
        if (i === 0) rows.push(line(logo, s('jignesh', 'accent'), '@', s('portfolio', 'accent')))
        else if (i === 1) rows.push(line(logo, s('-----------------', 'dim')))
        else if (info[i - 2]) rows.push(line(logo, s(`${info[i - 2][0]}: `, 'accent'), info[i - 2][1]))
        else rows.push(line(logo))
      }
      rows.push(line(s(' '.repeat(18)), ...(['red', 'yellow', 'green', 'cyan', 'blue', 'magenta'] as Tone[]).map((t) => s('███', t))))
      return out(rows)
    },
  },
  clear: {
    usage: 'clear',
    help: 'Clear the screen',
    run: () => ({ lines: [], effects: [], clear: true }),
  },
  sudo: {
    usage: 'sudo <command>',
    help: 'Become root (good luck)',
    run: (args) =>
      out([
        line(s('[sudo] password for visitor: ', 'dim'), s('********', 'dim')),
        line(s(`visitor is not in the sudoers file. This incident will be reported${args.length ? ` (you tried: ${args.join(' ')})` : ''}. 😄`, 'yellow')),
      ]),
  },
  man: {
    usage: 'man <command>',
    help: 'Show help for a command',
    run: (args) => {
      const def = args[0] && COMMANDS[args[0]]
      if (!def) return err(args[0] ? `No manual entry for ${args[0]}` : 'What manual page do you want? Try: man ls')
      return out([line(s(args[0].toUpperCase(), 'bold'), s(` — ${def.help}`)), line(s('Usage: ', 'dim'), def.usage)])
    },
  },
  exit: {
    usage: 'exit',
    help: 'Close Terminal',
    run: () => out([line(s('[Process completed]', 'dim'))], [{ type: 'close' }]),
  },
}

const ALIASES: Record<string, string> = { ll: 'ls -la', la: 'ls -a', dir: 'ls', cls: 'clear', '?': 'help', certifications: 'certs', work: 'experience', quit: 'exit' }
const HIDDEN = new Set(['man'])

export const commandNames = Object.keys(COMMANDS)

/** Renders a text line with URLs as links and markdown headings highlighted. */
function textLine(l: string): Line {
  if (/^#\s/.test(l)) return line(s(l.replace(/^#\s/, ''), 'bold'))
  const segs: Seg[] = []
  let last = 0
  for (const m of l.matchAll(/https?:\/\/[^\s)]+|[\w.+-]+@[\w-]+\.[\w.]+/g)) {
    if (m.index! > last) segs.push(s(l.slice(last, m.index)))
    const url = m[0].includes('@') && !m[0].startsWith('http') ? `mailto:${m[0]}` : m[0]
    segs.push(link(url, m[0]))
    last = m.index! + m[0].length
  }
  if (last < l.length || !segs.length) segs.push(s(l.slice(last)))
  return segs
}

export function runCommand(input: string, state: TermState): CommandResult {
  const trimmed = input.trim()
  const history = trimmed ? [...state.history, trimmed].slice(-200) : state.history
  const st = { ...state, history }
  if (!trimmed) return { lines: [], state: st, effects: [] }
  let words = tokenize(trimmed)
  const alias = ALIASES[words[0].toLowerCase()]
  if (alias) words = [...tokenize(alias), ...words.slice(1)]
  const name = words[0].toLowerCase()
  const args = words.slice(1)
  const def = COMMANDS[name]
  if (!def) {
    // Typing an app name or a path is a shortcut for `open`.
    if (findApp(trimmed)) return { ...COMMANDS.open.run([trimmed], st, trimmed), state: st }
    return {
      lines: [line(s(`zsh: command not found: ${words[0]}`, 'red')), line(s('Type ', 'dim'), { text: 'help', tone: 'green', cmd: 'help' }, s(' to see what you can do.', 'dim'))],
      state: st,
      effects: [],
    }
  }
  if (args.includes('--help') || args.includes('-h')) return { ...COMMANDS.man.run([name], st, `man ${name}`), state: st }
  const res = def.run(args, st, trimmed)
  return { lines: res.lines, effects: res.effects, clear: res.clear, state: res.state ?? st }
}

/** Tab completion: completes the last word as a command (first word) or a path. */
export function complete(input: string, state: TermState): { input: string; options: string[] } {
  const m = /^(.*?)(\S*)$/.exec(input)!
  const before = m[1]
  const word = m[2]
  const first = before.trim() === ''
  let candidates: string[]
  if (first) {
    candidates = [...commandNames, ...Object.keys(ALIASES)].filter((c) => c.startsWith(word.toLowerCase())).sort()
  } else {
    const slash = word.lastIndexOf('/')
    const dirPart = slash >= 0 ? word.slice(0, slash + 1) : ''
    const base = word.slice(slash + 1).toLowerCase()
    const dirPath = resolvePath(state.cwd, dirPart || '.')
    const kids = dirPath ? listDir(dirPath) : []
    const cmd = before.trim().split(/\s+/)[0]?.toLowerCase()
    const pool = cmd === 'cd' ? kids.filter((k) => k.type === 'folder') : kids
    candidates = pool.filter((k) => k.name.toLowerCase().startsWith(base)).map((k) => dirPart + k.name + (k.type === 'folder' ? '/' : ''))
    if (!dirPart && (cmd === 'open' || cmd === 'man')) {
      const extra = cmd === 'man' ? commandNames : appList.map((a) => a.id)
      candidates.push(...extra.filter((c) => c.startsWith(base)))
    }
  }
  if (!candidates.length) return { input, options: [] }
  if (candidates.length === 1) {
    const done = candidates[0]
    return { input: before + done + (done.endsWith('/') ? '' : ' '), options: [] }
  }
  // Extend to the longest common prefix.
  let prefix = candidates[0]
  for (const c of candidates) while (!c.toLowerCase().startsWith(prefix.toLowerCase())) prefix = prefix.slice(0, -1)
  return { input: before + (prefix.length > word.length ? prefix : word), options: candidates }
}

export const WELCOME: Line[] = [
  line(s(`Last login: ${new Date().toDateString()} on ttys000`, 'dim')),
  line('Welcome to ', s('JigneshOS', 'bold'), '. Type ', { text: 'help', tone: 'green', cmd: 'help' }, ' to get started, or try ', { text: 'neofetch', tone: 'green', cmd: 'neofetch' }, '.'),
]

