import { appFetch, SessionExpiredError } from '@/shared/lib/http.ts'

/** How often an open app looks for a new version (it also checks when it returns to the foreground). */
export const UPDATE_CHECK_INTERVAL_MS = 10 * 60 * 1000

export type UpdateCheckResult = 'update-found' | 'up-to-date' | 'session-expired' | 'skipped'

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
    if (!response.ok) return 'skipped'
    await registration.update()
    return registration.installing || registration.waiting ? 'update-found' : 'up-to-date'
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

interface ApplyUpdateOptions {
  /** From `useRegisterSW`: tells the waiting worker to take over. */
  updateServiceWorker: (reloadPage?: boolean) => Promise<void>
  registration: ServiceWorkerRegistration
  reload?: () => void
  /** How long to wait for the browser to report that the new worker took over. */
  delayMs?: number
}

/**
 * Applies the waiting update and reloads into it. vite-plugin-pwa reloads when the browser reports
 * that the new worker took control, but an installed iOS PWA often never reports it: the worker
 * takes over and the page just stays on the old version until the app is closed and reopened. So
 * reload on `controllerchange` too, and force it after a short wait; if the worker is still
 * waiting by then, ask it to take over once more first.
 */
export async function applyUpdate({
  updateServiceWorker,
  registration,
  reload = () => window.location.reload(),
  delayMs = 2500,
}: ApplyUpdateOptions): Promise<void> {
  let reloaded = false
  const reloadOnce = () => {
    if (reloaded) return
    reloaded = true
    reload()
  }

  navigator.serviceWorker.addEventListener('controllerchange', reloadOnce, { once: true })
  await updateServiceWorker(true)

  window.setTimeout(() => {
    if (!registration.waiting) {
      reloadOnce()
      return
    }
    registration.waiting.postMessage({ type: 'SKIP_WAITING' })
    window.setTimeout(reloadOnce, delayMs)
  }, delayMs)
}
