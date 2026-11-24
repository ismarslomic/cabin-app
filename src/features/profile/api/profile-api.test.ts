import { afterEach, describe, expect, it, vi } from 'vitest'
import { fetchAvatarUrl, fetchProfile, updateProfile } from '@/features/profile/api/profile-api.ts'
import { ApiRequestError } from '@/shared/lib/api-error.ts'
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

  it.each([
    [400, undefined],
    [412, 'VERSION_MISMATCH'],
    [500, undefined],
  ])('throws the status and code of a failed update (%s, %s)', async (status, code) => {
    fetchMock.mockResolvedValue(
      code
        ? Response.json({ code, message: 'English' }, { status })
        : new Response(null, { status }),
    )
    vi.stubGlobal('fetch', fetchMock)

    await expect(
      updateProfile({ firstName: 'a', lastName: 'b', birthYear: 1990, gender: 'MALE' }, 1),
    ).rejects.toEqual(new ApiRequestError(status, code))
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
