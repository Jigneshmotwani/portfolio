import { describe, expect, it } from 'vitest'
import { complete, initialState, runCommand, tokenize, type Line } from './commands'

const text = (lines: Line[]) => lines.map((l) => l.map((s) => s.text).join('')).join('\n')

describe('terminal commands', () => {
  it('tokenizes quoted arguments', () => {
    expect(tokenize('open "Projects/ross.md" -a')).toEqual(['open', 'Projects/ross.md', '-a'])
    expect(tokenize("echo 'a b'  c")).toEqual(['echo', 'a b', 'c'])
  })

  it('whoami and ls', () => {
    const st = initialState()
    expect(text(runCommand('whoami', st).lines)).toContain('Jignesh Motwani')
    const ls = text(runCommand('ls', st).lines)
    expect(ls).toContain('Projects/')
    expect(ls).toContain('about.txt')
    expect(text(runCommand('ls -la Projects', st).lines)).toContain('ross.md')
  })

  it('cd, pwd and errors', () => {
    let st = initialState()
    st = runCommand('cd projects', st).state
    expect(st.cwd).toBe('/Projects')
    expect(text(runCommand('pwd', st).lines)).toBe('/Users/jignesh/Projects')
    st = runCommand('cd ..', st).state
    expect(st.cwd).toBe('/')
    expect(text(runCommand('cd nowhere', st).lines)).toContain('no such file or directory')
    expect(text(runCommand('cd about.txt', st).lines)).toContain('not a directory')
  })

  it('cat about.txt and binary files', () => {
    const st = initialState()
    expect(text(runCommand('cat about.txt', st).lines)).toContain('Keppel')
    expect(text(runCommand('cat Resume/Jignesh_Motwani_Resume.pdf', st).lines)).toContain('binary file')
  })

  it('returns effects instead of acting', () => {
    const st = initialState()
    expect(runCommand('resume', st).effects).toEqual([{ type: 'resume' }])
    expect(runCommand('open safari', st).effects).toEqual([{ type: 'launch', appId: 'safari' }])
    expect(runCommand('open Projects', st).effects).toEqual([{ type: 'open', path: '/Projects' }])
    expect(runCommand('open https://example.com', st).effects).toEqual([{ type: 'url', url: 'https://example.com' }])
    expect(runCommand('theme dark', st).effects).toEqual([{ type: 'theme', value: 'dark' }])
    expect(runCommand('ask what cloud does he use?', st).effects).toEqual([{ type: 'ask', query: 'what cloud does he use?' }])
    expect(runCommand('clear', st).clear).toBe(true)
  })

  it('records history and reports unknown commands', () => {
    let st = initialState()
    st = runCommand('ls', st).state
    st = runCommand('foo', st).state
    expect(st.history).toEqual(['ls', 'foo'])
    expect(text(runCommand('foo', st).lines)).toContain('command not found: foo')
  })

  it('tab-completes commands and paths', () => {
    const st = initialState()
    expect(complete('neof', st).input).toBe('neofetch ')
    expect(complete('cd Pro', st).input).toBe('cd Projects/')
    expect(complete('cat Projects/ro', st).input).toBe('cat Projects/ross.md ')
    expect(complete('c', st).options.length).toBeGreaterThan(1)
  })
})
