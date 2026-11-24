import { describe, expect, it } from 'vitest'
import { formatKm } from '@/shared/lib/distance.ts'

describe('formatKm', () => {
  it('rounds and groups thousands with a thin space', () => {
    expect(formatKm(1240.4)).toBe('1\u202f240')
  })

  it('shows 0 when there is no distance', () => {
    expect(formatKm(null)).toBe('0')
    expect(formatKm(undefined)).toBe('0')
  })
})
