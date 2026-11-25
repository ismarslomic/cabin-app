import { describe, expect, it } from 'vitest'
import { describeCreateFailure } from '@/features/reservations/api/error-texts.ts'
import type { Failure } from '@/shared/lib/api-error.ts'

const api = (status: number, code?: string): Failure => ({ kind: 'api', status, code })

describe('describeCreateFailure', () => {
  it.each(['OVERLAP', 'TOO_LONG', 'TOO_FAR_AHEAD', 'END_BEFORE_START'])(
    'marks %s as a period problem',
    (code) => {
      expect(describeCreateFailure(api(400, code))).toEqual({ kind: 'period', problem: code })
    },
  )

  it('treats a conflict as an overlap even without a readable body', () => {
    expect(describeCreateFailure(api(409))).toEqual({ kind: 'period', problem: 'OVERLAP' })
  })

  it('explains an unknown guest', () => {
    expect(describeCreateFailure(api(400, 'UNKNOWN_GUEST'))).toEqual({
      kind: 'inline',
      text: 'En av gjestene finnes ikke lenger. Fjern gjesten og prøv igjen.',
    })
  })

  it('asks to try again later when the service is busy', () => {
    const busy = { kind: 'inline', text: 'Tjenesten er opptatt. Prøv igjen om litt.' }
    expect(describeCreateFailure(api(503, 'TEMPORARILY_UNAVAILABLE'))).toEqual(busy)
    expect(describeCreateFailure(api(503))).toEqual(busy)
  })

  it.each([api(400, 'NO_GUESTS'), { kind: 'network' } as Failure])(
    'uses the general text for other failures (%j)',
    (failure) => {
      expect(describeCreateFailure(failure)).toEqual({
        kind: 'inline',
        text: 'Kunne ikke opprette reservasjonen. Prøv igjen.',
      })
    },
  )
})
