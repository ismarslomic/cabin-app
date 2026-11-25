import type { Guest } from '@/features/reservations/api/types.ts'
import type { DraftGuest, DraftPeriod } from '@/features/reservations/lib/draft.ts'
import { formatDate } from '@/shared/lib/dates.ts'

/** The most guests the API accepts on one reservation. */
export const MAX_GUESTS = 50

/**
 * The full name of a guest.
 *
 * @example
 * guestName({ firstName: 'Ola', lastName: 'Nordmann' }) // 'Ola Nordmann'
 */
export function guestName(guest: Pick<Guest, 'firstName' | 'lastName'>): string {
  return `${guest.firstName} ${guest.lastName}`
}

/** The guests whose name contains the search text (ignoring case); all of them for no text. */
export function filterGuests(guests: Guest[], query: string): Guest[] {
  const text = query.trim().toLowerCase()
  if (!text) return guests
  return guests.filter((guest) => guestName(guest).toLowerCase().includes(text))
}

/** The guests split into the family and the others, each in the order given. */
export function groupGuests(guests: Guest[]): { family: Guest[]; others: Guest[] } {
  return {
    family: guests.filter((guest) => guest.isFamily),
    others: guests.filter((guest) => !guest.isFamily),
  }
}

/** The guests that are not on the draft yet. */
export function guestsToAdd(all: Guest[], draft: DraftGuest[]): Guest[] {
  const added = new Set(draft.map((guest) => guest.guestId))
  return all.filter((guest) => !added.has(guest.id))
}

/** The draft with the given guests added at the end, with the group's dates. */
export function addGuests(draft: DraftGuest[], guestIds: string[]): DraftGuest[] {
  return [...draft, ...guestIds.map((guestId) => ({ guestId, fromDate: null, toDate: null }))]
}

/**
 * The text under a guest in the list when the guest comes or leaves on another day than the group,
 * such as "Ankomst lør 28. nov. · Avreise søn 29. nov."; empty when the guest follows the group.
 */
export function guestDatesText(guest: DraftGuest, period: DraftPeriod, today: string): string {
  const parts: string[] = []
  if (guest.fromDate !== null && guest.fromDate !== period.startDate) {
    parts.push(`Ankomst ${formatDate(guest.fromDate, today)}`)
  }
  if (guest.toDate !== null && guest.toDate !== period.endDate) {
    parts.push(`Avreise ${formatDate(guest.toDate, today)}`)
  }
  return parts.join(' · ')
}

/** Names in a sentence: "A", "A og B", "A, B og C". */
function joinNames(names: string[]): string {
  const last = names.at(-1) ?? ''
  return names.length < 2 ? last : `${names.slice(0, -1).join(', ')} og ${last}`
}

/** Up to this many guests are named in the note about reset dates; more are only counted. */
const MAX_NAMED = 3

/**
 * The note under the guest list when a new period removed some guests' own dates: who, why and what
 * it means. Empty when no guest was affected.
 *
 * @example
 * resetDatesText(['Ola Nordmann']) // 'Egne datoer er fjernet for Ola Nordmann fordi de ikke ...'
 */
export function resetDatesText(names: string[]): string {
  if (names.length === 0) return ''
  const who = names.length > MAX_NAMED ? `${names.length} gjester` : joinNames(names)
  const follow = names.length === 1 ? 'Gjesten følger' : 'Gjestene følger'
  return `Egne datoer er fjernet for ${who} fordi de ikke passer i den nye perioden. ${follow} nå hele oppholdet.`
}
