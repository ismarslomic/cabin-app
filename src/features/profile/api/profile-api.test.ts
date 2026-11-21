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

  it('puts the update with the version and returns the saved profile', async () => {
    fetchMock.mockResolvedValue(Response.json({ id: 'g1', firstName: 'Kari', version: 4 }))
    vi.stubGlobal('fetch', fetchMock)
    const update = {
      firstName: 'Kari',
      lastName: 'Nordmann',
      birthYear: 1985,
      gender: 'FEMALE' as const,
    }

    await expect(updateProfile(update, 3)).resolves.toMatchObject({ id: 'g1', version: 4 })

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('/api/me')
    expect(init.method).toBe('PUT')
    expect(JSON.parse(init.body as string)).toEqual({ ...update, version: 3 })
  })

  const conflict =
    'Profilen ble endret et annet sted. Vi har hentet nyeste versjon, sjekk og lagre på nytt.'
  it.each([
    [400, undefined, 'Ugyldig verdi. Sjekk feltene og prøv igjen.'],
    [400, 'INVALID_REQUEST', 'Ugyldig verdi. Sjekk feltene og prøv igjen.'],
    [403, undefined, 'Du har ikke tilgang til appen.'],
    [412, 'VERSION_MISMATCH', conflict],
    [412, undefined, conflict],
    [413, 'BODY_TOO_LARGE', 'Kunne ikke lagre profilen.'],
    [500, undefined, 'Kunne ikke lagre profilen.'],
  ])('explains a %s (%s) on update in Norwegian', async (status, code, message) => {
    fetchMock.mockResolvedValue(
      code
        ? Response.json({ code, message: 'English' }, { status })
        : new Response(null, { status }),
    )
    vi.stubGlobal('fetch', fetchMock)

    await expect(
      updateProfile({ firstName: 'a', lastName: 'b', birthYear: 1990, gender: 'MALE' }, 1),
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
