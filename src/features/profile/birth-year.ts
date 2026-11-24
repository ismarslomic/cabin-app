import { currentYearInOslo } from '@/shared/lib/dates.ts'
import { isNumber } from '@/shared/lib/numbers.ts'

const MIN_BIRTH_YEAR = 1900

/** A birth year as an integer between 1900 and the current year, or null when it is not valid. */
export function parseBirthYear(value: string, currentYear = currentYearInOslo()): number | null {
  const text = value.trim()
  if (!isNumber(text)) return null
  const year = Number(text)
  const isInRange = year >= MIN_BIRTH_YEAR && year <= currentYear
  return Number.isInteger(year) && isInRange ? year : null
}

/**
 * The text under the birth year field when the year is not valid. The upper limit is read when the
 * text is built, so it follows the Oslo year, also for a page left open over New Year.
 *
 * @example
 * birthYearErrorMessage(2026) // 'Skriv et årstall mellom 1900 og 2026'
 */
export function birthYearErrorMessage(currentYear = currentYearInOslo()): string {
  return `Skriv et årstall mellom ${MIN_BIRTH_YEAR} og ${currentYear}`
}
