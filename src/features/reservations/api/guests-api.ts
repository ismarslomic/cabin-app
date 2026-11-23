import { ReservationApiError } from '@/features/reservations/api/reservations-api.ts'
import type { Guest } from '@/features/reservations/api/types.ts'
import { readApiErrorCode } from '@/shared/lib/api-error.ts'
import { appFetch } from '@/shared/lib/http.ts'

let cached: Promise<Guest[]> | undefined

async function requestGuests(): Promise<Guest[]> {
  const response = await appFetch('/api/guests', { headers: { Accept: 'application/json' } })
  if (!response.ok) throw new ReservationApiError(response.status, await readApiErrorCode(response))
  return (await response.json()) as Guest[]
}

/** All guests, sorted by first name. One copy per session; a failed load is not cached. */
export function loadGuests(): Promise<Guest[]> {
  cached ??= requestGuests().catch((error: unknown) => {
    cached = undefined
    throw error
  })
  return cached
}

/** Forgets the cached guests (for tests). */
export function resetGuestsCache(): void {
  cached = undefined
}
