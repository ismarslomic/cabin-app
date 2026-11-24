import { describe, expect, it } from 'vitest'
import {
  addDays,
  addYears,
  currentYearInOslo,
  formatDate,
  formatDateRange,
  fromIsoDate,
  isDateWithin,
  isoWeekday,
  nightsBetween,
  nightsLabel,
  toIsoDate,
  todayInOslo,
} from '@/shared/lib/dates.ts'

describe('dates', () => {
  it('adds days across month and year borders', () => {
    expect(addDays('2026-12-30', 3)).toBe('2027-01-02')
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28')
  })

  it('adds years and keeps 29 February valid', () => {
    expect(addYears('2026-11-23', 2)).toBe('2028-11-23')
    expect(addYears('2028-02-29', 2)).toBe('2030-02-28')
  })

  it('checks that a date is within two dates, both ends included', () => {
    expect(isDateWithin('2026-12-05', '2026-12-04', '2026-12-06')).toBe(true)
    expect(isDateWithin('2026-12-04', '2026-12-04', '2026-12-06')).toBe(true)
    expect(isDateWithin('2026-12-06', '2026-12-04', '2026-12-06')).toBe(true)
    expect(isDateWithin('2026-12-03', '2026-12-04', '2026-12-06')).toBe(false)
    expect(isDateWithin('2026-12-07', '2026-12-04', '2026-12-06')).toBe(false)
  })

  it('numbers weekdays from Monday 1 to Sunday 7', () => {
    expect(isoWeekday('2026-11-23')).toBe(1)
    expect(isoWeekday('2026-11-27')).toBe(5)
    expect(isoWeekday('2026-11-29')).toBe(7)
  })

  it('counts nights', () => {
    expect(nightsBetween('2026-11-27', '2026-11-29')).toBe(2)
    expect(nightsBetween('2026-03-28', '2026-03-30')).toBe(2)
  })

  it('writes nights in the singular and the plural', () => {
    expect(nightsLabel(1)).toBe('1 natt')
    expect(nightsLabel(2)).toBe('2 netter')
  })

  it('converts between Date and yyyy-MM-dd with local components', () => {
    expect(toIsoDate(new Date(2026, 0, 5))).toBe('2026-01-05')
    expect(toIsoDate(fromIsoDate('2026-11-23'))).toBe('2026-11-23')
  })

  it('finds today in Oslo, not in UTC', () => {
    expect(todayInOslo(new Date('2026-11-22T23:30:00Z'))).toBe('2026-11-23')
    expect(todayInOslo(new Date('2026-07-01T21:59:00Z'))).toBe('2026-07-01')
    expect(todayInOslo(new Date('2026-07-01T22:00:00Z'))).toBe('2026-07-02')
  })
})

describe('currentYearInOslo', () => {
  it('is the year in Oslo, which is ahead of UTC at New Year', () => {
    expect(currentYearInOslo(new Date('2026-12-31T22:59:00Z'))).toBe(2026)
    expect(currentYearInOslo(new Date('2026-12-31T23:00:00Z'))).toBe(2027)
    expect(currentYearInOslo(new Date('2026-06-15T12:00:00Z'))).toBe(2026)
  })
})

describe('formatDate', () => {
  it('writes weekday, day and month, without the year in the current year', () => {
    expect(formatDate('2026-11-27', '2026-11-23')).toBe('fre 27. nov.')
    expect(formatDate('2026-12-06', '2026-11-23')).toBe('søn 6. des.')
  })

  it('adds the year to a date outside the current year', () => {
    expect(formatDate('2027-01-02', '2026-11-23')).toBe('lør 2. jan. 2027')
    expect(formatDate('2025-10-31', '2026-11-23')).toBe('fre 31. okt. 2025')
  })

  it('uses the library month names', () => {
    expect(formatDate('2026-03-05', '2026-01-01')).toBe('tor 5. mars')
    expect(formatDate('2026-06-05', '2026-01-01')).toBe('fre 5. juni')
  })
})

describe('formatDateRange', () => {
  it('writes both dates', () => {
    expect(formatDateRange('2026-10-31', '2026-11-02', '2026-10-31')).toBe(
      'lør 31. okt. – man 2. nov.',
    )
  })

  it('adds the year to a date outside the current year', () => {
    expect(formatDateRange('2026-12-30', '2027-01-02', '2026-10-31')).toBe(
      'ons 30. des. – lør 2. jan. 2027',
    )
  })
})
