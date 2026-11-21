import { describe, expect, it } from 'vitest'
import {
  currentStatusText,
  formatDateRange,
  formatKm,
  isAtCabin,
  nextStatusText,
  toIsoDate,
} from '@/features/home/format.ts'

const today = new Date(2026, 9, 31)

describe('formatDateRange', () => {
  it('writes weekday, day and month for both dates', () => {
    expect(formatDateRange('2025-10-31', '2025-11-02', new Date(2025, 9, 31))).toBe(
      'fre 31. okt – søn 2. nov',
    )
  })

  it('adds the year to a date outside the current year', () => {
    expect(formatDateRange('2026-12-30', '2027-01-02', today)).toBe('ons 30. des – lør 2. jan 2027')
  })
})

describe('status texts', () => {
  it('counts the remaining nights of the current reservation', () => {
    expect(currentStatusText(3)).toBe('På hytta nå · 3 netter igjen')
    expect(currentStatusText(1)).toBe('På hytta nå · 1 natt igjen')
    expect(currentStatusText(0)).toBe('Reiser i dag')
  })

  it('counts the days until the next reservation', () => {
    expect(nextStatusText(4)).toBe('Om 4 dager')
    expect(nextStatusText(1)).toBe('I morgen')
    expect(nextStatusText(0)).toBe('I dag')
  })
})

describe('formatKm', () => {
  it('rounds and groups thousands with a thin space', () => {
    expect(formatKm(1240.4)).toBe('1 240')
  })

  it('shows 0 when there is no distance', () => {
    expect(formatKm(null)).toBe('0')
    expect(formatKm(undefined)).toBe('0')
  })
})

describe('toIsoDate', () => {
  it('writes local year, month and day with leading zeros', () => {
    expect(toIsoDate(new Date(2026, 0, 5))).toBe('2026-01-05')
  })
})

describe('isAtCabin', () => {
  const stay = { stayStartDate: '2026-11-10', stayEndDate: '2026-11-12' }

  it.each([
    ['2026-11-09', false],
    ['2026-11-10', true],
    ['2026-11-12', true],
    ['2026-11-13', false],
  ])('on %s gives %s', (day, expected) => {
    expect(isAtCabin(stay, day)).toBe(expected)
  })
})
