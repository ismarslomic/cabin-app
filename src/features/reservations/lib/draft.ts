import type { ReservationCreate } from '@/features/reservations/api/types.ts'
import { isDateWithin, osloToInstant } from '@/features/reservations/lib/dates.ts'

export interface DraftPeriod {
  startDate: string
  endDate: string
  arrivalTime: string
  departureTime: string
}

/** A guest of the draft; `fromDate`/`toDate` are the guest's own days, null when with the group. */
export interface DraftGuest {
  guestId: string
  fromDate: string | null
  toDate: string | null
}

/** The guest's own arrival if it is still inside the period, otherwise null (with the group). */
function keepArrival(guest: DraftGuest, startDate: string, endDate: string): string | null {
  const { fromDate } = guest
  if (fromDate === null) return null
  return isDateWithin(fromDate, startDate, endDate) ? fromDate : null
}

/**
 * The guest's own departure if it is still inside the period and not before the arrival the guest
 * keeps, otherwise null (with the group).
 */
function keepDeparture(
  guest: DraftGuest,
  arrival: string | null,
  startDate: string,
  endDate: string,
): string | null {
  const { toDate } = guest
  if (toDate === null) return null
  const isInsidePeriod = isDateWithin(toDate, startDate, endDate)
  const isAfterArrival = arrival === null || toDate >= arrival
  return isInsidePeriod && isAfterArrival ? toDate : null
}

/** The same guest object when nothing changed, so a caller can tell which guests were reset. */
function reconcileGuest(guest: DraftGuest, startDate: string, endDate: string): DraftGuest {
  const fromDate = keepArrival(guest, startDate, endDate)
  const toDate = keepDeparture(guest, fromDate, startDate, endDate)
  const unchanged = fromDate === guest.fromDate && toDate === guest.toDate
  return unchanged ? guest : { ...guest, fromDate, toDate }
}

/**
 * Keeps the guests' own dates that still fit the period and resets the others. `reset` is how
 * many guests had a date reset, for the note on the guest step.
 */
export function reconcileGuestDates(
  guests: DraftGuest[],
  startDate: string,
  endDate: string,
): { guests: DraftGuest[]; reset: number } {
  const reconciled = guests.map((guest) => reconcileGuest(guest, startDate, endDate))
  const reset = reconciled.filter((guest, index) => guest !== guests[index]).length
  return { guests: reconciled, reset }
}

/** The request body. A guest date equal to the first or last day is the same as the group's. */
export function buildCreateRequest(period: DraftPeriod, guests: DraftGuest[]): ReservationCreate {
  return {
    startTime: osloToInstant(period.startDate, period.arrivalTime),
    endTime: osloToInstant(period.endDate, period.departureTime),
    guests: guests.map((guest) => ({
      guestId: guest.guestId,
      fromDate: guest.fromDate === period.startDate ? null : guest.fromDate,
      toDate: guest.toDate === period.endDate ? null : guest.toDate,
    })),
  }
}

/**
 * The guests a new reservation starts with: every family guest and the current user, once each,
 * in the order of `all` (sorted by first name).
 */
export function defaultGuests(
  all: { id: string; isFamily: boolean }[],
  currentUserId: string,
): DraftGuest[] {
  return all
    .filter((guest) => guest.isFamily || guest.id === currentUserId)
    .map((guest) => ({ guestId: guest.id, fromDate: null, toDate: null }))
}
