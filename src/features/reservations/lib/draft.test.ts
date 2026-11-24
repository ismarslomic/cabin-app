import { describe, expect, it } from 'vitest'
import {
  buildCreateRequest,
  defaultGuests,
  initialPeriod,
  isSameGuests,
  normalizeGuestDates,
  isSamePeriod,
  reconcileGuestDates,
  type DraftGuest,
} from '@/features/reservations/lib/draft.ts'

const guest = (guestId: string, fromDate: string | null = null, toDate: string | null = null) =>
  ({ guestId, fromDate, toDate }) satisfies DraftGuest

describe('reconcileGuestDates', () => {
  it('keeps dates that still fit', () => {
    const guests = [guest('a', '2026-12-05', '2026-12-06')]
    const result = reconcileGuestDates(guests, '2026-12-04', '2026-12-07')
    expect(result).toEqual({ guests, resetGuestIds: [] })
  })

  it('resets only the dates that no longer fit', () => {
    const result = reconcileGuestDates(
      [guest('a', '2026-12-05', '2026-12-06'), guest('b', '2026-12-04', null), guest('c')],
      '2026-12-05',
      '2026-12-07',
    )
    expect(result.guests).toEqual([
      // Its own arrival is now the first day of the period: the same as none.
      guest('a', null, '2026-12-06'),
      guest('b', null, null),
      guest('c'),
    ])
    expect(result.resetGuestIds).toEqual(['b'])
  })

  it('stores an own date that now equals the period as none, without counting it as a reset', () => {
    const result = reconcileGuestDates(
      [guest('a', '2026-12-05', '2026-12-07')],
      '2026-12-05',
      '2026-12-07',
    )
    expect(result).toEqual({ guests: [guest('a')], resetGuestIds: [] })
  })

  it('resets a departure before the kept arrival', () => {
    const result = reconcileGuestDates(
      [guest('a', '2026-12-06', '2026-12-05')],
      '2026-12-04',
      '2026-12-08',
    )
    expect(result.guests[0]).toEqual(guest('a', '2026-12-06', null))
    expect(result.resetGuestIds).toEqual(['a'])
  })
})

describe('buildCreateRequest', () => {
  const period = {
    startDate: '2026-12-04',
    endDate: '2026-12-06',
    arrivalTime: '16:00',
    departureTime: '13:00',
  }

  it('sends UTC instants for the Oslo times', () => {
    const request = buildCreateRequest(period, [guest('a')])
    expect(request.startTime).toBe('2026-12-04T15:00:00Z')
    expect(request.endTime).toBe('2026-12-06T12:00:00Z')
  })

  it('treats a guest date on the first or last day as the group date', () => {
    const request = buildCreateRequest(period, [
      guest('a', '2026-12-04', '2026-12-06'),
      guest('b', '2026-12-05', '2026-12-05'),
    ])
    expect(request.guests).toEqual([
      { guestId: 'a', fromDate: null, toDate: null },
      { guestId: 'b', fromDate: '2026-12-05', toDate: '2026-12-05' },
    ])
  })
})

describe('defaultGuests', () => {
  it('takes the family and the current user, once each', () => {
    const all = [
      { id: 'ola', isFamily: true },
      { id: 'per', isFamily: false },
      { id: 'kari', isFamily: false },
    ]
    expect(defaultGuests(all, 'kari').map((g) => g.guestId)).toEqual(['ola', 'kari'])
    expect(defaultGuests(all, 'ola').map((g) => g.guestId)).toEqual(['ola'])
  })
})

describe('initialPeriod', () => {
  it('is the coming weekend with the default times', () => {
    expect(initialPeriod('2026-11-23')).toEqual({
      startDate: '2026-11-27',
      endDate: '2026-11-29',
      arrivalTime: '16:00',
      departureTime: '13:00',
    })
  })

  it('compares periods field by field', () => {
    const period = initialPeriod('2026-11-23')
    expect(isSamePeriod(period, { ...period })).toBe(true)
    expect(isSamePeriod(period, { ...period, endDate: '2026-11-30' })).toBe(false)
    expect(isSamePeriod(period, { ...period, arrivalTime: '17:00' })).toBe(false)
  })
})

describe('isSameGuests', () => {
  it('is true for the same guests with the same dates', () => {
    expect(
      isSameGuests([guest('a'), guest('b', '2026-12-05')], [guest('a'), guest('b', '2026-12-05')]),
    ).toBe(true)
  })

  it('is false when a guest, an order or a date differs', () => {
    expect(isSameGuests([guest('a')], [guest('a'), guest('b')])).toBe(false)
    expect(isSameGuests([guest('a'), guest('b')], [guest('b'), guest('a')])).toBe(false)
    expect(isSameGuests([guest('a')], [guest('a', '2026-12-05')])).toBe(false)
    expect(isSameGuests([guest('a')], [guest('a', null, '2026-12-05')])).toBe(false)
  })
})

describe('normalizeGuestDates', () => {
  const period = {
    startDate: '2026-11-27',
    endDate: '2026-11-29',
    arrivalTime: '16:00',
    departureTime: '13:00',
  }

  it("sets an own date equal to the reservation's back to null", () => {
    expect(normalizeGuestDates(guest('a', '2026-11-27', '2026-11-29'), period)).toEqual(guest('a'))
  })

  it('keeps own dates that differ, each on its own', () => {
    expect(normalizeGuestDates(guest('a', '2026-11-28', '2026-11-29'), period)).toEqual(
      guest('a', '2026-11-28', null),
    )
    expect(normalizeGuestDates(guest('a', '2026-11-27', '2026-11-28'), period)).toEqual(
      guest('a', null, '2026-11-28'),
    )
  })

  it('does not mix the days up: an own departure on the first day stays', () => {
    expect(normalizeGuestDates(guest('a', null, '2026-11-27'), period)).toEqual(
      guest('a', null, '2026-11-27'),
    )
  })
})
