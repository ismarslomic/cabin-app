import { appFetch, SessionExpiredError } from '@/shared/lib/http.ts'

/** How often an open app looks for a new version (it also checks when it returns to the foreground). */
export const UPDATE_CHECK_INTERVAL_MS = 10 * 60 * 1000

export type UpdateCheckResult = 'checked' | 'session-expired' | 'skipped'

/**
 * Looks for a new service worker. The browser's own check cannot tell us when Cloudflare Access
 * redirects it to the login page (it just fails), so fetch `sw.js` ourselves first: a 401 means the
 * Access session has expired. An installed PWA that serves the cached app never reaches Access
 * otherwise, and would stay on the old version.
 */
export async function checkForUpdate(
  swUrl: string,
  registration: ServiceWorkerRegistration,
): Promise<UpdateCheckResult> {
  if (registration.installing || !navigator.onLine) return 'skipped'

  try {
    const response = await appFetch(swUrl, { cache: 'no-store' })
    if (response.ok) await registration.update()
    return 'checked'
  } catch (error) {
    if (error instanceof SessionExpiredError) return 'session-expired'
    // Network trouble: try again at the next check.
    return 'skipped'
  }
}

/** Drops the service worker and its caches, then reloads so the request goes through the Access login. */
export async function signInAgain(): Promise<void> {
  const registrations = await navigator.serviceWorker.getRegistrations()
  await Promise.all(registrations.map((registration) => registration.unregister()))
  const cacheNames = await caches.keys()
  await Promise.all(cacheNames.map((name) => caches.delete(name)))
  window.location.reload()
}
