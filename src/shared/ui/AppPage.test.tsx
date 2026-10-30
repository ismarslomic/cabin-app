import { render, screen } from '@testing-library/react'
import { StrictMode } from 'react'
import { describe, expect, it } from 'vitest'
import App from '@/app/App.tsx'

describe('AppPage', () => {
  it('enables pull-to-refresh on every tab page', async () => {
    const { container } = render(
      <StrictMode>
        <App />
      </StrictMode>,
    )

    await screen.findByText('Gjeldende besøk')

    // Hjem, Kalender, Statistikk and Kjøring.
    expect(container.querySelectorAll('.page-content.ptr-content')).toHaveLength(4)
  })
})
