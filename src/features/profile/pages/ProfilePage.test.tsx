import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { f7 } from 'framework7-react'
import { StrictMode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from '@/app/App.tsx'
import { resetProfileStore } from '@/features/profile/api/profile-store.ts'
import type { Profile } from '@/features/profile/api/types.ts'

const profile: Profile = {
  id: 'g1',
  name: 'Kari Nordmann',
  firstName: 'Kari',
  lastName: 'Nordmann',
  email: 'kari@example.com',
  birthYear: 1985,
  gender: 'FEMALE',
  isFamily: true,
  role: 'FAMILY_USER',
}

/** Answers the API calls of the app; `posts` collects the update bodies. */
function stubApi(options: { me?: () => Response; posts?: unknown[]; update?: Response } = {}) {
  const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : ''
    if (url === '/api/me' && init?.method === 'POST') {
      options.posts?.push(JSON.parse(init.body as string))
      return Promise.resolve(options.update ?? Response.json(profile))
    }
    if (url === '/api/me') return Promise.resolve(options.me?.() ?? Response.json(profile))
    return Promise.resolve(new Response(null, { status: 404 }))
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

const openEditPage = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(await screen.findByRole('link', { name: 'Rediger' }))
  await screen.findByRole('textbox', { name: 'Fornavn' })
}

const openProfile = async () => {
  const user = userEvent.setup()
  render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
  const links = await screen.findAllByRole('link', { name: 'Profil' })
  // jsdom has no CSS transitions, so a Framework7 page transition would never finish.
  ;(f7.views as unknown as { params: { animate: boolean } }[]).forEach((view) => {
    view.params.animate = false
  })
  await user.click(links[0])
  await vi.waitFor(() => {
    expect(document.querySelector('.page[data-name="profile"]')).not.toBeNull()
  })
  return user
}

describe('profile', () => {
  beforeEach(() => {
    resetProfileStore()
  })
  afterEach(() => {
    window.history.replaceState(null, '', '/')
  })

  it('opens from the avatar in the navbar and shows the profile', async () => {
    stubApi()

    await openProfile()

    const list = await screen.findByRole('list')
    expect(await within(list).findByText('kari@example.com')).toBeInTheDocument()
    for (const text of ['1985', 'Kvinne', 'Ja']) {
      expect(within(list).getByText(text)).toBeInTheDocument()
    }
    // The title "Familie" and the role "Familie".
    expect(within(list).getAllByText('Familie')).toHaveLength(2)
  })

  it('says so when the session has expired', async () => {
    stubApi({ me: () => new Response(null, { status: 401 }) })

    await openProfile()

    expect(await screen.findByText(/Økten din har utløpt/)).toBeInTheDocument()
  })

  it('lets the user try again after an error', async () => {
    let fail = true
    stubApi({ me: () => (fail ? new Response(null, { status: 500 }) : Response.json(profile)) })
    const user = await openProfile()

    await screen.findByText('Kunne ikke hente profilen.')
    fail = false
    await user.click(screen.getByRole('link', { name: 'Prøv igjen' }))

    expect(await screen.findByText('kari@example.com')).toBeInTheDocument()
  })

  it('saves the changes from the edit page', async () => {
    const posts: unknown[] = []
    stubApi({ posts })
    const user = await openProfile()

    await openEditPage(user)
    const firstName = screen.getByRole('textbox', { name: 'Fornavn' })
    await user.clear(firstName)
    await user.type(firstName, 'Kristin')
    await user.selectOptions(screen.getByRole('combobox', { name: 'Kjønn' }), 'MALE')
    await user.click(screen.getByRole('link', { name: 'Lagre' }))

    await vi.waitFor(() => {
      expect(posts).toEqual([
        { firstName: 'Kristin', lastName: 'Nordmann', birthYear: 1985, gender: 'MALE' },
      ])
    })
  })

  it('blocks saving an invalid birth year', async () => {
    stubApi()
    const user = await openProfile()

    await openEditPage(user)
    const year = screen.getByRole('textbox', { name: 'Fødselsår' })
    await user.clear(year)
    await user.type(year, '1800')

    expect(screen.getByRole('link', { name: 'Lagre' })).toHaveClass('disabled')
  })

  it('shows the server error when saving fails', async () => {
    stubApi({ update: new Response(null, { status: 403 }) })
    const user = await openProfile()

    await openEditPage(user)
    await user.click(screen.getByRole('link', { name: 'Lagre' }))

    expect(await screen.findByText('Du har ikke tilgang til appen.')).toBeInTheDocument()
  })
})
