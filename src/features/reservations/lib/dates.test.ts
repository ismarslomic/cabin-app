import { describe, expect, it } from 'vitest'
import {
  addDays,
  addYears,
  fromIsoDate,
  isAllowedTime,
  isDateWithin,
  isoWeekday,
  nightsBetween,
  osloToInstant,
  toIsoDate,
  todayInOslo,
} from '@/features/reservations/lib/dates.ts'

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

  it('converts between Date and yyyy-MM-dd with local components', () => {
    expect(toIsoDate(new Date(2026, 0, 5))).toBe('2026-01-05')
    expect(toIsoDate(fromIsoDate('2026-11-23'))).toBe('2026-11-23')
  })

  it('finds today in Oslo, not in UTC', () => {
    expect(todayInOslo(new Date('2026-11-22T23:30:00Z'))).toBe('2026-11-23')
    expect(todayInOslo(new Date('2026-07-01T21:59:00Z'))).toBe('2026-07-01')
    expect(todayInOslo(new Date('2026-07-01T22:00:00Z'))).toBe('2026-07-02')
  })

  it('converts Oslo times to UTC in winter and summer', () => {
    expect(osloToInstant('2026-01-10', '16:00')).toBe('2026-01-10T15:00:00Z')
    expect(osloToInstant('2026-07-10', '16:00')).toBe('2026-07-10T14:00:00Z')
  })

  it('handles the days the clocks change', () => {
    expect(osloToInstant('2026-03-29', '13:00')).toBe('2026-03-29T11:00:00Z')
    expect(osloToInstant('2026-10-25', '13:00')).toBe('2026-10-25T12:00:00Z')
    // 02:30 does not exist on 2026-03-29: it becomes 03:30 (01:30Z) on the same UTC day.
    expect(osloToInstant('2026-03-29', '02:30')).toBe('2026-03-29T01:30:00Z')
  })

  it('allows times from 02:00 to 23:59 only', () => {
    expect(isAllowedTime('02:00')).toBe(true)
    expect(isAllowedTime('23:59')).toBe(true)
    expect(isAllowedTime('01:59')).toBe(false)
    expect(isAllowedTime('24:00')).toBe(false)
    expect(isAllowedTime('9:00')).toBe(false)
  })
})
