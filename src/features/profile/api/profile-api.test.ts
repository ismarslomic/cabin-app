import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  fetchAvatarUrl,
  fetchProfile,
  ProfileApiError,
  updateProfile,
} from '@/features/profile/api/profile-api.ts'
import { SessionExpiredError } from '@/shared/lib/http.ts'

const fetchMock = vi.fn()

describe('profile api', () => {
  afterEach(() => {
    fetchMock.mockReset()
  })

  it('reads the profile from /api/me', async () => {
    fetchMock.mockResolvedValue(Response.json({ id: 'g1', firstName: 'Kari' }))
    vi.stubGlobal('fetch', fetchMock)

    await expect(fetchProfile()).resolves.toMatchObject({ id: 'g1', firstName: 'Kari' })
    expect(fetchMock.mock.calls[0]?.[0]).toBe('/api/me')
  })

  it('lets a SessionExpiredError through', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 401 }))
    vi.stubGlobal('fetch', fetchMock)

    await expect(fetchProfile()).rejects.toBeInstanceOf(SessionExpiredError)
  })

  it('posts the update as JSON', async () => {
    fetchMock.mockResolvedValue(Response.json({}))
    vi.stubGlobal('fetch', fetchMock)
    const update = {
      firstName: 'Kari',
      lastName: 'Nordmann',
      birthYear: 1985,
      gender: 'FEMALE' as const,
    }

    await updateProfile(update)

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('/api/me')
    expect(init.method).toBe('POST')
    expect(JSON.parse(init.body as string)).toEqual(update)
  })

  it.each([
    [400, 'Ugyldig verdi. Sjekk feltene og prøv igjen.'],
    [403, 'Du har ikke tilgang til å endre dette.'],
    [500, 'Kunne ikke lagre profilen.'],
  ])('explains a %s on update in Norwegian', async (status, message) => {
    fetchMock.mockResolvedValue(new Response(null, { status }))
    vi.stubGlobal('fetch', fetchMock)

    await expect(
      updateProfile({ firstName: 'a', lastName: 'b', birthYear: 1990, gender: 'MALE' }),
    ).rejects.toEqual(new ProfileApiError(message, status))
  })

  it('returns null for a guest without avatar', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 404 }))
    vi.stubGlobal('fetch', fetchMock)

    await expect(fetchAvatarUrl('g1')).resolves.toBeNull()
    expect(fetchMock.mock.calls[0]?.[0]).toBe('/api/guests/g1/avatar')
  })

  it('turns the avatar image into a blob URL', async () => {
    fetchMock.mockResolvedValue(new Response(new Blob(['jpeg'], { type: 'image/jpeg' })))
    vi.stubGlobal('fetch', fetchMock)
    vi.stubGlobal('URL', Object.assign(URL, { createObjectURL: () => 'blob:avatar' }))

    await expect(fetchAvatarUrl('g1')).resolves.toBe('blob:avatar')
  })
})
