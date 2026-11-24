import { render } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { resetProfileStore } from '@/features/profile/api/profile-store.ts'
import Avatar from '@/features/profile/components/Avatar.tsx'

describe('Avatar', () => {
  beforeEach(() => {
    resetProfileStore()
  })

  it('shows the guest photo once it is loaded', async () => {
    vi.stubGlobal('URL', Object.assign(URL, { createObjectURL: () => 'blob:photo' }))
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(new Blob(['jpeg'], { type: 'image/jpeg' }))),
    )

    const { container } = render(<Avatar avatarUrl="/api/guests/g1/avatar?v=1" size={32} />)

    await vi.waitFor(() => {
      expect(container.querySelector('img')).toHaveAttribute('src', 'blob:photo')
    })
  })

  it('keeps the person icon when the guest has no photo', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 404 }))
    vi.stubGlobal('fetch', fetchMock)

    const { container } = render(<Avatar avatarUrl="/api/guests/g2/avatar?v=1" size={32} />)

    await vi.waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('/api/guests/g2/avatar?v=1', expect.anything())
    })
    expect(container.querySelector('img')).toBeNull()
    expect(container.querySelector('svg')).toBeInTheDocument()
  })

  it.each([null, undefined])('does not fetch for a guest without an avatar (%s)', (avatarUrl) => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    const { container } = render(<Avatar avatarUrl={avatarUrl} size={32} />)

    expect(fetchMock).not.toHaveBeenCalled()
    expect(container.querySelector('img')).toBeNull()
    expect(container.querySelector('svg')).toBeInTheDocument()
  })

  it('shows the new image when the avatar URL changes, and not the old one in between', async () => {
    const urls: Record<string, string> = {
      '/api/guests/g3/avatar?v=1': 'blob:one',
      '/api/guests/g3/avatar?v=2': 'blob:two',
    }
    let next = 'blob:one'
    vi.stubGlobal('URL', Object.assign(URL, { createObjectURL: () => next }))
    vi.stubGlobal(
      'fetch',
      vi.fn((url: string) => {
        next = urls[url] ?? 'blob:unknown'
        return Promise.resolve(new Response(new Blob(['jpeg'], { type: 'image/jpeg' })))
      }),
    )

    const { container, rerender } = render(
      <Avatar avatarUrl="/api/guests/g3/avatar?v=1" size={32} />,
    )
    await vi.waitFor(() => {
      expect(container.querySelector('img')).toHaveAttribute('src', 'blob:one')
    })
    rerender(<Avatar avatarUrl="/api/guests/g3/avatar?v=2" size={32} />)

    // At once the old image is gone (the person icon), then the new one comes.
    expect(container.querySelector('img')).toBeNull()
    await vi.waitFor(() => {
      expect(container.querySelector('img')).toHaveAttribute('src', 'blob:two')
    })
  })

  it('tries again on the next mount after a failed load', async () => {
    vi.stubGlobal('URL', Object.assign(URL, { createObjectURL: () => 'blob:late' }))
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockImplementation(() =>
        Promise.resolve(new Response(new Blob(['jpeg'], { type: 'image/jpeg' }))),
      )
    vi.stubGlobal('fetch', fetchMock)

    const first = render(<Avatar avatarUrl="/api/guests/g4/avatar?v=1" size={32} />)
    await vi.waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1)
    })
    // Let the failure be handled (the failed load is dropped from the cache) before the next mount.
    await new Promise((resolve) => setTimeout(resolve, 0))
    first.unmount()
    const { container } = render(<Avatar avatarUrl="/api/guests/g4/avatar?v=1" size={32} />)

    await vi.waitFor(() => {
      expect(container.querySelector('img')).toHaveAttribute('src', 'blob:late')
    })
  })
})
