import { describe, expect, it } from 'vitest'
import type { Reservation } from '@/features/reservations/api/types.ts'
import type { DraftPeriod } from '@/features/reservations/lib/draft.ts'
import { periodIssueText } from '@/features/reservations/lib/period-issue.ts'

const TODAY = '2026-11-23'
const period: DraftPeriod = {
  startDate: '2026-11-27',
  endDate: '2026-11-29',
  arrivalTime: '16:00',
  departureTime: '13:00',
}
const booked = [
  { id: 'r1', startTime: '2026-11-26T15:00:00Z', endTime: '2026-11-30T12:00:00Z' },
] as Reservation[]

describe('periodIssueText', () => {
  it('is undefined for a period that can be sent', () => {
    expect(periodIssueText(period, TODAY, [])).toBeUndefined()
  })

  it('names a problem with the dates', () => {
    expect(periodIssueText(period, TODAY, booked)).toBe(
      'Perioden overlapper en annen reservasjon. Velg andre datoer.',
    )
  })

  it('names a problem the server reported', () => {
    expect(periodIssueText(period, TODAY, [], 'TOO_LONG')).toBe(
      'Et opphold kan ikke være lengre enn 60 netter.',
    )
  })

  it('names a time that is not allowed, after the dates', () => {
    const early = { ...period, arrivalTime: '01:30' }
    expect(periodIssueText(early, TODAY, [])).toBe('Velg et tidspunkt mellom 02:00 og 23:59.')
    expect(periodIssueText(early, TODAY, booked)).toContain('overlapper')
  })
})
