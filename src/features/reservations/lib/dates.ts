import { TZDate } from '@date-fns/tz'
import {
  addDays as addDaysTo,
  addYears as addYearsTo,
  differenceInCalendarDays,
  format,
  getISODay,
  isBefore,
  isValid,
  isWithinInterval,
  parse,
  parseISO,
} from 'date-fns'

/**
 * Plain calendar dates (`yyyy-MM-dd`) and Oslo wall-clock times, on top of date-fns. The app only
 * talks about Oslo time; the API wants UTC instants. Times are limited to 02:00 or later (see
 * `MIN_TIME`), so the Oslo date and the UTC date of an instant are always the same day.
 */

const OSLO = 'Europe/Oslo'
const DATE_FORMAT = 'yyyy-MM-dd'
const TIME_FORMAT = 'HH:mm'

/** Earliest time of day. Before 02:00 Oslo time the UTC date is the day before. */
export const MIN_TIME = '02:00'

/**
 * A `Date` from a date picker (local midnight) as `yyyy-MM-dd`.
 *
 * @example
 * toIsoDate(new Date(2026, 0, 5)) // '2026-01-05'
 */
export function toIsoDate(date: Date): string {
  return format(date, DATE_FORMAT)
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
  return format(new TZDate(now, OSLO), DATE_FORMAT)
}

/**
 * The UTC instant (ISO 8601) of an Oslo date and time. A time that does not exist (the hour the
 * clocks go forward) becomes the time an hour later.
 *
 * @example
 * osloToInstant('2026-01-10', '16:00') // '2026-01-10T15:00:00Z' (winter, UTC+1)
 * osloToInstant('2026-07-10', '16:00') // '2026-07-10T14:00:00Z' (summer, UTC+2)
 */
export function osloToInstant(date: string, time: string): string {
  // With a TZDate as reference, `parse` reads the date and time as Oslo time.
  const parsed = parse(`${date} ${time}`, `${DATE_FORMAT} ${TIME_FORMAT}`, new TZDate(0, OSLO))
  return new Date(parsed.getTime()).toISOString().replace('.000Z', 'Z')
}

/**
 * `HH:mm` from 02:00 to 23:59.
 *
 * @example
 * isAllowedTime('16:00') // true
 * isAllowedTime('01:59') // false (before 02:00)
 * isAllowedTime('24:00') // false (not a time)
 * isAllowedTime('9:00') // false (must be two digits: '09:00')
 */
export function isAllowedTime(time: string): boolean {
  const reference = new Date(0)
  const parsed = parse(time, TIME_FORMAT, reference)
  // `parse` also accepts "9:00"; formatting it back keeps only the exact `HH:mm`.
  return (
    isValid(parsed) &&
    format(parsed, TIME_FORMAT) === time &&
    !isBefore(parsed, parse(MIN_TIME, TIME_FORMAT, reference))
  )
}
