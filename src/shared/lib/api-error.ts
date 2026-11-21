import type { components } from '@/shared/api/schema.ts'

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
