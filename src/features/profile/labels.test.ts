import { describe, expect, it } from 'vitest'
import { parseBirthYear } from '@/features/profile/labels.ts'

describe('parseBirthYear', () => {
  it.each([
    ['1985', 1985],
    ['1900', 1900],
    ['2026', 2026],
  ])('accepts %s', (value, expected) => {
    expect(parseBirthYear(value, 2026)).toBe(expected)
  })

  it.each(['', '85', '1899', '2027', '19.5', 'abcd', '-1985'])('rejects "%s"', (value) => {
    expect(parseBirthYear(value, 2026)).toBeNull()
  })
})
