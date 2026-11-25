import { useCallback, useEffect, useEffectEvent, useState } from 'react'
import { loadGuests } from '@/features/reservations/api/guests-api.ts'
import { fetchReservations } from '@/features/reservations/api/reservations-api.ts'
import type { Guest, Reservation } from '@/features/reservations/api/types.ts'
import { maxDate } from '@/features/reservations/lib/period.ts'
import { addDays } from '@/shared/lib/dates.ts'
import { handleLoadFailure } from '@/shared/ui/failure-feedback.ts'

export type ReservationFlowData =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; reservations: Reservation[]; guests: Guest[] }

/**
 * What the flow needs when it opens: the coming reservations, to show booked days, from `today`
 * (the same day the flow uses for its quick picks), and all guests. `reload` is the retry after an
 * error. A session or access problem is handled for the whole app; `onForbiddenDismissed` runs
 * when the user has read the no-access alert.
 */
export function useReservationFlowData(today: string, onForbiddenDismissed: () => void) {
  const [data, setData] = useState<ReservationFlowData>({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)

  const handleFailure = useEffectEvent((error: unknown) =>
    handleLoadFailure(error, { onForbiddenDismissed }),
  )

  useEffect(() => {
    let active = true
    // `to` is exclusive: the day after the last date the picker allows.
    const to = addDays(maxDate(today), 1)
    void Promise.all([fetchReservations(today, to), loadGuests()])
      .then(([reservations, guests]) => {
        if (active) setData({ status: 'ready', reservations, guests })
      })
      .catch((error: unknown) => {
        if (!active) return
        // The page may be reloading for the login; otherwise an error with a retry (behind the alert).
        setData({ status: handleFailure(error) })
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
