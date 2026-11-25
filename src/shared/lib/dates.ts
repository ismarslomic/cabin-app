import { TZDate } from '@date-fns/tz'
import {
  addDays as addDaysTo,
  addYears as addYearsTo,
  differenceInCalendarDays,
  format,
  getISODay,
  getYear,
  isSameYear,
  isWithinInterval,
  parseISO,
} from 'date-fns'
import { nb } from 'date-fns/locale/nb'

/**
 * Plain calendar dates (`yyyy-MM-dd`) and how the app writes them, on top of date-fns. The whole
 * app talks about Oslo time; the API reports dates as strings and wants UTC instants. Never write
 * date arithmetic, DST or time zone code by hand: use these helpers or date-fns.
 */

export const OSLO_TIME_ZONE = 'Europe/Oslo'
export const ISO_DATE_FORMAT = 'yyyy-MM-dd'

/**
 * A `Date` from a date picker (local midnight) as `yyyy-MM-dd`.
 *
 * @example
 * toIsoDate(new Date(2026, 0, 5)) // '2026-01-05'
 */
export function toIsoDate(date: Date): string {
  return format(date, ISO_DATE_FORMAT)
}

/**
 * The `Date` (local midnight) for a `yyyy-MM-dd`, for date pickers.
 *
 * @example
 * fromIsoDate('2026-01-05') // new Date(2026, 0, 5)
 */
export function fromIsoDate(iso: string): Date {
  return parseISO(iso)
}

/**
 * Adds days (negative subtracts), across month and year borders.
 *
 * @example
 * addDays('2026-12-30', 3) // '2027-01-02'
 * addDays('2026-03-01', -1) // '2026-02-28'
 */
export function addDays(iso: string, days: number): string {
  return toIsoDate(addDaysTo(parseISO(iso), days))
}

/**
 * Adds years; 29 February in a year without one becomes 28 February.
 *
 * @example
 * addYears('2026-11-23', 2) // '2028-11-23'
 * addYears('2028-02-29', 2) // '2030-02-28'
 */
export function addYears(iso: string, years: number): string {
  return toIsoDate(addYearsTo(parseISO(iso), years))
}

/**
 * ISO weekday: 1 is Monday, 7 is Sunday.
 *
 * @example
 * isoWeekday('2026-11-23') // 1 (Monday)
 * isoWeekday('2026-11-29') // 7 (Sunday)
 */
export function isoWeekday(iso: string): number {
  return getISODay(parseISO(iso))
}

/**
 * Nights between two dates (end minus start).
 *
 * @example
 * nightsBetween('2026-11-27', '2026-11-29') // 2
 */
export function nightsBetween(start: string, end: string): number {
  return differenceInCalendarDays(parseISO(end), parseISO(start))
}

/**
 * "1 natt", "2 netter".
 *
 * @example
 * nightsLabel(1) // '1 natt'
 * nightsLabel(2) // '2 netter'
 */
export function nightsLabel(nights: number): string {
  return nights === 1 ? '1 natt' : `${nights} netter`
}

/**
 * Whether a date is between two dates, both ends included.
 *
 * @example
 * isDateWithin('2026-12-05', '2026-12-04', '2026-12-06') // true
 * isDateWithin('2026-12-06', '2026-12-04', '2026-12-06') // true (the last day counts)
 * isDateWithin('2026-12-07', '2026-12-04', '2026-12-06') // false
 */
export function isDateWithin(date: string, start: string, end: string): boolean {
  return isWithinInterval(parseISO(date), { start: parseISO(start), end: parseISO(end) })
}

/**
 * Today's date in Oslo, which can differ from the UTC date late in the evening.
 *
 * @example
 * todayInOslo(new Date('2026-11-22T23:30:00Z')) // '2026-11-23'
 */
export function todayInOslo(now: Date = new Date()): string {
  return format(new TZDate(now, OSLO_TIME_ZONE), ISO_DATE_FORMAT)
}

/**
 * The current year in Oslo, which differs from the UTC year in the first hours of a new year.
 *
 * @example
 * currentYearInOslo(new Date('2026-12-31T23:30:00Z')) // 2027
 */
export function currentYearInOslo(now: Date = new Date()): number {
  return getYear(parseISO(todayInOslo(now)))
}

/**
 * A date in Norwegian: weekday, day and month. The year is added when it is not the year of
 * `today` (a parameter, so callers and tests control the clock).
 *
 * @example
 * formatDate('2026-11-27', '2026-11-23') // 'fre 27. nov.'
 * formatDate('2027-01-02', '2026-11-23') // 'lør 2. jan. 2027'
 */
export function formatDate(iso: string, today: string): string {
  const date = parseISO(iso)
  const pattern = isSameYear(date, parseISO(today)) ? 'EEE d. MMM' : 'EEE d. MMM yyyy'
  return format(date, pattern, { locale: nb })
}

/**
 * Two dates as a range.
 *
 * @example
 * formatDateRange('2026-10-31', '2026-11-02', '2026-10-31') // 'lør 31. okt. – man 2. nov.'
 */
export function formatDateRange(start: string, end: string, today: string): string {
  return `${formatDate(start, today)} – ${formatDate(end, today)}`
}
