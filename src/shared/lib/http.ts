/** The Cloudflare Access session has expired (Access answered 401 instead of the app). */
export class SessionExpiredError extends Error {
  constructor() {
    super('Session expired')
    this.name = 'SessionExpiredError'
  }
}

/**
 * The only way the app makes HTTP requests. The app sits behind Cloudflare Access, which redirects
 * a request with an expired session to its login page; the browser reports that as an opaque CORS
 * or CSP error. With `X-Requested-With: XMLHttpRequest` Access answers `401` instead, which this
 * turns into a `SessionExpiredError` the caller can handle.
 */
export async function appFetch(
  input: RequestInfo | URL,
  init: RequestInit = {},
): Promise<Response> {
  const headers = new Headers(init.headers)
  headers.set('X-Requested-With', 'XMLHttpRequest')

  const response = await fetch(input, { ...init, headers })
  if (response.status === 401) throw new SessionExpiredError()
  return response
}
