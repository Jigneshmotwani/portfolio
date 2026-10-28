import { describe, expect, it } from 'vitest'
import { busiestDay, monthLabels, parseContributions, streaks, toWeeks, type ContributionDay } from './contributions'

const day = (date: string, count: number): ContributionDay => ({ date, count, level: count ? 1 : 0 })

describe('parseContributions', () => {
  it('uses lastYear total, sorts days and drops future dates', () => {
    const d = parseContributions(
      {
        total: { lastYear: 42 },
        contributions: [
          { date: '2026-10-02', count: 3, level: 2 },
          { date: '2026-10-01', count: 0, level: 0 },
          { date: '2026-12-31', count: 9, level: 4 },
        ],
      },
      '2026-10-28',
    )!
    expect(d.total).toBe(42)
    expect(d.days.map((x) => x.date)).toEqual(['2026-10-01', '2026-10-02'])
  })
  it('sums counts when no total is reported and rejects junk', () => {
    expect(parseContributions({ contributions: [{ date: '2026-01-01', count: 2, level: 1 }] }, '2026-10-28')!.total).toBe(2)
    expect(parseContributions({ nope: 1 })).toBeNull()
    expect(parseContributions({ contributions: [] })).toBeNull()
  })
})

describe('toWeeks', () => {
  it('pads the first week so columns start on Sunday', () => {
    // 2026-10-28 is a Wednesday.
    const weeks = toWeeks([day('2026-10-28', 1), day('2026-10-29', 0), day('2026-10-30', 0), day('2026-10-31', 2), day('2026-11-01', 5)])
    expect(weeks).toHaveLength(2)
    expect(weeks[0].slice(0, 3)).toEqual([null, null, null])
    expect(weeks[0][3]?.date).toBe('2026-10-28')
    expect(weeks[1][0]?.date).toBe('2026-11-01')
  })
})

describe('stats', () => {
  const days = [day('2026-10-20', 1), day('2026-10-21', 2), day('2026-10-22', 3), day('2026-10-23', 0), day('2026-10-24', 4), day('2026-10-25', 1), day('2026-10-26', 0)]
  it('computes streaks, ignoring an empty today', () => {
    expect(streaks(days)).toEqual({ current: 2, longest: 3 })
  })
  it('finds the busiest day', () => {
    expect(busiestDay(days)?.date).toBe('2026-10-24')
    expect(busiestDay([day('2026-01-01', 0)])).toBeNull()
  })
  it('labels months once per change', () => {
    const weeks = toWeeks([day('2026-09-27', 0), ...Array.from({ length: 30 }, (_, i) => day(`2026-10-${String(i + 1).padStart(2, '0')}`, 0))])
    expect(monthLabels(weeks).map((m) => m.label)).toContain('Oct')
  })
})
