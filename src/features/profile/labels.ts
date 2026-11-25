import type { AppRole, Gender } from '@/features/profile/api/types.ts'

export const roleLabels: Record<AppRole, string> = {
  ADMIN: 'Administrator',
  FAMILY_USER: 'Familie',
  GUEST_USER: 'Gjest',
}

export const genderLabels: Record<Gender, string> = {
  MALE: 'Mann',
  FEMALE: 'Kvinne',
}
