import type { Profile, ProfileUpdate } from '@/features/profile/api/types.ts'
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

const updateErrors: Record<number, string> = {
  400: 'Ugyldig verdi. Sjekk feltene og prøv igjen.',
  403: 'Du har ikke tilgang til å endre dette.',
}

export async function updateProfile(update: ProfileUpdate): Promise<void> {
  const response = await appFetch('/api/me', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(update),
  })
  if (!response.ok) {
    throw new ProfileApiError(
      updateErrors[response.status] ?? 'Kunne ikke lagre profilen.',
      response.status,
    )
  }
}

/** The avatar JPEG as a blob URL, or null when the guest has no avatar. */
export async function fetchAvatarUrl(guestId: string): Promise<string | null> {
  const response = await appFetch(`/api/guests/${encodeURIComponent(guestId)}/avatar`)
  if (response.status === 404) return null
  if (!response.ok) throw new ProfileApiError('Kunne ikke hente avataren.', response.status)
  return URL.createObjectURL(await response.blob())
}
