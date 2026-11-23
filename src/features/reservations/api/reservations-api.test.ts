import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  createReservation,
  fetchReservations,
  ReservationApiError,
} from '@/features/reservations/api/reservations-api.ts'
import { SessionExpiredError } from '@/shared/lib/http.ts'

const fetchMock = vi.fn()

const request = { startTime: '2026-12-04T15:00:00Z', endTime: '2026-12-06T12:00:00Z', guests: [] }

describe('reservations api', () => {
  afterEach(() => {
    fetchMock.mockReset()
  })

  it('reads reservations in a window', async () => {
    fetchMock.mockResolvedValue(Response.json([{ id: 'a' }]))
    vi.stubGlobal('fetch', fetchMock)

    await expect(fetchReservations('2026-11-23', '2028-11-24')).resolves.toEqual([{ id: 'a' }])
    expect(fetchMock.mock.calls[0]?.[0]).toBe('/api/reservations?from=2026-11-23&to=2028-11-24')
  })

  it('posts a reservation as JSON and returns the created one', async () => {
    fetchMock.mockResolvedValue(Response.json({ id: 'new' }, { status: 201 }))
    vi.stubGlobal('fetch', fetchMock)

    await expect(createReservation(request)).resolves.toEqual({ id: 'new' })
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('/api/reservations')
    expect(init.method).toBe('POST')
    expect(new Headers(init.headers).get('Content-Type')).toBe('application/json')
    expect(JSON.parse(init.body as string)).toEqual(request)
  })

  it('throws the status and ApiError code of a failed create', async () => {
    fetchMock.mockResolvedValue(Response.json({ code: 'OVERLAP', message: 'x' }, { status: 409 }))
    vi.stubGlobal('fetch', fetchMock)

    await expect(createReservation(request)).rejects.toMatchObject({
      name: 'ReservationApiError',
      status: 409,
      code: 'OVERLAP',
    })
  })

  it('throws without a code when the body is not an ApiError', async () => {
    fetchMock.mockResolvedValue(new Response('Bad Gateway', { status: 502 }))
    vi.stubGlobal('fetch', fetchMock)

    const error = await fetchReservations('2026-11-23', '2026-11-24').catch((e: unknown) => e)
    expect(error).toBeInstanceOf(ReservationApiError)
    expect(error).toMatchObject({ status: 502, code: undefined })
  })

  it('lets a SessionExpiredError through', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 401 }))
    vi.stubGlobal('fetch', fetchMock)

    await expect(createReservation(request)).rejects.toBeInstanceOf(SessionExpiredError)
  })
})
