import { describe, expect, it } from 'vitest'
import { currentStatusText, isAtCabin, nextStatusText } from '@/features/reservations/lib/status.ts'

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
