import { describe, expect, it } from 'vitest'
import type { Guest } from '@/features/reservations/api/types.ts'
import type { DraftGuest, DraftPeriod } from '@/features/reservations/lib/draft.ts'
import {
  addGuests,
  filterGuests,
  groupGuests,
  guestDatesText,
  guestName,
  guestsToAdd,
  resetDatesText,
} from '@/features/reservations/lib/guests.ts'

const guest = (id: string, firstName: string, lastName: string, isFamily = false) =>
  ({ id, firstName, lastName, isFamily }) as Guest

const ola = guest('ola', 'Ola', 'Nordmann', true)
const siri = guest('siri', 'Siri', 'Berg')
const period: DraftPeriod = {
  startDate: '2026-11-27',
  endDate: '2026-11-29',
  arrivalTime: '16:00',
  departureTime: '13:00',
}
const draft = (fromDate: string | null, toDate: string | null): DraftGuest => ({
  guestId: 'ola',
  fromDate,
  toDate,
})

describe('guest helpers', () => {
  it('writes the full name', () => {
    expect(guestName(ola)).toBe('Ola Nordmann')
  })

  it('filters by name, ignoring case and spaces around the text', () => {
    expect(filterGuests([ola, siri], ' NORD ')).toEqual([ola])
    expect(filterGuests([ola, siri], 'a n')).toEqual([ola])
    expect(filterGuests([ola, siri], '')).toEqual([ola, siri])
  })

  it('splits family and others', () => {
    expect(groupGuests([ola, siri])).toEqual({ family: [ola], others: [siri] })
  })

  it('lists the guests that are not on the draft', () => {
    expect(guestsToAdd([ola, siri], [draft(null, null)])).toEqual([siri])
  })

  it('adds guests with the dates of the group', () => {
    expect(addGuests([draft(null, null)], ['siri'])).toEqual([
      draft(null, null),
      { guestId: 'siri', fromDate: null, toDate: null },
    ])
  })

  describe('guestDatesText', () => {
    const today = '2026-11-23'

    it('is empty for a guest who follows the group', () => {
      expect(guestDatesText(draft(null, null), period, today)).toBe('')
      expect(guestDatesText(draft('2026-11-27', '2026-11-29'), period, today)).toBe('')
    })

    it('names an own arrival and departure', () => {
      expect(guestDatesText(draft('2026-11-28', null), period, today)).toBe('Ankomst lør 28. nov.')
      expect(guestDatesText(draft(null, '2026-11-28'), period, today)).toBe('Avreise lør 28. nov.')
      expect(guestDatesText(draft('2026-11-28', '2026-11-28'), period, today)).toBe(
        'Ankomst lør 28. nov. · Avreise lør 28. nov.',
      )
    })
  })

  describe('resetDatesText', () => {
    it('is empty when no guest was affected', () => {
      expect(resetDatesText([])).toBe('')
    })

    it('names one guest and says the guest follows the stay', () => {
      expect(resetDatesText(['Ola Nordmann'])).toBe(
        'Egne datoer er fjernet for Ola Nordmann fordi de ikke passer i den nye perioden. Gjesten følger nå hele oppholdet.',
      )
    })

    it('names two or three guests in a sentence', () => {
      expect(resetDatesText(['A', 'B'])).toContain('for A og B fordi')
      expect(resetDatesText(['A', 'B', 'C'])).toContain('for A, B og C fordi')
      expect(resetDatesText(['A', 'B'])).toContain('Gjestene følger nå hele oppholdet.')
    })

    it('only counts the guests when there are many', () => {
      expect(resetDatesText(['A', 'B', 'C', 'D'])).toContain('for 4 gjester fordi')
    })
  })
})
