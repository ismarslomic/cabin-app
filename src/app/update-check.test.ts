import { afterEach, describe, expect, it, vi } from 'vitest'
import { checkForUpdate } from '@/app/update-check.ts'

const fetchMock = vi.fn()
const update = vi.fn(() => Promise.resolve())

function registration({ installing = false, waiting = false, foundAfterUpdate = false } = {}) {
  const result = {
    installing: installing ? {} : null,
    waiting: waiting ? {} : null,
    update: vi.fn(() => {
      // A new worker appears while update() runs.
      if (foundAfterUpdate) result.waiting = {}
      return update()
    }),
  }
  return result as unknown as ServiceWorkerRegistration
}

describe('checkForUpdate', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.clearAllMocks()
  })

  it('asks the browser to update and reports when the app is up to date', async () => {
    fetchMock.mockResolvedValue(new Response('sw'))
    vi.stubGlobal('fetch', fetchMock)

    expect(await checkForUpdate('/sw.js', registration())).toBe('up-to-date')
    expect(update).toHaveBeenCalled()
    const init = fetchMock.mock.calls[0]?.[1] as RequestInit
    expect(new Headers(init.headers).get('X-Requested-With')).toBe('XMLHttpRequest')
  })

  it('reports when a new version was found', async () => {
    fetchMock.mockResolvedValue(new Response('sw'))
    vi.stubGlobal('fetch', fetchMock)

    expect(await checkForUpdate('/sw.js', registration({ foundAfterUpdate: true }))).toBe(
      'update-found',
    )
  })

  it('skips when sw.js cannot be served', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 500 }))
    vi.stubGlobal('fetch', fetchMock)

    expect(await checkForUpdate('/sw.js', registration())).toBe('skipped')
    expect(update).not.toHaveBeenCalled()
  })

  it('reports an expired session on 401', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 401 }))
    vi.stubGlobal('fetch', fetchMock)

    expect(await checkForUpdate('/sw.js', registration())).toBe('session-expired')
    expect(update).not.toHaveBeenCalled()
  })

  it('skips quietly on network errors', async () => {
    fetchMock.mockRejectedValue(new TypeError('Load failed'))
    vi.stubGlobal('fetch', fetchMock)

    expect(await checkForUpdate('/sw.js', registration())).toBe('skipped')
    expect(update).not.toHaveBeenCalled()
  })

  it('skips while a new version is already installing', async () => {
    vi.stubGlobal('fetch', fetchMock)

    expect(await checkForUpdate('/sw.js', registration({ installing: true }))).toBe('skipped')
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
