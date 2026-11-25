import { useProfile } from '@/features/profile/index.ts'
import { canCreateReservation } from '@/features/reservations/lib/access.ts'

/** Whether to show a way to reserve: only once the profile is known and its role may. */
export function useCanReserve(): boolean {
  const profile = useProfile()
  return profile.status === 'ready' && canCreateReservation(profile.profile.role)
}
