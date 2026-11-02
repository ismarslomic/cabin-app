import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  fetchCurrentYearStats,
  fetchLiveStats,
  StatsApiError,
} from '@/features/home/api/stats-api.ts'
import { SessionExpiredError } from '@/shared/lib/http.ts'

const fetchMock = vi.fn()

describe('stats api', () => {
  afterEach(() => {
    fetchMock.mockReset()
  })

  it('reads the live stats from /api/stats', async () => {
    fetchMock.mockResolvedValue(Response.json({ isOccupied: true }))
    vi.stubGlobal('fetch', fetchMock)

    await expect(fetchLiveStats()).resolves.toMatchObject({ isOccupied: true })
    expect(fetchMock.mock.calls[0]?.[0]).toBe('/api/stats')
  })

  it('reads the year stats from /api/stats/current-year', async () => {
    fetchMock.mockResolvedValue(Response.json({ year: 2026, visits: 8 }))
    vi.stubGlobal('fetch', fetchMock)

    await expect(fetchCurrentYearStats()).resolves.toMatchObject({ visits: 8 })
    expect(fetchMock.mock.calls[0]?.[0]).toBe('/api/stats/current-year')
  })

  it('throws a StatsApiError on a failed response', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 500 }))
    vi.stubGlobal('fetch', fetchMock)

    await expect(fetchLiveStats()).rejects.toMatchObject({ name: 'StatsApiError', status: 500 })
    await expect(fetchLiveStats()).rejects.toBeInstanceOf(StatsApiError)
  })

  it('lets a SessionExpiredError through', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 401 }))
    vi.stubGlobal('fetch', fetchMock)

    await expect(fetchLiveStats()).rejects.toBeInstanceOf(SessionExpiredError)
  })
})
