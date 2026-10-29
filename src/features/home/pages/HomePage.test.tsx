import { render, screen } from '@testing-library/react'
import { StrictMode } from 'react'
import { describe, expect, it } from 'vitest'
import App from '@/app/App.tsx'

describe('HomePage', () => {
  it('renders a decorative lucide icon next to the welcome text', async () => {
    const { container } = render(
      <StrictMode>
        <App />
      </StrictMode>,
    )

    await screen.findByText('Velkommen til smarthytta.')

    const icon = container.querySelector('svg.lucide-house')
    expect(icon).toBeInTheDocument()
    expect(icon).toHaveAttribute('aria-hidden', 'true')
  })
})
