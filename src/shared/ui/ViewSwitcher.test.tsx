import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { StrictMode } from 'react'
import { describe, expect, it } from 'vitest'
import App from '@/app/App.tsx'

// ViewSwitcher is rendered at the top of the Kalender tab, so the test goes through the app.
describe('ViewSwitcher', () => {
  it('has the first option active and switches when another is pressed', async () => {
    const user = userEvent.setup()
    render(
      <StrictMode>
        <App />
      </StrictMode>,
    )

    const month = await screen.findByRole('link', { name: 'Måned' })
    const list = screen.getByRole('link', { name: 'Liste' })
    expect(month).toHaveClass('button-active')
    expect(list).not.toHaveClass('button-active')

    await user.click(list)

    expect(list).toHaveClass('button-active')
    expect(month).not.toHaveClass('button-active')
  })
})
