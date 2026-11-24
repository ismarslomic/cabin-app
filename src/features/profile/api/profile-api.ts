import type { Profile, ProfileUpdate } from '@/features/profile/api/types.ts'
import { ensureOk } from '@/shared/lib/api-error.ts'
import { appFetch } from '@/shared/lib/http.ts'

export async function fetchProfile(): Promise<Profile> {
  const response = await appFetch('/api/me', { headers: { Accept: 'application/json' } })
  await ensureOk(response)
  return (await response.json()) as Profile
}

/** Saves the profile; `version` is the one read with the profile. Returns the saved profile. */
export async function updateProfile(update: ProfileUpdate, version: number): Promise<Profile> {
  const response = await appFetch('/api/me', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ ...update, version }),
  })
  await ensureOk(response)
  return (await response.json()) as Profile
}

/** The avatar JPEG as a blob URL, or null when the guest has no avatar. */
export async function fetchAvatarUrl(guestId: string): Promise<string | null> {
  const response = await appFetch(`/api/guests/${encodeURIComponent(guestId)}/avatar`)
  if (response.status === 404) return null
  await ensureOk(response)
  return URL.createObjectURL(await response.blob())
}
