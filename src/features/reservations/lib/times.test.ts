import { describe, expect, it } from 'vitest'
import { isAllowedTime } from '@/features/reservations/lib/times.ts'

describe('isAllowedTime', () => {
  it('allows times from 02:00 to 23:59 only', () => {
    expect(isAllowedTime('02:00')).toBe(true)
    expect(isAllowedTime('23:59')).toBe(true)
    expect(isAllowedTime('01:59')).toBe(false)
    expect(isAllowedTime('00:00')).toBe(false)
    expect(isAllowedTime('24:00')).toBe(false)
    expect(isAllowedTime('9:00')).toBe(false)
  })
})
