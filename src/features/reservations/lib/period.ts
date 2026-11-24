import type { Reservation } from '@/features/reservations/api/types.ts'
import type { PeriodProblem } from '@/features/reservations/api/error-texts.ts'
import { addDays, addYears, isoWeekday, nightsBetween } from '@/shared/lib/dates.ts'

export const MAX_NIGHTS = 60
const MAX_YEARS_AHEAD = 2

export interface QuickPick {
  id: 'upcoming' | 'next'
  label: string
  start: string
  end: string
}

/**
 * Friday to Sunday. "Kommende helg" is the first weekend whose Friday is after today (so on a
 * Friday, Saturday or Sunday it is the next one); "Neste helg" is the one after.
 */
export function quickPicks(today: string): QuickPick[] {
  const daysToFriday = (5 - isoWeekday(today) + 7) % 7 || 7
  const friday = addDays(today, daysToFriday)
  const nextFriday = addDays(friday, 7)
  return [
    { id: 'upcoming', label: 'Kommende helg', start: friday, end: addDays(friday, 2) },
    { id: 'next', label: 'Neste helg', start: nextFriday, end: addDays(nextFriday, 2) },
  ]
}

/** The last date the picker allows. */
export function maxDate(today: string): string {
  return addYears(today, MAX_YEARS_AHEAD)
}

/** The date range of a reservation, as UTC dates (first and last day of the stay). */
function stayDates(reservation: Reservation): { first: string; last: string } {
  return { first: reservation.startTime.slice(0, 10), last: reservation.endTime.slice(0, 10) }
}

/**
 * Days that are fully booked: strictly between the first and the last day of a reservation. The
 * first and last day stay selectable, as one stay can end and the next start on the same day.
 */
export function bookedRanges(reservations: Reservation[]): { from: string; to: string }[] {
  return reservations.flatMap((reservation) => {
    const { first, last } = stayDates(reservation)
    const from = addDays(first, 1)
    const to = addDays(last, -1)
    return from <= to ? [{ from, to }] : []
  })
}

/** Whether a stay from `start` to `end` overlaps a reservation (a same-day handover does not). */
export function overlapsReservation(
  start: string,
  end: string,
  reservations: Reservation[],
): boolean {
  return reservations.some((reservation) => {
    const { first, last } = stayDates(reservation)
    return start < last && end > first
  })
}

/** The first problem with a period, or null when it can be sent. */
export function periodProblem(
  start: string,
  end: string,
  today: string,
  reservations: Reservation[],
): PeriodProblem | null {
  if (end <= start) return 'END_BEFORE_START'
  if (nightsBetween(start, end) > MAX_NIGHTS) return 'TOO_LONG'
  const limit = maxDate(today)
  if (start > limit || end > limit) return 'TOO_FAR_AHEAD'
  if (overlapsReservation(start, end, reservations)) return 'OVERLAP'
  return null
}
