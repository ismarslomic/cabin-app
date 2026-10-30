import { act, render, screen } from '@testing-library/react'
import { f7 } from 'framework7-react'
import { StrictMode } from 'react'
import { describe, expect, it, vi } from 'vitest'
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

  it('picks another photo when the page is pulled down to refresh', async () => {
    const done = vi.fn()
    const { container } = render(
      <StrictMode>
        <App />
      </StrictMode>,
    )
    await screen.findByText('Gjeldende besøk')
    const heroImage = () =>
      Array.from(container.querySelectorAll<HTMLElement>('.home-hero'))
        .at(-1)
        ?.style.getPropertyValue('--hero-image')
    const before = heroImage()

    await act(async () => {
      const content = container.querySelector('.page[data-name="home"] .page-content')
      f7.emit('ptrRefresh', content, done)
      await Promise.resolve()
    })

    expect(heroImage()).toMatch(/\/images\/hero-\w+\.webp/)
    expect(heroImage()).not.toBe(before)
    expect(done).toHaveBeenCalled()
  })
})
