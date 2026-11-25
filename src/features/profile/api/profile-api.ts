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

/**
 * The avatar JPEG as a blob URL. `avatarUrl` is the relative URL the API gives for a guest (it has a
 * `v` parameter that changes with the image); a guest without an avatar has none, and then there
 * is nothing to fetch. Null when the image is not found.
 */
export async function fetchAvatarUrl(avatarUrl: string): Promise<string | null> {
  const response = await appFetch(avatarUrl)
  if (response.status === 404) return null
  await ensureOk(response)
  return URL.createObjectURL(await response.blob())
}
