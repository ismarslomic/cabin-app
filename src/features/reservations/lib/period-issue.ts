import { type PeriodProblem, periodProblemTexts } from '@/features/reservations/api/error-texts.ts'
import type { Reservation } from '@/features/reservations/api/types.ts'
import type { DraftPeriod } from '@/features/reservations/lib/draft.ts'
import { periodProblem } from '@/features/reservations/lib/period.ts'
import { isAllowedTime, MIN_TIME_OSLO } from '@/features/reservations/lib/times.ts'

const timeText = `Velg et tidspunkt mellom ${MIN_TIME_OSLO} og 23:59.`

/**
 * What is wrong with the period, as a text for the user, or undefined when it can be sent. A
 * problem with the dates comes first (also one the server reported, `serverProblem`), then a time
 * that is not allowed.
 *
 * @example
 * periodIssueText(period, '2026-11-23', reservations) // 'Perioden overlapper en annen ...'
 */
export function periodIssueText(
  period: DraftPeriod,
  today: string,
  reservations: Reservation[],
  serverProblem?: PeriodProblem,
): string | undefined {
  const problem =
    periodProblem(period.startDate, period.endDate, today, reservations) ?? serverProblem
  if (problem) return periodProblemTexts[problem]
  const timesAllowed = isAllowedTime(period.arrivalTime) && isAllowedTime(period.departureTime)
  return timesAllowed ? undefined : timeText
}
