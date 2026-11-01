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

export const MIN_BIRTH_YEAR = 1900

/** A birth year as an integer between 1900 and the current year, or null when it is not valid. */
export function parseBirthYear(
  value: string,
  currentYear = new Date().getFullYear(),
): number | null {
  if (!/^\d{4}$/.test(value.trim())) return null
  const year = Number(value)
  return year >= MIN_BIRTH_YEAR && year <= currentYear ? year : null
}
