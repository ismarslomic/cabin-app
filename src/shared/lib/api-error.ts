import type { components } from '@/shared/api/schema.ts'
import { SessionExpiredError } from '@/shared/lib/http.ts'

/**
 * The `code` of the `ApiError` body of an error response, or undefined when the body is not an
 * `ApiError` (for example an empty body or a proxy error page). Never read `ApiError.message`:
 * it is English and for developers, not for users.
 */
export async function readApiErrorCode(response: Response): Promise<string | undefined> {
  try {
    const body = (await response.json()) as Partial<components['schemas']['ApiError']> | null
    return typeof body?.code === 'string' ? body.code : undefined
  } catch {
    return undefined
  }
}

/** A failed API request: the HTTP status and the `ApiError.code` when the body had one. */
export class ApiRequestError extends Error {
  readonly status: number
  readonly code: string | undefined

  constructor(status: number, code?: string) {
    super(`Request failed with ${status}`)
    this.name = 'ApiRequestError'
    this.status = status
    this.code = code
  }
}

/**
 * Throws an `ApiRequestError` for a bad answer; call it right after `appFetch` in every API
 * function, so a failure is always read the same way.
 *
 * @example
 * const response = await appFetch('/api/guests')
 * await ensureOk(response)
 */
export async function ensureOk(response: Response): Promise<void> {
  if (!response.ok) throw new ApiRequestError(response.status, await readApiErrorCode(response))
}

/** What went wrong with an API call, as far as the whole app treats it the same way. */
export type Failure =
  /** The Cloudflare Access session has expired (`401`). */
  | { kind: 'session' }
  /** The user has no access (`403`). */
  | { kind: 'forbidden' }
  /** No answer from the API (offline, or any error that is not an API answer). */
  | { kind: 'network' }
  /** The API answered with another error; a feature maps `code` and `status` to its own texts. */
  | { kind: 'api'; status: number; code: string | undefined }

/** The `api` kind of a `Failure`: an answer from the API that is not common to the whole app. */
export type ApiFailure = Extract<Failure, { kind: 'api' }>

/**
 * Sorts a thrown error into a `Failure`. Together with `appFetch` (which turns `401` into a
 * `SessionExpiredError`) and `handleCommonFailure`, this is the only place that knows about `401`
 * and `403`.
 *
 * @example
 * classifyFailure(new ApiRequestError(409, 'OVERLAP')) // { kind: 'api', status: 409, code: 'OVERLAP' }
 */
export function classifyFailure(error: unknown): Failure {
  if (error instanceof SessionExpiredError) return { kind: 'session' }
  if (!(error instanceof ApiRequestError)) return { kind: 'network' }
  if (error.status === 403) return { kind: 'forbidden' }
  return { kind: 'api', status: error.status, code: error.code }
}
