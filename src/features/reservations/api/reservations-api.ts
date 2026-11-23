import type { Reservation, ReservationCreate } from '@/features/reservations/api/types.ts'
import { readApiErrorCode } from '@/shared/lib/api-error.ts'
import { appFetch } from '@/shared/lib/http.ts'

/** A failed reservation request. `code` is the `ApiError.code` when the body had one. */
export class ReservationApiError extends Error {
  readonly status: number
  readonly code: string | undefined

  constructor(status: number, code?: string) {
    super(`Reservation request failed with ${status}`)
    this.name = 'ReservationApiError'
    this.status = status
    this.code = code
  }
}

/**
 * Reservations that overlap the window: `from` is the first day (inclusive), `to` the day after
 * the last day (exclusive), both `yyyy-MM-dd` (UTC dates).
 */
export async function fetchReservations(from: string, to: string): Promise<Reservation[]> {
  const query = new URLSearchParams({ from, to })
  const response = await appFetch(`/api/reservations?${query.toString()}`, {
    headers: { Accept: 'application/json' },
  })
  if (!response.ok) throw new ReservationApiError(response.status, await readApiErrorCode(response))
  return (await response.json()) as Reservation[]
}

/** Creates a reservation (admin and family user only). Returns the created reservation. */
export async function createReservation(request: ReservationCreate): Promise<Reservation> {
  const response = await appFetch('/api/reservations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(request),
  })
  if (!response.ok) throw new ReservationApiError(response.status, await readApiErrorCode(response))
  return (await response.json()) as Reservation
}
