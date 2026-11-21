import { render, screen } from '@testing-library/react'
import { StrictMode } from 'react'
import { describe, expect, it } from 'vitest'
import type { ReservationGuest } from '@/features/home/api/stats-api.ts'
import AvatarStack from '@/features/home/components/AvatarStack.tsx'

const guest = (id: string, firstName: string, start: string, end: string) =>
  ({ guestId: id, firstName, stayStartDate: start, stayEndDate: end }) as ReservationGuest

const guests = [
  guest('g1', 'Kari', '2026-11-01', '2026-11-03'),
  guest('g2', 'Ola', '2026-11-02', '2026-11-03'),
]

const renderStack = (today?: string) =>
  render(
    <StrictMode>
      <AvatarStack guests={guests} today={today} />
    </StrictMode>,
  )

describe('AvatarStack', () => {
  it('names the guests and dims those not at the cabin today', () => {
    const { container } = renderStack('2026-11-01')

    expect(screen.getByRole('img', { name: 'Gjester: Kari, Ola' })).toBeVisible()
    expect(container.querySelectorAll('.avatar-stack-absent')).toHaveLength(1)
  })

  it('dims nobody without a date', () => {
    const { container } = renderStack()

    expect(screen.getByRole('img', { name: 'Gjester: Kari, Ola' })).toBeVisible()
    expect(container.querySelector('.avatar-stack-absent')).toBeNull()
  })
})
