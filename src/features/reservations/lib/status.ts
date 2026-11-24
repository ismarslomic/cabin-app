import { isDateWithin, nightsLabel } from '@/shared/lib/dates.ts'

/** Status line of the current reservation. */
export function currentStatusText(remainingNights: number): string {
  if (remainingNights <= 0) return 'Reiser i dag'
  return `På hytta nå · ${nightsLabel(remainingNights)} igjen`
}

/** Status line of the next reservation. */
export function nextStatusText(daysUntil: number): string {
  if (daysUntil <= 0) return 'I dag'
  if (daysUntil === 1) return 'I morgen'
  return `Om ${daysUntil} dager`
}

/** Whether a guest's own stay includes `todayIso` (the check-out day counts). */
export function isAtCabin(stay: { stayStartDate: string; stayEndDate: string }, todayIso: string) {
  return isDateWithin(todayIso, stay.stayStartDate, stay.stayEndDate)
}
