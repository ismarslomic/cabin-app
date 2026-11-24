import type { Failure } from '@/shared/lib/api-error.ts'

/** Problems with the chosen period. They are fixed on the period step. */
export type PeriodProblem = 'END_BEFORE_START' | 'TOO_LONG' | 'TOO_FAR_AHEAD' | 'OVERLAP'

export const periodProblemTexts: Record<PeriodProblem, string> = {
  END_BEFORE_START: 'Sluttdatoen må være etter startdatoen.',
  TOO_LONG: 'Et opphold kan ikke være lengre enn 60 netter.',
  TOO_FAR_AHEAD: 'Du kan ikke reservere mer enn 2 år fram i tid.',
  OVERLAP: 'Perioden overlapper en annen reservasjon. Velg andre datoer.',
}

/**
 * What a failed create shows, for a failure that is not handled for the whole app (session, no
 * access, no network: see `handleCommonFailure`).
 */
export type CreateFailure =
  /** Fixed on the period step. */
  | { kind: 'period'; problem: PeriodProblem }
  /** Shown inline above the submit button. */
  | { kind: 'inline'; text: string }

const generalText = 'Kunne ikke opprette reservasjonen. Prøv igjen.'

const periodCodes: Record<string, PeriodProblem> = {
  OVERLAP: 'OVERLAP',
  TOO_LONG: 'TOO_LONG',
  TOO_FAR_AHEAD: 'TOO_FAR_AHEAD',
  END_BEFORE_START: 'END_BEFORE_START',
}

const busyText = 'Tjenesten er opptatt. Prøv igjen om litt.'

const inlineTexts: Record<string, string> = {
  UNKNOWN_GUEST: 'En av gjestene finnes ikke lenger. Fjern gjesten og prøv igjen.',
  TEMPORARILY_UNAVAILABLE: busyText,
}

/** Maps a failed create request to what the UI shows. Never uses `ApiError.message`. */
export function describeCreateFailure(failure: Failure): CreateFailure {
  if (failure.kind !== 'api') return { kind: 'inline', text: generalText }

  // A 409 is an overlap, also when the body could not be read.
  const problem = failure.code
    ? periodCodes[failure.code]
    : failure.status === 409
      ? 'OVERLAP'
      : undefined
  if (problem) return { kind: 'period', problem }

  const text =
    (failure.code && inlineTexts[failure.code]) || (failure.status === 503 ? busyText : generalText)
  return { kind: 'inline', text }
}
