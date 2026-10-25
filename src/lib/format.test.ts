import { describe, expect, it } from 'vitest'
import { formatCurrency, formatDate, lastMonths, monthRange } from './format'

describe('finance formatting', () => {
  it('formats currency using INR and Indian grouping', () => {
    expect(formatCurrency(1234567.5)).toContain('12,34,567.5')
    expect(formatCurrency(0)).toContain('0')
  })

  it('formats dates without shifting the calendar day', () => {
    expect(formatDate('2026-10-25')).toContain('25')
    expect(formatDate('not-a-date')).toBe('Invalid date')
  })

  it('builds month ranges and fills intervening months', () => {
    expect(monthRange('2024-02')).toEqual({ from: '2024-02-01', to: '2024-02-29' })
    expect(lastMonths(3, new Date(2026, 0, 10))).toEqual(['2025-11', '2025-12', '2026-01'])
  })
})
