import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { StrictMode } from 'react'
import { afterEach, describe, expect, it } from 'vitest'
import App from '@/app/App.tsx'

// The tab links in the bottom toolbar (other links, e.g. segmented buttons, can share their names).
const tabLink = async (name: string) =>
  within(await screen.findByRole('navigation', { name: 'Hovedmeny' })).getByRole('link', { name })

describe('App', () => {
  afterEach(() => {
    window.history.replaceState(null, '', '/')
  })

  it('renders the home page', async () => {
    // StrictMode, like main.tsx: Framework7 must survive the double mount.
    render(
      <StrictMode>
        <App />
      </StrictMode>,
    )

    expect(await screen.findByText('Gjeldende besøk')).toBeInTheDocument()
  })

  it('has a bottom tab bar with the four main views', async () => {
    render(
      <StrictMode>
        <App />
      </StrictMode>,
    )

    const nav = await screen.findByRole('navigation', { name: 'Hovedmeny' })
    for (const name of ['Hjem', 'Kalender', 'Statistikk', 'Kjøring']) {
      expect(within(nav).getByRole('link', { name })).toBeInTheDocument()
    }
  })

  it('switches view when a tab is pressed', async () => {
    const user = userEvent.setup()
    render(
      <StrictMode>
        <App />
      </StrictMode>,
    )

    await user.click(await tabLink('Kalender'))

    expect(await screen.findByText('Besøk')).toBeInTheDocument()
  })

  it('marks only the selected tab as active', async () => {
    const user = userEvent.setup()
    render(
      <StrictMode>
        <App />
      </StrictMode>,
    )

    await user.click(await tabLink('Kalender'))
    await user.click(await tabLink('Statistikk'))

    await screen.findByText('Dager på hytta per måned')
    const nav = screen.getByRole('navigation', { name: 'Hovedmeny' })
    const active = within(nav)
      .getAllByRole('link')
      .filter((l) => l.classList.contains('tab-link-active'))
    expect(active.map((l) => l.textContent)).toEqual(['Statistikk'])
  })

  it('puts the selected tab path in the URL', async () => {
    const user = userEvent.setup()
    render(
      <StrictMode>
        <App />
      </StrictMode>,
    )

    await user.click(await tabLink('Kjøring'))

    expect(window.location.pathname).toBe('/kjoring/')
  })

  it('opens the tab that matches the URL', async () => {
    window.history.replaceState(null, '', '/statistikk/')
    render(
      <StrictMode>
        <App />
      </StrictMode>,
    )

    const link = await tabLink('Statistikk')

    expect(link).toHaveClass('tab-link-active')
  })
})
