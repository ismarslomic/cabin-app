import { TZDate } from '@date-fns/tz'
import { format, isValid, parse } from 'date-fns'
import { ISO_DATE_FORMAT, OSLO_TIME_ZONE } from '@/shared/lib/dates.ts'

/** Times of day (`HH:mm`) as Oslo wall-clock time, and their UTC instants for the API. */

const TIME_FORMAT = 'HH:mm'

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
  const parsed = parse(
    `${date} ${time}`,
    `${ISO_DATE_FORMAT} ${TIME_FORMAT}`,
    new TZDate(0, OSLO_TIME_ZONE),
  )
  return new Date(parsed.getTime()).toISOString().replace('.000Z', 'Z')
}

/**
 * Whether a string is a time of day written exactly as `HH:mm`, from 00:00 to 23:59.
 *
 * @example
 * isTimeOfDay('16:00') // true
 * isTimeOfDay('24:00') // false (not a time)
 * isTimeOfDay('9:00') // false (must be two digits: '09:00')
 */
export function isTimeOfDay(time: string): boolean {
  const parsed = parse(time, TIME_FORMAT, new Date(0))
  // `parse` also accepts "9:00"; formatting it back keeps only the exact `HH:mm`.
  return isValid(parsed) && format(parsed, TIME_FORMAT) === time
}

/**
 * Whether the time of day `time` is earlier than `other` (both `HH:mm`).
 *
 * @example
 * isTimeBefore('01:59', '02:00') // true
 * isTimeBefore('02:00', '02:00') // false
 */
export function isTimeBefore(time: string, other: string): boolean {
  const reference = new Date(0)
  return (
    parse(time, TIME_FORMAT, reference).getTime() < parse(other, TIME_FORMAT, reference).getTime()
  )
}
