import { describe, expect, it } from 'vitest'
import type { Reservation } from '@/features/reservations/api/types.ts'
import {
  bookedRanges,
  maxDate,
  overlapsReservation,
  periodProblem,
  quickPicks,
} from '@/features/reservations/lib/period.ts'

function reservation(start: string, end: string): Reservation {
  return { startTime: `${start}T15:00:00Z`, endTime: `${end}T12:00:00Z` } as Reservation
}

describe('quickPicks', () => {
  it('gives the coming Friday to Sunday and the one after, from a Monday', () => {
    const [upcoming, next] = quickPicks('2026-11-23')
    expect(upcoming).toMatchObject({ start: '2026-11-27', end: '2026-11-29' })
    expect(next).toMatchObject({ start: '2026-12-04', end: '2026-12-06' })
  })

  it('uses tomorrow when today is a Thursday', () => {
    expect(quickPicks('2026-11-26')[0]).toMatchObject({ start: '2026-11-27' })
  })

  it.each(['2026-11-27', '2026-11-28', '2026-11-29'])(
    'skips the weekend that has started when today is %s',
    (today) => {
      expect(quickPicks(today)[0]).toMatchObject({ start: '2026-12-04', end: '2026-12-06' })
    },
  )
})

describe('booked days', () => {
  it('books only the days between the first and the last day', () => {
    expect(bookedRanges([reservation('2026-12-01', '2026-12-05')])).toEqual([
      { from: '2026-12-02', to: '2026-12-04' },
    ])
  })

  it('has nothing fully booked in a one- or two-day stay', () => {
    expect(bookedRanges([reservation('2026-12-01', '2026-12-02')])).toEqual([])
    expect(bookedRanges([reservation('2026-12-01', '2026-12-01')])).toEqual([])
  })

  it('detects a range that spans a reservation', () => {
    const existing = [reservation('2026-12-10', '2026-12-12')]
    expect(overlapsReservation('2026-12-09', '2026-12-13', existing)).toBe(true)
    expect(overlapsReservation('2026-12-11', '2026-12-14', existing)).toBe(true)
  })

  it('allows a same-day handover on either side', () => {
    const existing = [reservation('2026-12-10', '2026-12-12')]
    expect(overlapsReservation('2026-12-12', '2026-12-14', existing)).toBe(false)
    expect(overlapsReservation('2026-12-08', '2026-12-10', existing)).toBe(false)
  })
})

describe('periodProblem', () => {
  const today = '2026-11-23'

  it('accepts a normal weekend', () => {
    expect(periodProblem('2026-11-27', '2026-11-29', today, [])).toBeNull()
  })

  it('needs at least one night', () => {
    expect(periodProblem('2026-11-27', '2026-11-27', today, [])).toBe('END_BEFORE_START')
    expect(periodProblem('2026-11-28', '2026-11-27', today, [])).toBe('END_BEFORE_START')
  })

  it('allows 60 nights but not 61', () => {
    expect(periodProblem('2026-12-01', '2027-01-30', today, [])).toBeNull()
    expect(periodProblem('2026-12-01', '2027-01-31', today, [])).toBe('TOO_LONG')
  })

  it('stops two years ahead', () => {
    expect(maxDate(today)).toBe('2028-11-23')
    expect(periodProblem('2028-11-21', '2028-11-23', today, [])).toBeNull()
    expect(periodProblem('2028-11-22', '2028-11-24', today, [])).toBe('TOO_FAR_AHEAD')
  })

  it('allows the past', () => {
    expect(periodProblem('2026-01-02', '2026-01-04', today, [])).toBeNull()
  })

  it('reports an overlap', () => {
    expect(
      periodProblem('2026-12-09', '2026-12-13', today, [reservation('2026-12-10', '2026-12-12')]),
    ).toBe('OVERLAP')
  })
})
