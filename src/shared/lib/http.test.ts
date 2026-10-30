import { afterEach, describe, expect, it, vi } from 'vitest'
import { appFetch, SessionExpiredError } from '@/shared/lib/http.ts'

const fetchMock = vi.fn()

describe('appFetch', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    fetchMock.mockReset()
  })

  it('sends X-Requested-With and keeps the caller options', async () => {
    fetchMock.mockResolvedValue(new Response('ok'))
    vi.stubGlobal('fetch', fetchMock)

    const response = await appFetch('/api/x', {
      cache: 'no-store',
      headers: { Accept: 'text/plain' },
    })

    const init = fetchMock.mock.calls[0]?.[1] as RequestInit
    const headers = new Headers(init.headers)
    expect(headers.get('X-Requested-With')).toBe('XMLHttpRequest')
    expect(headers.get('Accept')).toBe('text/plain')
    expect(init.cache).toBe('no-store')
    expect(await response.text()).toBe('ok')
  })

  it('throws SessionExpiredError on 401', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 401 }))
    vi.stubGlobal('fetch', fetchMock)

    await expect(appFetch('/api/x')).rejects.toBeInstanceOf(SessionExpiredError)
  })

  it('returns other error statuses to the caller', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 500 }))
    vi.stubGlobal('fetch', fetchMock)

    expect((await appFetch('/api/x')).status).toBe(500)
  })
})
