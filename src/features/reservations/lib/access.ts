import type { components } from '@/shared/api/schema.ts'

type AppRole = components['schemas']['MeResponse']['role']

/**
 * Whether a role may create reservations (the API answers 403 for a guest user).
 *
 * @example
 * canCreateReservation('FAMILY_USER') // true
 */
export function canCreateReservation(role: AppRole): boolean {
  return role === 'ADMIN' || role === 'FAMILY_USER'
}
