import type { Reservation, ReservationCreate } from '@/features/reservations/api/types.ts'
import { ensureOk } from '@/shared/lib/api-error.ts'
import { appFetch } from '@/shared/lib/http.ts'

/**
 * Reservations that overlap the window: `from` is the first day (inclusive), `to` the day after
 * the last day (exclusive), both `yyyy-MM-dd` (UTC dates).
 */
export async function fetchReservations(from: string, to: string): Promise<Reservation[]> {
  const query = new URLSearchParams({ from, to })
  const response = await appFetch(`/api/reservations?${query.toString()}`, {
    headers: { Accept: 'application/json' },
  })
  await ensureOk(response)
  return (await response.json()) as Reservation[]
}

/**
 * Creates a reservation (admin and family user only). The answer is not read: once the API said
 * 201 the reservation exists, whatever the body looks like.
 */
export async function createReservation(request: ReservationCreate): Promise<void> {
  const response = await appFetch('/api/reservations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(request),
  })
  await ensureOk(response)
}
