const weekdays = ['søn', 'man', 'tir', 'ons', 'tor', 'fre', 'lør']
const months = ['jan', 'feb', 'mar', 'apr', 'mai', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'des']

/** Parses a `YYYY-MM-DD` date as a local date (no timezone shift). */
function parseDate(iso: string): Date {
  const [year, month, day] = iso.split('-').map(Number)
  return new Date(year ?? 0, (month ?? 1) - 1, day ?? 1)
}

function formatDay(date: Date, showYear: boolean): string {
  const weekday = weekdays[date.getDay()] ?? ''
  const month = months[date.getMonth()] ?? ''
  return `${weekday} ${date.getDate()}. ${month}${showYear ? ` ${date.getFullYear()}` : ''}`
}

/**
 * "fre 31. okt – søn 2. nov". The year is added to a date that is not in the current year.
 * `today` is a parameter so tests do not depend on the clock.
 */
export function formatDateRange(startIso: string, endIso: string, today = new Date()): string {
  const start = parseDate(startIso)
  const end = parseDate(endIso)
  const year = today.getFullYear()
  return `${formatDay(start, start.getFullYear() !== year)} – ${formatDay(end, end.getFullYear() !== year)}`
}

function plural(count: number, one: string, many: string): string {
  return `${count} ${count === 1 ? one : many}`
}

/** Status line of the current reservation. */
export function currentStatusText(remainingNights: number): string {
  if (remainingNights <= 0) return 'Reiser i dag'
  return `På hytta nå · ${plural(remainingNights, 'natt', 'netter')} igjen`
}

/** Status line of the next reservation. */
export function nextStatusText(daysUntil: number): string {
  if (daysUntil <= 0) return 'I dag'
  if (daysUntil === 1) return 'I morgen'
  return `Om ${daysUntil} dager`
}

/** `1240` → "1 240" (thin no-break space), `null` → "0". Groups four-digit numbers too, unlike `Intl` for nb-NO. */
export function formatKm(km: number | null | undefined): string {
  return String(Math.round(km ?? 0)).replace(/\B(?=(\d{3})+(?!\d))/g, '\u202f')
}
