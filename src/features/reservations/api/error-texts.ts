import { ReservationApiError } from '@/features/reservations/api/reservations-api.ts'

/** Problems with the chosen period. They are fixed on the period step. */
export type PeriodProblem = 'END_BEFORE_START' | 'TOO_LONG' | 'TOO_FAR_AHEAD' | 'OVERLAP'

export type CreateFailure =
  /** Fixed on the period step. */
  | { kind: 'period'; problem: PeriodProblem }
  /** Shown inline above the submit button. */
  | { kind: 'inline'; text: string }
  /** Blocking alert: the user has no access. */
  | { kind: 'forbidden' }
  /** Not an API answer (no network): a transient toast. */
  | { kind: 'network' }

const generalText = 'Kunne ikke opprette reservasjonen. Prøv igjen.'

const periodCodes: Record<string, PeriodProblem> = {
  OVERLAP: 'OVERLAP',
  TOO_LONG: 'TOO_LONG',
  TOO_FAR_AHEAD: 'TOO_FAR_AHEAD',
  END_BEFORE_START: 'END_BEFORE_START',
}

const inlineTexts: Record<string, string> = {
  UNKNOWN_GUEST: 'En av gjestene finnes ikke lenger. Fjern gjesten og prøv igjen.',
  TEMPORARILY_UNAVAILABLE: 'Tjenesten er opptatt. Prøv igjen om litt.',
}

/** Maps a failed create request to what the UI shows. Never uses `ApiError.message`. */
export function describeCreateFailure(error: unknown): CreateFailure {
  if (!(error instanceof ReservationApiError)) return { kind: 'network' }
  if (error.status === 403) return { kind: 'forbidden' }

  const problem = error.code ? periodCodes[error.code] : undefined
  if (problem) return { kind: 'period', problem }

  const text =
    (error.code && inlineTexts[error.code]) ||
    (error.status === 503 ? 'Tjenesten er opptatt. Prøv igjen om litt.' : generalText)
  return { kind: 'inline', text }
}
