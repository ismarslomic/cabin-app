import { afterEach, describe, expect, it, vi } from 'vitest'
import { birthYearErrorMessage, parseBirthYear } from '@/features/profile/birth-year.ts'

describe('parseBirthYear', () => {
  it.each([
    ['1985', 1985],
    ['1900', 1900],
    ['2026', 2026],
  ])('accepts %s', (value, expected) => {
    expect(parseBirthYear(value, 2026)).toBe(expected)
  })

  it('ignores spaces and new lines around the year', () => {
    expect(parseBirthYear(' 1985 ', 2026)).toBe(1985)
    expect(parseBirthYear('1985\n', 2026)).toBe(1985)
  })

  it.each([
    '',
    '85',
    '1899',
    '2027',
    '19.5',
    'abcd',
    '-1985',
    '1985.5',
    '1985.0',
    '1e3',
    '1.985e3',
    '0x7C0',
    '+1985',
    '01985',
    'NaN',
    'Infinity',
    '１９８５',
    '١٩٨٥',
  ])('rejects "%s"', (value) => {
    expect(parseBirthYear(value, 2026)).toBeNull()
  })

  describe('without a year, uses the current year in Oslo', () => {
    afterEach(() => {
      vi.useRealTimers()
    })

    it('already counts 2027 in Oslo when it is still 2026 in UTC', () => {
      vi.useFakeTimers({ toFake: ['Date'], now: new Date('2026-12-31T23:30:00Z') })

      expect(parseBirthYear('2027')).toBe(2027)
    })

    it('rejects next year before New Year in Oslo', () => {
      vi.useFakeTimers({ toFake: ['Date'], now: new Date('2026-12-31T22:30:00Z') })

      expect(parseBirthYear('2027')).toBeNull()
    })
  })
})

describe('birthYearErrorMessage', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('names the limits', () => {
    expect(birthYearErrorMessage(2026)).toBe('Skriv et årstall mellom 1900 og 2026')
  })

  it('follows the Oslo year when the page has been open over New Year', () => {
    vi.useFakeTimers({ toFake: ['Date'], now: new Date('2026-12-31T22:30:00Z') })
    expect(birthYearErrorMessage()).toBe('Skriv et årstall mellom 1900 og 2026')

    vi.setSystemTime(new Date('2026-12-31T23:30:00Z'))
    expect(birthYearErrorMessage()).toBe('Skriv et årstall mellom 1900 og 2027')
  })
})
