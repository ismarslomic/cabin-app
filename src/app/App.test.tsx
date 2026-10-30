import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { StrictMode } from 'react'
import { afterEach, describe, expect, it } from 'vitest'
import App from '@/app/App.tsx'

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

    expect(await screen.findByText('Velkommen til smarthytta.')).toBeInTheDocument()
  })

  it('has a bottom tab bar with the four main views', async () => {
    render(
      <StrictMode>
        <App />
      </StrictMode>,
    )

    for (const name of ['Hjem', 'Kalender', 'Statistikk', 'Kjøring']) {
      expect(await screen.findByRole('link', { name })).toBeInTheDocument()
    }
  })

  it('switches view when a tab is pressed', async () => {
    const user = userEvent.setup()
    render(
      <StrictMode>
        <App />
      </StrictMode>,
    )

    await user.click(await screen.findByRole('link', { name: 'Kalender' }))

    expect(await screen.findByText('Kalender kommer snart.')).toBeInTheDocument()
  })

  it('marks only the selected tab as active', async () => {
    const user = userEvent.setup()
    render(
      <StrictMode>
        <App />
      </StrictMode>,
    )

    await user.click(await screen.findByRole('link', { name: 'Kalender' }))
    await user.click(screen.getByRole('link', { name: 'Statistikk' }))

    await screen.findByText('Statistikk kommer snart.')
    const active = screen
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

    await user.click(await screen.findByRole('link', { name: 'Kjøring' }))

    expect(window.location.pathname).toBe('/kjoring/')
  })

  it('opens the tab that matches the URL', async () => {
    window.history.replaceState(null, '', '/statistikk/')
    render(
      <StrictMode>
        <App />
      </StrictMode>,
    )

    const link = await screen.findByRole('link', { name: 'Statistikk' })

    expect(link).toHaveClass('tab-link-active')
  })
})
