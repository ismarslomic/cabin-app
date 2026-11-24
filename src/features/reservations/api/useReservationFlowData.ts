import { useCallback, useEffect, useState } from 'react'
import { fetchReservations } from '@/features/reservations/api/reservations-api.ts'
import type { Reservation } from '@/features/reservations/api/types.ts'
import { maxDate } from '@/features/reservations/lib/period.ts'
import { addDays } from '@/shared/lib/dates.ts'
import { reloadForLogin, SessionExpiredError } from '@/shared/lib/http.ts'

export type ReservationFlowData =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; reservations: Reservation[] }

/**
 * What the flow needs when it opens: the coming reservations, to show booked days, from `today`
 * (the same day the flow uses for its quick picks). `reload` is the retry after an error.
 */
export function useReservationFlowData(today: string) {
  const [data, setData] = useState<ReservationFlowData>({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let active = true
    // `to` is exclusive: the day after the last date the picker allows.
    const to = addDays(maxDate(today), 1)
    void fetchReservations(today, to)
      .then((reservations) => {
        if (active) setData({ status: 'ready', reservations })
      })
      .catch((error: unknown) => {
        if (error instanceof SessionExpiredError) {
          reloadForLogin()
          return
        }
        if (active) setData({ status: 'error' })
      })
    return () => {
      active = false
    }
  }, [today, attempt])

  const reload = useCallback(() => {
    setData({ status: 'loading' })
    setAttempt((n) => n + 1)
  }, [])

  return { data, reload }
}
