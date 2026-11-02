import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { f7 } from 'framework7-react'
import { StrictMode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import App from '@/app/App.tsx'
import type {
  CurrentYearStats,
  LiveStats,
  ReservationGuest,
} from '@/features/home/api/stats-api.ts'

const guest = (id: string, firstName: string) => ({ guestId: id, firstName }) as ReservationGuest

const year: CurrentYearStats = { year: 2026, visits: 8, totalNights: 32, totalDistanceKm: 1240 }

const empty: LiveStats = {
  isOccupied: false,
  allTimeVisits: 0,
  allTimeNights: 0,
  allTimeUniqueGuests: 0,
  guestFunFacts: [],
  cabinFunFacts: [],
  nextVisitFunFacts: [],
}

const current = {
  startDate: '2026-11-01',
  endDate: '2026-11-03',
  remainingNights: 1,
  reservationOrder: 42,
  reservationOrderInYear: 7,
  guests: [guest('g1', 'Kari'), guest('g2', 'Ola')],
}

const next = {
  startDate: '2026-11-10',
  endDate: '2026-11-12',
  daysUntil: 8,
  reservationOrder: 43,
  reservationOrderInYear: 8,
  guests: ['a', 'b', 'c', 'd', 'e'].map((id) => guest(id, id.toUpperCase())),
}

function stubApi(live: Partial<LiveStats>, yearStats: CurrentYearStats = year) {
  vi.stubGlobal(
    'fetch',
    vi.fn((input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : ''
      if (url === '/api/stats') return Promise.resolve(Response.json({ ...empty, ...live }))
      if (url === '/api/stats/current-year') return Promise.resolve(Response.json(yearStats))
      return Promise.reject(new TypeError('Failed to fetch'))
    }),
  )
}

/** The page shows a skeleton until the data has loaded. */
async function loaded() {
  await waitFor(() => {
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })
}

function renderApp() {
  return render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}

describe('HomePage', () => {
  it('has the logo as large title and a text title for the collapsed bar', async () => {
    stubApi({})
    renderApp()

    expect(await screen.findByRole('img', { name: 'Slomic Smarthytte' })).toHaveAttribute(
      'src',
      '/logo/slomic-full-dark.svg',
    )
    expect(screen.getByText('Slomic smarthytte')).toBeInTheDocument()
  })

  it('shows a skeleton of the sections while the data loads', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => new Promise<Response>(() => undefined)),
    )
    const { container } = renderApp()

    expect(await screen.findByRole('status')).toHaveTextContent('Laster …')
    for (const title of ['Gjeldende besøk', 'Neste besøk', 'Dette året']) {
      expect(screen.getByText(title)).toBeInTheDocument()
    }
    expect(container.querySelectorAll('.skeleton-text').length).toBeGreaterThan(0)
    expect(screen.queryByText('Ingen planlagte besøk')).not.toBeInTheDocument()
  })

  it('replaces the skeleton with the content when the data has loaded', async () => {
    stubApi({})
    const { container } = renderApp()

    expect(await screen.findByText('Ingen planlagte besøk')).toBeInTheDocument()
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    expect(container.querySelector('.skeleton-text')).toBeNull()
  })

  it('shows the empty state and a filled reserve button without reservations', async () => {
    stubApi({})
    renderApp()

    expect(await screen.findByText('Ingen planlagte besøk')).toBeInTheDocument()
    expect(screen.queryByText('Gjeldende besøk')).not.toBeInTheDocument()
    expect(screen.queryByText('Neste besøk')).not.toBeInTheDocument()
    const button = screen.getByRole('link', { name: /Reserver ny/ })
    expect(button).toHaveClass('button-fill')
    // The button sits inside the empty-state card.
    expect(button.closest('.empty-reservations')).not.toBeNull()
  })

  it('shows the current reservation with a tonal reserve button', async () => {
    stubApi({ isOccupied: true, currentReservation: current })
    renderApp()
    await loaded()

    expect(await screen.findByText('Gjeldende besøk')).toBeInTheDocument()
    expect(screen.getByText('søn 1. nov – tir 3. nov')).toBeInTheDocument()
    expect(screen.getByText('På hytta nå · 1 natt igjen')).toBeInTheDocument()
    expect(screen.getByText('#7')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'Gjester: Kari, Ola' })).toBeInTheDocument()
    expect(screen.queryByText('Neste besøk')).not.toBeInTheDocument()
    const button = screen.getByRole('link', { name: /Reserver ny/ })
    expect(button).toHaveClass('button-tonal')
    expect(button.closest('.empty-reservations')).toBeNull()
  })

  it('shows the next reservation alone with a filled reserve button', async () => {
    stubApi({ nextReservation: next })
    renderApp()
    await loaded()

    expect(await screen.findByText('Neste besøk')).toBeInTheDocument()
    expect(screen.getByText('Om 8 dager')).toBeInTheDocument()
    expect(screen.getByText('#8')).toBeInTheDocument()
    expect(screen.queryByText('Gjeldende besøk')).not.toBeInTheDocument()
    expect(screen.queryByText('Ingen planlagte besøk')).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Reserver ny/ })).toHaveClass('button-fill')
  })

  it('shows both reservations, "+N" for extra guests and an outlined reserve button', async () => {
    stubApi({ isOccupied: true, currentReservation: current, nextReservation: next })
    renderApp()
    await loaded()

    expect(await screen.findByText('Gjeldende besøk')).toBeInTheDocument()
    expect(screen.getByText('Neste besøk')).toBeInTheDocument()
    expect(screen.getByText('+1')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Reserver ny/ })).toHaveClass('button-outline')
  })

  it('shows the year statistics', async () => {
    stubApi({})
    renderApp()
    await loaded()

    expect(await screen.findByText('Dette året')).toBeInTheDocument()
    const visits = screen
      .getByText('Besøk', { selector: '.year-stat-label' })
      .closest('.card') as HTMLElement
    expect(within(visits).getByText('8')).toBeInTheDocument()
    const nights = screen
      .getByText('Netter', { selector: '.year-stat-label' })
      .closest('.card') as HTMLElement
    expect(within(nights).getByText('32')).toBeInTheDocument()
    const km = screen
      .getByText('Kjørte km', { selector: '.year-stat-label' })
      .closest('.card') as HTMLElement
    expect(km.querySelector('.year-stat-value')?.textContent).toBe('1\u202f240')
  })

  it('shows 0 when there is no driving distance', async () => {
    stubApi({}, { ...year, totalDistanceKm: null })
    renderApp()
    await loaded()

    const km = (await screen.findByText('Kjørte km', { selector: '.year-stat-label' })).closest(
      '.card',
    ) as HTMLElement
    expect(within(km).getByText('0')).toBeInTheDocument()
  })

  it('offers a retry when the data cannot be loaded', async () => {
    renderApp()

    expect(await screen.findByText('Kunne ikke hente besøkene.')).toBeInTheDocument()
    stubApi({})
    await userEvent.click(screen.getByRole('link', { name: 'Prøv igjen' }))

    expect(await screen.findByText('Ingen planlagte besøk')).toBeInTheDocument()
  })

  it('tells the user when the session has expired', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 401 })))
    renderApp()

    expect(await screen.findByText(/Økten din har utløpt/)).toBeInTheDocument()
  })

  it('has a decorative photo hero behind the title', async () => {
    stubApi({})
    const { container } = renderApp()

    await screen.findByText('Dette året')

    const hero = container.querySelector<HTMLElement>('.home-hero')
    expect(hero).toHaveAttribute('aria-hidden', 'true')
    expect(hero?.style.getPropertyValue('--hero-image')).toMatch(/\/images\/hero-\w+\.webp/)
  })

  it('picks another photo and reloads the data when the page is pulled down to refresh', async () => {
    stubApi({})
    const done = vi.fn()
    const { container } = renderApp()
    await screen.findByText('Dette året')
    const heroImage = () =>
      Array.from(container.querySelectorAll<HTMLElement>('.home-hero'))
        .at(-1)
        ?.style.getPropertyValue('--hero-image')
    const before = heroImage()
    const callsBefore = vi.mocked(fetch).mock.calls.length

    await act(async () => {
      const content = container.querySelector('.page[data-name="home"] .page-content')
      f7.emit('ptrRefresh', content, done)
      await Promise.resolve()
    })

    expect(heroImage()).toMatch(/\/images\/hero-\w+\.webp/)
    expect(heroImage()).not.toBe(before)
    expect(done).toHaveBeenCalled()
    expect(vi.mocked(fetch).mock.calls.length).toBeGreaterThan(callsBefore)
  })
})
