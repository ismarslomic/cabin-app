import { describe, expect, it } from 'vitest'
import {
  isVersionConflict,
  saveFailureText,
  versionConflictText,
} from '@/features/profile/api/error-texts.ts'
import type { Failure } from '@/shared/lib/api-error.ts'

const api = (status: number, code?: string): Failure => ({ kind: 'api', status, code })

describe('profile error texts', () => {
  it('knows a version conflict by code or by status', () => {
    expect(isVersionConflict({ kind: 'api', status: 400, code: 'VERSION_MISMATCH' })).toBe(true)
    expect(isVersionConflict({ kind: 'api', status: 412, code: undefined })).toBe(true)
    expect(isVersionConflict({ kind: 'api', status: 400, code: undefined })).toBe(false)
  })

  it.each([
    [api(400), 'Ugyldig verdi. Sjekk feltene og prøv igjen.'],
    [api(400, 'INVALID_REQUEST'), 'Ugyldig verdi. Sjekk feltene og prøv igjen.'],
    [api(412, 'VERSION_MISMATCH'), versionConflictText],
    [api(413, 'BODY_TOO_LARGE'), 'Kunne ikke lagre profilen.'],
    [api(500), 'Kunne ikke lagre profilen.'],
    [{ kind: 'network' } as Failure, 'Kunne ikke lagre profilen.'],
  ])('explains %j in Norwegian', (failure, text) => {
    expect(saveFailureText(failure)).toBe(text)
  })
})
