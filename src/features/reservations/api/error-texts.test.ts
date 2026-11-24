import { describe, expect, it } from 'vitest'
import { describeCreateFailure } from '@/features/reservations/api/error-texts.ts'
import { ReservationApiError } from '@/features/reservations/api/reservations-api.ts'
import { SessionExpiredError } from '@/shared/lib/http.ts'

describe('describeCreateFailure', () => {
  it.each(['OVERLAP', 'TOO_LONG', 'TOO_FAR_AHEAD', 'END_BEFORE_START'])(
    'sends %s back to the period step',
    (code) => {
      expect(describeCreateFailure(new ReservationApiError(400, code))).toEqual({
        kind: 'period',
        problem: code,
      })
    },
  )

  it('treats a conflict as an overlap even without a readable body', () => {
    expect(describeCreateFailure(new ReservationApiError(409))).toEqual({
      kind: 'period',
      problem: 'OVERLAP',
    })
  })

  it('reloads for the login when the session has expired', () => {
    expect(describeCreateFailure(new SessionExpiredError())).toEqual({ kind: 'session' })
  })

  it('explains an unknown guest', () => {
    expect(describeCreateFailure(new ReservationApiError(400, 'UNKNOWN_GUEST'))).toEqual({
      kind: 'inline',
      text: 'En av gjestene finnes ikke lenger. Fjern gjesten og prøv igjen.',
    })
  })

  it('asks to try again later when the service is busy', () => {
    const busy = { kind: 'inline', text: 'Tjenesten er opptatt. Prøv igjen om litt.' }
    expect(describeCreateFailure(new ReservationApiError(503, 'TEMPORARILY_UNAVAILABLE'))).toEqual(
      busy,
    )
    expect(describeCreateFailure(new ReservationApiError(503))).toEqual(busy)
  })

  it('blocks on 403', () => {
    expect(describeCreateFailure(new ReservationApiError(403, 'FORBIDDEN'))).toEqual({
      kind: 'forbidden',
    })
  })

  it('treats a network failure as transient', () => {
    expect(describeCreateFailure(new TypeError('Failed to fetch'))).toEqual({ kind: 'network' })
  })

  it('uses the general text for other failures', () => {
    expect(describeCreateFailure(new ReservationApiError(400, 'NO_GUESTS'))).toEqual({
      kind: 'inline',
      text: 'Kunne ikke opprette reservasjonen. Prøv igjen.',
    })
  })
})
