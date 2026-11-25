import { isTimeBefore, isTimeOfDay } from '@/shared/lib/times.ts'

/**
 * The times of day a reservation may have, as Oslo wall-clock time. Times are limited to 02:00 or
 * later (`MIN_TIME_OSLO`), so the Oslo date and the UTC date of an instant are always the same day.
 */

/** Default arrival and departure, as Oslo wall-clock time (`osloToInstant` makes them UTC). */
export const DEFAULT_ARRIVAL_TIME_OSLO = '16:00'
export const DEFAULT_DEPARTURE_TIME_OSLO = '13:00'
/** Earliest time of day. Before 02:00 Oslo time the UTC date is the day before. */
export const MIN_TIME_OSLO = '02:00'

/**
 * `HH:mm` from 02:00 to 23:59.
 *
 * @example
 * isAllowedTime('16:00') // true
 * isAllowedTime('01:59') // false (before 02:00)
 * isAllowedTime('24:00') // false (not a time)
 */
export function isAllowedTime(time: string): boolean {
  return isTimeOfDay(time) && !isTimeBefore(time, MIN_TIME_OSLO)
}
