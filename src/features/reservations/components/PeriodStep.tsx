import { Block, BlockTitle, Button, f7, List, ListItem, Segmented } from 'framework7-react'
import { CircleAlert } from 'lucide-react'
import '@/features/reservations/components/PeriodStep.css'
import type { Reservation } from '@/features/reservations/api/types.ts'
import type { DraftPeriod } from '@/features/reservations/lib/draft.ts'
import { bookedRanges, maxDate, quickPicks } from '@/features/reservations/lib/period.ts'
import { isAllowedTime, MIN_TIME_OSLO } from '@/features/reservations/lib/times.ts'
import {
  formatDate,
  fromIsoDate,
  nightsBetween,
  nightsLabel,
  toIsoDate,
} from '@/shared/lib/dates.ts'

interface PeriodStepProps {
  period: DraftPeriod
  /** Today in Oslo; the quick picks and the last allowed date follow it. */
  today: string
  reservations: Reservation[]
  /** What is wrong with the period, shown under the card (see `periodIssueText`). */
  message?: string
  onChange: (period: DraftPeriod) => void
}

interface StayRowOptions {
  title: string
  /** The day, `yyyy-MM-dd`. */
  date: string
  today: string
  time: string
  /** The accessible name of the time field. */
  timeLabel: string
  onOpenCalendar: () => void
  onTimeChange: (time: string) => void
}

// An arrival or departure row like "Starts" in the iOS Calendar: the day and the time as two chips
// on the right. This is a function that returns the element, not a component: Framework7's `List`
// puts only `ListItem` and `ListInput` elements inside its <ul>, so a wrapper component would end up
// outside the card (with list bullets).
function renderStayRow({
  title,
  date,
  today,
  time,
  timeLabel,
  onOpenCalendar,
  onTimeChange,
}: StayRowOptions) {
  return (
    <ListItem title={title}>
      <div slot="after" className="period-chips">
        <button type="button" className="period-chip" onClick={onOpenCalendar}>
          {formatDate(date, today)}
        </button>
        {/* The pill is a wrapper: Framework7 resets the background of an input in a list. */}
        <span className="period-chip period-chip-time">
          <input
            type="time"
            aria-label={timeLabel}
            aria-invalid={!isAllowedTime(time)}
            value={time}
            min={MIN_TIME_OSLO}
            onChange={(event) => {
              onTimeChange(event.target.value)
            }}
          />
        </span>
      </div>
    </ListItem>
  )
}

// Step 1: the days (quick picks or a range in the calendar), the times and the length of the stay.
export default function PeriodStep({
  period,
  today,
  reservations,
  message,
  onChange,
}: PeriodStepProps) {
  const { startDate, endDate, arrivalTime, departureTime } = period
  const picks = quickPicks(today)
  const nights = nightsBetween(startDate, endDate)

  const openCalendar = () => {
    const calendar = f7.calendar.create({
      openIn: 'sheet',
      rangePicker: true,
      locale: 'nb-NO',
      value: [fromIsoDate(startDate), fromIsoDate(endDate)],
      maxDate: fromIsoDate(maxDate(today)),
      // Only fully booked days are disabled: a stay can end on the day the next one starts.
      disabled: bookedRanges(reservations).map(({ from, to }) => ({
        from: fromIsoDate(from),
        to: fromIsoDate(to),
      })),
      // Closes after the end date is tapped; a tap outside closes it earlier (Framework7's default).
      closeOnSelect: true,
      on: {
        // Fires after every tap; one date is a start without an end yet.
        change: (_calendar, value) => {
          const [start, end] = value as Date[]
          if (start && end) {
            onChange({ ...period, startDate: toIsoDate(start), endDate: toIsoDate(end) })
          }
        },
        closed: (closed) => {
          closed.destroy()
        },
      },
    })
    calendar.open()
  }

  return (
    <>
      <BlockTitle>Hurtigvalg</BlockTitle>
      <Block>
        <Segmented strong tag="p" className="period-quick-picks">
          {picks.map((pick) => (
            <Button
              key={pick.id}
              active={pick.start === startDate && pick.end === endDate}
              onClick={() => {
                onChange({ ...period, startDate: pick.start, endDate: pick.end })
              }}
            >
              {pick.label}
            </Button>
          ))}
        </Segmented>
      </Block>
      <BlockTitle>Eller velg datoer</BlockTitle>
      <List strong inset dividersIos>
        {renderStayRow({
          title: 'Ankomst',
          date: startDate,
          today,
          time: arrivalTime,
          timeLabel: 'Ankomst kl.',
          onOpenCalendar: openCalendar,
          onTimeChange: (time) => {
            onChange({ ...period, arrivalTime: time })
          },
        })}
        {renderStayRow({
          title: 'Avreise',
          date: endDate,
          today,
          time: departureTime,
          timeLabel: 'Avreise kl.',
          onOpenCalendar: openCalendar,
          onTimeChange: (time) => {
            onChange({ ...period, departureTime: time })
          },
        })}
        {nights >= 1 && <ListItem title="Varighet" after={nightsLabel(nights)} />}
      </List>
      {message && (
        <div role="alert">
          <Block className="text-color-red period-message">
            <CircleAlert size={16} aria-hidden="true" />
            <span>{message}</span>
          </Block>
        </div>
      )}
    </>
  )
}
