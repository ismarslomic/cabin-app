import { render, screen } from '@testing-library/react'
import { StrictMode } from 'react'
import { describe, expect, it } from 'vitest'
import App from '@/app/App.tsx'

describe('App', () => {
  it('renders the home page', async () => {
    // StrictMode, like main.tsx: Framework7 must survive the double mount.
    render(
      <StrictMode>
        <App />
      </StrictMode>,
    )

    expect(await screen.findByText('Velkommen til smarthytta.')).toBeInTheDocument()
  })
})
