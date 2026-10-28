import { describe, expect, it } from 'vitest'
import { isQuestion, search } from './search'

describe('isQuestion', () => {
  it('detects question words, question marks and long phrases', () => {
    expect(isQuestion('What did he build at Keppel')).toBe(true)
    expect(isQuestion('azure?')).toBe(true)
    expect(isQuestion('tell me about quantumnft')).toBe(true)
    expect(isQuestion('projects in rust with lock free commits')).toBe(true)
    expect(isQuestion('safari')).toBe(false)
    expect(isQuestion('')).toBe(false)
  })
})

describe('search', () => {
  it('returns nothing for an empty query', () => {
    const r = search('   ', 'mac')
    expect(r.flat).toHaveLength(0)
    expect(r.ask).toBeNull()
  })

  it('finds apps by name and keyword with a top hit', () => {
    const r = search('saf', 'mac')
    expect(r.topHit?.id).toBe('app:safari')
    expect(r.askFirst).toBe(false)
    expect(r.flat[0].id).toBe('app:safari')
    expect(r.flat[1].kind).toBe('ask')
  })

  it('uses platform-specific app names', () => {
    expect(search('files', 'ios').topHit?.title).toBe('Files')
    expect(search('finder', 'mac').topHit?.title).toBe('Finder')
  })

  it('finds projects, skills, experience and folders', () => {
    expect(search('budwood', 'mac').topHit?.id).toBe('project:budwood')
    expect(search('keppel', 'mac').flat.some((x) => x.id === 'experience:keppel')).toBe(true)
    expect(search('azure', 'mac').flat.some((x) => x.kind === 'skill')).toBe(true)
    expect(search('certif', 'mac').flat.some((x) => x.id === 'folder:certifications')).toBe(true)
  })

  it('tolerates typos', () => {
    expect(search('pyhton', 'mac').flat.some((x) => x.title === 'Python')).toBe(true)
  })

  it('puts Ask Jignesh first for questions', () => {
    const r = search('What cloud platforms has he worked on?', 'mac')
    expect(r.askFirst).toBe(true)
    expect(r.flat[0].kind).toBe('ask')
    expect(r.flat[0].title).toBe('Ask Jignesh: What cloud platforms has he worked on?')
  })

  it('falls back to Ask Jignesh when nothing matches', () => {
    const r = search('qwxyz', 'mac')
    expect(r.flat).toHaveLength(1)
    expect(r.flat[0].kind).toBe('ask')
  })

  it('shows Mission Control only on mac', () => {
    expect(search('mission control', 'mac').flat.some((x) => x.id === 'action:mission-control')).toBe(true)
    expect(search('mission control', 'ios').flat.some((x) => x.id === 'action:mission-control')).toBe(false)
  })
})
