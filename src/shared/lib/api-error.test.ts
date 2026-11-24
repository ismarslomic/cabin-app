import { describe, expect, it } from 'vitest'
import {
  ApiRequestError,
  classifyFailure,
  ensureOk,
  readApiErrorCode,
} from '@/shared/lib/api-error.ts'
import { SessionExpiredError } from '@/shared/lib/http.ts'

describe('readApiErrorCode', () => {
  it('reads the code of an ApiError body', async () => {
    const response = Response.json({ code: 'VERSION_MISMATCH', message: 'Changed' })
    await expect(readApiErrorCode(response)).resolves.toBe('VERSION_MISMATCH')
  })

  it.each([
    ['an empty body', () => new Response(null, { status: 500 })],
    ['a body that is not JSON', () => new Response('Bad Gateway')],
    ['JSON without a code', () => Response.json({ message: 'x' })],
    ['a null body', () => Response.json(null)],
  ])('gives undefined for %s', async (_name, make) => {
    await expect(readApiErrorCode(make())).resolves.toBeUndefined()
  })
})

describe('ensureOk', () => {
  it('lets a good answer through', async () => {
    await expect(ensureOk(Response.json({}))).resolves.toBeUndefined()
  })

  it('throws the status and the code of a bad answer', async () => {
    const response = Response.json({ code: 'OVERLAP', message: 'x' }, { status: 409 })
    await expect(ensureOk(response)).rejects.toEqual(new ApiRequestError(409, 'OVERLAP'))
  })

  it('throws without a code when the body is not an ApiError', async () => {
    await expect(ensureOk(new Response('Bad Gateway', { status: 502 }))).rejects.toMatchObject({
      name: 'ApiRequestError',
      status: 502,
      code: undefined,
    })
  })
})

describe('classifyFailure', () => {
  it.each([
    [new SessionExpiredError(), { kind: 'session' }],
    [new ApiRequestError(403, 'FORBIDDEN'), { kind: 'forbidden' }],
    [new ApiRequestError(409, 'OVERLAP'), { kind: 'api', status: 409, code: 'OVERLAP' }],
    [new ApiRequestError(500), { kind: 'api', status: 500, code: undefined }],
    [new TypeError('Failed to fetch'), { kind: 'network' }],
  ])('sorts %s', (error, failure) => {
    expect(classifyFailure(error)).toEqual(failure)
  })
})
