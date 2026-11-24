import { Block, BlockTitle, Button, f7, List, ListItem, Segmented } from 'framework7-react'
import '@/features/reservations/components/PeriodStep.css'
import { type PeriodProblem, periodProblemTexts } from '@/features/reservations/api/error-texts.ts'
import type { Reservation } from '@/features/reservations/api/types.ts'
import type { DraftPeriod } from '@/features/reservations/lib/draft.ts'
import {
  bookedRanges,
  maxDate,
  periodProblem,
  quickPicks,
} from '@/features/reservations/lib/period.ts'
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
  /** A problem the server reported for this period; shown until the period is changed. */
  serverProblem?: PeriodProblem
  onChange: (period: DraftPeriod) => void
  onNext: () => void
}

const timeError = `Velg et tidspunkt mellom ${MIN_TIME_OSLO} og 23:59.`

interface TimeInputOptions {
  id: string
  label: string
  value: string
  onChange: (time: string) => void
}

// A time row, laid out like the date rows: the label as the title, the time on the right. It has a
// real <label>, so the input has an accessible name. This is a function that returns the element,
// not a component: Framework7's `List` puts only `ListItem` and `ListInput` elements inside its
// <ul>, so a wrapper component would end up outside the card (with list bullets).
function renderTimeInput({ id, label, value, onChange }: TimeInputOptions) {
  return (
    <ListItem className="period-time">
      <label slot="title" htmlFor={id}>
        {label}
      </label>
      <input
        slot="after"
        id={id}
        type="time"
        value={value}
        min={MIN_TIME_OSLO}
        aria-invalid={!isAllowedTime(value)}
        onChange={(event) => {
          onChange(event.target.value)
        }}
      />
    </ListItem>
  )
}

// Step 1: the dates (quick picks or a range in the calendar), the times and a summary.
export default function PeriodStep({
  period,
  today,
  reservations,
  serverProblem,
  onChange,
  onNext,
}: PeriodStepProps) {
  const { startDate, endDate, arrivalTime, departureTime } = period
  const picks = quickPicks(today)
  const problem = periodProblem(startDate, endDate, today, reservations) ?? serverProblem
  const timesValid = isAllowedTime(arrivalTime) && isAllowedTime(departureTime)
  // One message at a time: the period problem first, then a time that is not allowed.
  const message = problem ? periodProblemTexts[problem] : timesValid ? undefined : timeError

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
        <Segmented strong tag="p">
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
      <List strong inset>
        <ListItem
          link="#"
          title="Start"
          after={formatDate(startDate, today)}
          onClick={openCalendar}
        />
        <ListItem
          link="#"
          title="Slutt"
          after={formatDate(endDate, today)}
          onClick={openCalendar}
        />
        {renderTimeInput({
          id: 'reservation-arrival-time',
          label: 'Ankomst kl.',
          value: arrivalTime,
          onChange: (time) => {
            onChange({ ...period, arrivalTime: time })
          },
        })}
        {renderTimeInput({
          id: 'reservation-departure-time',
          label: 'Avreise kl.',
          value: departureTime,
          onChange: (time) => {
            onChange({ ...period, departureTime: time })
          },
        })}
        {!problem && (
          <ListItem title="Varighet" after={nightsLabel(nightsBetween(startDate, endDate))} />
        )}
      </List>
      {message && (
        <div role="alert">
          <Block className="text-color-red">{message}</Block>
        </div>
      )}
      <Block>
        <Button large round fill disabled={!!problem || !timesValid} onClick={onNext}>
          Neste
        </Button>
      </Block>
    </>
  )
}
