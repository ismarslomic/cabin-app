import { afterEach, describe, expect, it, vi } from 'vitest'
import { loadGuests, resetGuestsCache } from '@/features/reservations/api/guests-api.ts'

const fetchMock = vi.fn()

describe('guests api', () => {
  afterEach(() => {
    fetchMock.mockReset()
    resetGuestsCache()
  })

  it('loads the guests once per session', async () => {
    fetchMock.mockImplementation(() => Promise.resolve(Response.json([{ id: 'ola' }])))
    vi.stubGlobal('fetch', fetchMock)

    await expect(loadGuests()).resolves.toEqual([{ id: 'ola' }])
    await expect(loadGuests()).resolves.toEqual([{ id: 'ola' }])
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock.mock.calls[0]?.[0]).toBe('/api/guests')
  })

  it('does not cache a failure', async () => {
    fetchMock
      .mockResolvedValueOnce(Response.json({ code: 'FORBIDDEN', message: 'x' }, { status: 403 }))
      .mockResolvedValueOnce(Response.json([{ id: 'ola' }]))
    vi.stubGlobal('fetch', fetchMock)

    await expect(loadGuests()).rejects.toMatchObject({ status: 403, code: 'FORBIDDEN' })
    await expect(loadGuests()).resolves.toEqual([{ id: 'ola' }])
  })
})
