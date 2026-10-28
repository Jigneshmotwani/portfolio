import { describe, expect, it } from 'vitest'
import { editDistance, fuzzyScore, normalize, tokenScore } from './fuzzy'

describe('normalize', () => {
  it('lowercases, strips accents and punctuation', () => {
    expect(normalize('  Café — Résumé!  ')).toBe('cafe resume')
    expect(normalize('C++ & C#')).toBe('c++ c#')
  })
})

describe('editDistance', () => {
  it('counts substitutions, insertions and transpositions', () => {
    expect(editDistance('keppel', 'keppel')).toBe(0)
    expect(editDistance('kepel', 'keppel')).toBe(1)
    expect(editDistance('pyhton', 'python')).toBe(1)
    expect(editDistance('abc', 'xyz', 1)).toBeGreaterThan(1)
  })
})

describe('fuzzyScore', () => {
  it('ranks exact > prefix > word prefix > substring > subsequence', () => {
    const exact = fuzzyScore('safari', 'Safari')
    const prefix = fuzzyScore('saf', 'Safari')
    const wordPrefix = fuzzyScore('nfo', 'Azure AI Foundry'.replace('Foundry', 'nfoundry'))
    const substring = fuzzyScore('fari', 'Safari')
    const subsequence = fuzzyScore('sfr', 'Safari')
    expect(exact).toBe(1)
    expect(prefix).toBeGreaterThan(0.85)
    expect(prefix).toBeLessThan(exact)
    expect(wordPrefix).toBeGreaterThan(substring)
    expect(substring).toBeGreaterThan(subsequence)
    expect(subsequence).toBeGreaterThan(0)
  })

  it('matches word prefixes inside longer titles', () => {
    expect(fuzzyScore('foundry', 'Azure AI Foundry')).toBeGreaterThan(0.8)
  })

  it('tolerates one typo in words of 4+ characters', () => {
    expect(fuzzyScore('pyhton', 'Python')).toBeGreaterThan(0.4)
    expect(fuzzyScore('kepel', 'Keppel Technology Solutions')).toBeGreaterThan(0.4)
    expect(tokenScore('tetirs', 'tetris')).toBeGreaterThan(0)
  })

  it('does not tolerate typos in very short words', () => {
    expect(tokenScore('gp', 'go')).toBe(0)
  })

  it('requires every query word to match', () => {
    expect(fuzzyScore('rust monorepo', 'Rust version control for huge monorepos')).toBeGreaterThan(0.5)
    expect(fuzzyScore('rust banana', 'Rust version control')).toBeLessThan(0.42)
  })

  it('returns 0 for unrelated text', () => {
    expect(fuzzyScore('zzz', 'Safari')).toBe(0)
    expect(fuzzyScore('', 'Safari')).toBe(0)
  })
})
