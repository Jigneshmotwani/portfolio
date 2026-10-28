import { describe, expect, it } from 'vitest'
import { content } from './content'
import { allNodes, displayPath, getNode, listDir, nodeText, normalizePath, parentPath, resolvePath, ROOT } from './vfs'

describe('vfs paths', () => {
  it('normalizes ~, ., .. and relative paths', () => {
    expect(normalizePath('/', '~')).toBe('/')
    expect(normalizePath('/Projects', '..')).toBe('/')
    expect(normalizePath('/Projects', '../Resume/./')).toBe('/Resume')
    expect(normalizePath('/Projects', '~/Experience')).toBe('/Experience')
    expect(normalizePath('/Projects', '/Users/jignesh/Trash')).toBe('/Trash')
    expect(normalizePath('/', '../../..')).toBe('/')
  })

  it('resolves case-insensitively to canonical paths', () => {
    expect(resolvePath('/', 'projects')).toBe('/Projects')
    expect(resolvePath('/projects', 'ROSS.MD')).toBe('/Projects/ross.md')
    expect(resolvePath('/Projects', 'budwood')).toBe('/Projects/budwood.md') // matches display label
    expect(resolvePath('/', 'nope')).toBeNull()
  })

  it('lists folders and builds parents', () => {
    expect(listDir('/').map((n) => n.name)).toContain('about.txt')
    expect(listDir('/Projects')).toHaveLength(content.projects.length)
    expect(listDir('/about.txt')).toEqual([])
    expect(parentPath('/Projects/ross.md')).toBe('/Projects')
    expect(displayPath('/Projects')).toBe('~/Projects')
  })
})

describe('vfs content', () => {
  it('has the desktop folders and the trash', () => {
    for (const name of ['Projects', 'Resume', 'Certifications', 'Experience', 'Education', 'Trash'])
      expect(getNode(`/${name}`)?.type).toBe('folder')
    expect(getNode('/Resume/Jignesh_Motwani_Resume.pdf')?.kind).toBe('pdf')
  })

  it('never leaks TODO placeholders into generated text', () => {
    // The Trash holds hand-written joke files (one is literally a TODO list).
    for (const node of allNodes(ROOT).filter((n) => !n.path.startsWith('/Trash'))) {
      const text = nodeText(node)
      if (text) expect(text, node.path).not.toMatch(/TODO/)
    }
  })

  it('generates readable text for roles and projects', () => {
    const keppel = nodeText(getNode('/Experience/keppel.md')!)
    expect(keppel).toContain('AI Engineer')
    expect(keppel).toContain('Jan 2026 – Present')
    expect(nodeText(getNode('/Projects/ross.md')!)).toContain('Tencent Hackathon 2026')
    expect(nodeText(getNode('/Resume/Jignesh_Motwani_Resume.pdf')!)).toBeNull()
  })
})
