import { describe, expect, it } from 'vitest'
import {
  buildCreateRequest,
  defaultGuests,
  initialPeriod,
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
    expect(result).toEqual({ guests, reset: 0 })
  })

  it('resets only the dates that no longer fit', () => {
    const result = reconcileGuestDates(
      [guest('a', '2026-12-05', '2026-12-06'), guest('b', '2026-12-04', null), guest('c')],
      '2026-12-05',
      '2026-12-07',
    )
    expect(result.guests).toEqual([
      guest('a', '2026-12-05', '2026-12-06'),
      guest('b', null, null),
      guest('c'),
    ])
    expect(result.reset).toBe(1)
  })

  it('resets a departure before the kept arrival', () => {
    const result = reconcileGuestDates(
      [guest('a', '2026-12-06', '2026-12-05')],
      '2026-12-04',
      '2026-12-08',
    )
    expect(result.guests[0]).toEqual(guest('a', '2026-12-06', null))
    expect(result.reset).toBe(1)
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
