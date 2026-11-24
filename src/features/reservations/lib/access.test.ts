import { describe, expect, it } from 'vitest'
import { canCreateReservation } from '@/features/reservations/lib/access.ts'

describe('canCreateReservation', () => {
  it('lets an admin and a family user create reservations', () => {
    expect(canCreateReservation('ADMIN')).toBe(true)
    expect(canCreateReservation('FAMILY_USER')).toBe(true)
  })

  it('does not let a guest user', () => {
    expect(canCreateReservation('GUEST_USER')).toBe(false)
  })
})
