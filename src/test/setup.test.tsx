import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it } from 'vitest'

function Counter() {
  const [count, setCount] = useState(0)
  return (
    <button type="button" onClick={() => setCount(count + 1)}>
      Count is {count}
    </button>
  )
}

// Smoke test of the test tooling itself: jsdom + Testing Library + jest-dom + user-event.
describe('test setup', () => {
  it('renders, handles user events and supports jest-dom matchers', async () => {
    const user = userEvent.setup()
    render(<Counter />)

    const button = screen.getByRole('button', { name: 'Count is 0' })
    expect(button).toBeVisible()

    await user.click(button)

    expect(screen.getByRole('button', { name: 'Count is 1' })).toBeEnabled()
  })
})
