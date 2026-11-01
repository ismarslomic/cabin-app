import { useEffect, useState, useSyncExternalStore } from 'react'
import { fetchAvatarUrl, fetchProfile } from '@/features/profile/api/profile-api.ts'
import type { Profile } from '@/features/profile/api/types.ts'
import { SessionExpiredError } from '@/shared/lib/http.ts'

export type ProfileState =
  | { status: 'loading'; profile?: Profile }
  | { status: 'ready'; profile: Profile }
  | { status: 'expired' | 'error'; profile?: Profile }

// One shared copy of the profile: the avatar in every page's navbar and the profile page use it.
let state: ProfileState = { status: 'loading' }
let inflight: Promise<void> | undefined
const avatars = new Map<string, Promise<string | null>>()
const listeners = new Set<() => void>()

function setState(next: ProfileState) {
  state = next
  listeners.forEach((listener) => {
    listener()
  })
}

/** Loads the profile; calls made while a load is running share it. */
export function loadProfile(): Promise<void> {
  inflight ??= fetchProfile()
    .then((profile) => {
      setState({ status: 'ready', profile })
    })
    .catch((error: unknown) => {
      const status = error instanceof SessionExpiredError ? 'expired' : 'error'
      setState({ status, profile: state.profile })
    })
    .finally(() => {
      inflight = undefined
    })
  return inflight
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

/** The shared profile; fetches it on first use. */
export function useProfile(): ProfileState {
  const current = useSyncExternalStore(subscribe, () => state)
  const needsLoad = current.status === 'loading' && !current.profile
  useEffect(() => {
    if (needsLoad) void loadProfile()
  }, [needsLoad])
  return current
}

/** Retry after an error: back to loading, then fetch again. */
export function reloadProfile(): Promise<void> {
  setState({ status: 'loading', profile: state.profile })
  return loadProfile()
}

/** Blob URL of a guest's avatar (cached for the session), or null while loading or when there is none. */
export function useAvatarUrl(guestId: string | undefined): string | null {
  const [url, setUrl] = useState<string | null>(null)
  useEffect(() => {
    if (!guestId) return
    let active = true
    let request = avatars.get(guestId)
    if (!request) {
      request = fetchAvatarUrl(guestId).catch(() => null)
      avatars.set(guestId, request)
    }
    void request.then((avatarUrl) => {
      if (active) setUrl(avatarUrl)
    })
    return () => {
      active = false
    }
  }, [guestId])
  return url
}

/** For tests: forget the shared profile and avatars. */
export function resetProfileStore() {
  state = { status: 'loading' }
  inflight = undefined
  avatars.clear()
}
