/**
 * `1240` → "1 240" (thin no-break space), `null` → "0". Groups four-digit numbers too, unlike
 * `Intl` for nb-NO.
 *
 * @example
 * formatKm(1240.4) // '1 240'
 * formatKm(null) // '0'
 */
export function formatKm(km: number | null | undefined): string {
  return String(Math.round(km ?? 0)).replace(/\B(?=(\d{3})+(?!\d))/g, '\u202f')
}
