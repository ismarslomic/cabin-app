import type { Profile, ProfileUpdate } from '@/features/profile/api/types.ts'
import { readApiErrorCode } from '@/shared/lib/api-error.ts'
import { appFetch } from '@/shared/lib/http.ts'

export class ProfileApiError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.status = status
    this.name = 'ProfileApiError'
  }
}

export async function fetchProfile(): Promise<Profile> {
  const response = await appFetch('/api/me', { headers: { Accept: 'application/json' } })
  if (!response.ok) throw new ProfileApiError('Kunne ikke hente profilen.', response.status)
  return (await response.json()) as Profile
}

const conflictText =
  'Profilen ble endret et annet sted. Vi har hentet nyeste versjon, sjekk og lagre på nytt.'

const updateErrorsByCode: Record<string, string> = {
  INVALID_REQUEST: 'Ugyldig verdi. Sjekk feltene og prøv igjen.',
  VERSION_MISMATCH: conflictText,
}

const updateErrorsByStatus: Record<number, string> = {
  400: 'Ugyldig verdi. Sjekk feltene og prøv igjen.',
  403: 'Du har ikke tilgang til appen.',
  412: conflictText,
}

/** Saves the profile; `version` is the one read with the profile. Returns the saved profile. */
export async function updateProfile(update: ProfileUpdate, version: number): Promise<Profile> {
  const response = await appFetch('/api/me', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ ...update, version }),
  })
  if (!response.ok) {
    const code = await readApiErrorCode(response)
    throw new ProfileApiError(
      (code && updateErrorsByCode[code]) ||
        updateErrorsByStatus[response.status] ||
        'Kunne ikke lagre profilen.',
      response.status,
    )
  }
  return (await response.json()) as Profile
}

/** The avatar JPEG as a blob URL, or null when the guest has no avatar. */
export async function fetchAvatarUrl(guestId: string): Promise<string | null> {
  const response = await appFetch(`/api/guests/${encodeURIComponent(guestId)}/avatar`)
  if (response.status === 404) return null
  if (!response.ok) throw new ProfileApiError('Kunne ikke hente avataren.', response.status)
  return URL.createObjectURL(await response.blob())
}
