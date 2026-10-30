import { render, screen } from '@testing-library/react'
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

    const { container } = render(<Avatar guestId="g1" size={32} />)

    await vi.waitFor(() => {
      expect(container.querySelector('img')).toHaveAttribute('src', 'blob:photo')
    })
  })

  it('keeps the person icon when the guest has no photo', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 404 }))
    vi.stubGlobal('fetch', fetchMock)

    const { container } = render(<Avatar guestId="g2" size={32} />)

    await vi.waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('/api/guests/g2/avatar', expect.anything())
    })
    expect(container.querySelector('img')).toBeNull()
    expect(container.querySelector('svg')).toBeInTheDocument()
  })

  it('does not fetch without a guest id', () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    render(<Avatar size={32} />)

    expect(fetchMock).not.toHaveBeenCalled()
    expect(screen.queryByRole('img')).toBeNull()
  })
})
