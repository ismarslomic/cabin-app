import { act, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { Router } from 'framework7/types'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { resetProfileStore, setProfile } from '@/features/profile/api/profile-store.ts'
import type { Profile } from '@/features/profile/api/types.ts'
import EditProfilePage from '@/features/profile/pages/EditProfilePage.tsx'
import { renderWithF7 } from '@/test/render-f7.tsx'

const profile = {
  id: 'g1',
  firstName: 'Kari',
  lastName: 'Nordmann',
  birthYear: 1985,
  gender: 'FEMALE',
  version: 3,
  avatarUrl: null,
} as Profile

/** The page only goes back, so a fake of the Framework7 router is enough. */
function fakeRouter() {
  const back = vi.fn()
  return { back, router: { back } as unknown as Router.Router }
}

/** A save that has not been answered yet; `answer` ends it. */
function pendingSave() {
  let answer: (response: Response) => void = () => undefined
  vi.stubGlobal(
    'fetch',
    vi.fn(
      () =>
        new Promise<Response>((resolve) => {
          answer = resolve
        }),
    ),
  )
  return (response: Response) => {
    answer(response)
  }
}

describe('EditProfilePage', () => {
  afterEach(() => {
    resetProfileStore()
  })

  it('has the back link, and a check that is dimmed until something is changed', async () => {
    act(() => {
      setProfile(profile)
    })
    renderWithF7(<EditProfilePage f7router={fakeRouter().router} />)

    expect(await screen.findByText('Rediger profil')).toBeInTheDocument()
    // Framework7's back link (an icon without a text): the same as on the Profile page.
    expect(document.body.querySelector('.navbar .link.back')).toBeInTheDocument()
    const save = screen.getByRole('link', { name: 'Lagre' })
    expect(save).toHaveAttribute('aria-disabled', 'true')

    await userEvent.type(screen.getByDisplayValue('Kari'), 'x')

    expect(save).toHaveAttribute('aria-disabled', 'false')
  })

  it('shows the back link and a dimmed check also while the profile loads', async () => {
    renderWithF7(<EditProfilePage f7router={fakeRouter().router} />)

    expect(await screen.findByRole('link', { name: 'Lagre' })).toHaveAttribute(
      'aria-disabled',
      'true',
    )
    expect(document.body.querySelector('.navbar .link.back')).toBeInTheDocument()
  })

  it('shows that it is saving, and goes back when the answer comes', async () => {
    act(() => {
      setProfile(profile)
    })
    const answer = pendingSave()
    const { back, router } = fakeRouter()
    renderWithF7(<EditProfilePage f7router={router} />)
    await userEvent.type(await screen.findByDisplayValue('Kari'), 'x')

    await userEvent.click(screen.getByRole('link', { name: 'Lagre' }))
    const save = screen.getByRole('link', { name: 'Lagre' })
    expect(save).toHaveAttribute('aria-busy', 'true')
    expect(document.body.querySelector('.preloader')).toBeInTheDocument()
    expect(back).not.toHaveBeenCalled()

    answer(Response.json({ ...profile, firstName: 'Karix', version: 4 }))
    await vi.waitFor(() => {
      expect(back).toHaveBeenCalledOnce()
    })
  })

  it('does not go back a second time when the page was left while the save ran', async () => {
    act(() => {
      setProfile(profile)
    })
    const answer = pendingSave()
    const { back, router } = fakeRouter()
    const { unmount } = renderWithF7(<EditProfilePage f7router={router} />)
    await userEvent.type(await screen.findByDisplayValue('Kari'), 'x')
    await userEvent.click(screen.getByRole('link', { name: 'Lagre' }))

    // Swiped back (the page is gone) before the answer.
    unmount()
    answer(Response.json({ ...profile, firstName: 'Karix', version: 4 }))
    await new Promise((resolve) => setTimeout(resolve, 20))

    expect(back).not.toHaveBeenCalled()
  })
})
