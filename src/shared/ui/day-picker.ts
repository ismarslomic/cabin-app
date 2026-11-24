import { f7 } from 'framework7-react'
import { fromIsoDate, toIsoDate } from '@/shared/lib/dates.ts'

interface DayPickerOptions {
  /** The selected day, `yyyy-MM-dd`. */
  value: string
  /** The first and the last day that can be picked, `yyyy-MM-dd`. */
  min: string
  max: string
  onPick: (day: string) => void
}

/**
 * Opens a Framework7 calendar sheet for one day, in Norwegian. It closes when a day is tapped.
 *
 * @example
 * openDayPicker({ value: '2026-11-28', min: '2026-11-27', max: '2026-11-29', onPick: save })
 */
export function openDayPicker({ value, min, max, onPick }: DayPickerOptions): void {
  const calendar = f7.calendar.create({
    openIn: 'sheet',
    locale: 'nb-NO',
    value: [fromIsoDate(value)],
    minDate: fromIsoDate(min),
    maxDate: fromIsoDate(max),
    closeOnSelect: true,
    on: {
      change: (_calendar, selected) => {
        const [day] = selected as Date[]
        if (day) onPick(toIsoDate(day))
      },
      closed: (closed) => {
        closed.destroy()
      },
    },
  })
  calendar.open()
}
