import type { ApiFailure, Failure } from '@/shared/lib/api-error.ts'

export const versionConflictText =
  'Profilen ble endret et annet sted. Vi har hentet nyeste versjon, sjekk og lagre på nytt.'

const invalidText = 'Ugyldig verdi. Sjekk feltene og prøv igjen.'
const generalText = 'Kunne ikke lagre profilen.'

/** The profile was changed elsewhere since it was read (`412`). */
export function isVersionConflict(failure: ApiFailure): boolean {
  return failure.code === 'VERSION_MISMATCH' || failure.status === 412
}

/** The text for a failed save that is not handled for the whole app (session, no access). */
export function saveFailureText(failure: Failure): string {
  if (failure.kind !== 'api') return generalText
  if (isVersionConflict(failure)) return versionConflictText
  if (failure.code === 'INVALID_REQUEST' || failure.status === 400) return invalidText
  return generalText
}
