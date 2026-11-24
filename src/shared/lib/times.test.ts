import { describe, expect, it } from 'vitest'
import { isTimeBefore, isTimeOfDay, osloToInstant } from '@/shared/lib/times.ts'

describe('osloToInstant', () => {
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
})

describe('isTimeOfDay', () => {
  it('accepts exactly HH:mm', () => {
    expect(isTimeOfDay('00:00')).toBe(true)
    expect(isTimeOfDay('23:59')).toBe(true)
    expect(isTimeOfDay('24:00')).toBe(false)
    expect(isTimeOfDay('12:60')).toBe(false)
    expect(isTimeOfDay('9:00')).toBe(false)
    expect(isTimeOfDay('')).toBe(false)
  })
})

describe('isTimeBefore', () => {
  it('compares times of day', () => {
    expect(isTimeBefore('01:59', '02:00')).toBe(true)
    expect(isTimeBefore('02:00', '02:00')).toBe(false)
    expect(isTimeBefore('13:00', '02:00')).toBe(false)
  })
})
