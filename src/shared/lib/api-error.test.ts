import { describe, expect, it } from 'vitest'
import { readApiErrorCode } from '@/shared/lib/api-error.ts'

describe('readApiErrorCode', () => {
  it('reads the code of an ApiError body', async () => {
    const response = Response.json({ code: 'VERSION_MISMATCH', message: 'Changed' })
    await expect(readApiErrorCode(response)).resolves.toBe('VERSION_MISMATCH')
  })

  it.each([
    ['an empty body', () => new Response(null, { status: 500 })],
    ['a body that is not JSON', () => new Response('<html></html>')],
    ['JSON without a code', () => Response.json({ message: 'x' })],
    ['a null body', () => Response.json(null)],
  ])('gives undefined for %s', async (_name, make) => {
    await expect(readApiErrorCode(make())).resolves.toBeUndefined()
  })
})
