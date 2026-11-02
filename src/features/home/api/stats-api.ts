import type { components } from '@/shared/api/schema.ts'
import { appFetch } from '@/shared/lib/http.ts'

export type LiveStats = components['schemas']['LiveStats']
export type CurrentYearStats = components['schemas']['CurrentYearStats']
export type ReservationGuest = components['schemas']['GuestStats']

export class StatsApiError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.status = status
    this.name = 'StatsApiError'
  }
}

async function getJson<T>(url: string): Promise<T> {
  const response = await appFetch(url, { headers: { Accept: 'application/json' } })
  if (!response.ok) throw new StatsApiError('Kunne ikke hente statistikken.', response.status)
  return (await response.json()) as T
}

/** Current and next reservation. */
export function fetchLiveStats(): Promise<LiveStats> {
  return getJson<LiveStats>('/api/stats')
}

/** Visits, nights and driving distance for the current calendar year. */
export function fetchCurrentYearStats(): Promise<CurrentYearStats> {
  return getJson<CurrentYearStats>('/api/stats/current-year')
}
