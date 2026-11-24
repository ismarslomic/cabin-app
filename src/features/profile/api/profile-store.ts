import { useEffect, useState, useSyncExternalStore } from 'react'
import { fetchAvatarUrl, fetchProfile } from '@/features/profile/api/profile-api.ts'
import type { Profile } from '@/features/profile/api/types.ts'
import { handleLoadFailure } from '@/shared/ui/failure-feedback.ts'

export type ProfileState =
  | { status: 'loading'; profile?: Profile }
  | { status: 'ready'; profile: Profile }
  | { status: 'error'; profile?: Profile }

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
      const status = handleLoadFailure(error)
      // 'loading' means the page is reloading for the login: leave the state as it is.
      if (status === 'error') setState({ status, profile: state.profile })
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

/** Puts a profile the app already has (the answer of a save) into the store, without a request. */
export function setProfile(profile: Profile) {
  setState({ status: 'ready', profile })
}

/** Retry after an error: back to loading, then fetch again. */
export function reloadProfile(): Promise<void> {
  setState({ status: 'loading', profile: state.profile })
  return loadProfile()
}

/**
 * Blob URL of an avatar (cached for the session), or null while it loads or when there is none.
 * `avatarUrl` is the URL from the API (null for a guest without an avatar: then nothing is fetched).
 * It changes with the image, so a new image is fetched again.
 */
export function useAvatarUrl(avatarUrl: string | null | undefined): string | null {
  const [loaded, setLoaded] = useState<{ source: string; url: string | null }>()
  useEffect(() => {
    if (!avatarUrl) return
    let active = true
    let request = avatars.get(avatarUrl)
    if (!request) {
      // A failure is not kept: the next mount tries again.
      request = fetchAvatarUrl(avatarUrl).catch(() => {
        avatars.delete(avatarUrl)
        return null
      })
      avatars.set(avatarUrl, request)
    }
    void request.then((url) => {
      if (active) setLoaded({ source: avatarUrl, url })
    })
    return () => {
      active = false
    }
  }, [avatarUrl])
  return avatarUrl && loaded?.source === avatarUrl ? loaded.url : null
}

/** For tests: forget the shared profile and avatars. */
export function resetProfileStore() {
  state = { status: 'loading' }
  inflight = undefined
  avatars.clear()
}
