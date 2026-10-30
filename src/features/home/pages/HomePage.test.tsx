import { render, screen } from '@testing-library/react'
import { StrictMode } from 'react'
import { describe, expect, it } from 'vitest'
import App from '@/app/App.tsx'

describe('HomePage', () => {
  it('has a large title and the section structure', async () => {
    render(
      <StrictMode>
        <App />
      </StrictMode>,
    )

    // The large Framework7 title is rendered twice (collapsed and large).
    expect((await screen.findAllByText('Hytteportalen')).length).toBeGreaterThan(0)
    for (const section of ['Gjeldende besøk', 'Neste besøk', 'Dette året']) {
      expect(screen.getByText(section)).toBeInTheDocument()
    }
  })

  it('has a decorative photo hero behind the title', async () => {
    const { container } = render(
      <StrictMode>
        <App />
      </StrictMode>,
    )

    await screen.findByText('Gjeldende besøk')

    const hero = container.querySelector<HTMLElement>('.home-hero')
    expect(hero).toHaveAttribute('aria-hidden', 'true')
    expect(hero?.style.getPropertyValue('--hero-image')).toMatch(/\/images\/hero-\w+\.webp/)
  })
})
