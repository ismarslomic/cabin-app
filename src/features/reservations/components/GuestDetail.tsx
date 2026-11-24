import {
  Block,
  Button,
  Link,
  List,
  ListItem,
  Navbar,
  NavRight,
  Page,
  Popup,
  Toggle,
  View,
} from 'framework7-react'
import { Avatar } from '@/features/profile/index.ts'
import type { Guest } from '@/features/reservations/api/types.ts'
import type { DraftGuest, DraftPeriod } from '@/features/reservations/lib/draft.ts'
import { guestName } from '@/features/reservations/lib/guests.ts'
import { formatDate, formatDateRange } from '@/shared/lib/dates.ts'
import { openDayPicker } from '@/shared/ui/day-picker.ts'

interface GuestDetailProps {
  /** The guest to show; the popup is closed when there is none. */
  guest: Guest | undefined
  draftGuest: DraftGuest | undefined
  period: DraftPeriod
  today: string
  /** The last guest cannot be removed. */
  canRemove: boolean
  onChange: (guest: DraftGuest) => void
  onRemove: () => void
  onClose: () => void
}

interface OwnDayProps {
  switchLabel: string
  dateLabel: string
  today: string
  /** The guest's own day, or null when the guest follows the group. */
  value: string | null
  /** The day the guest gets when the switch is turned on. */
  defaultValue: string
  min: string
  max: string
  onChange: (day: string | null) => void
}

// A switch for an own arrival or departure and, when it is on, the row that picks the day.
function OwnDay({
  switchLabel,
  dateLabel,
  today,
  value,
  defaultValue,
  min,
  max,
  onChange,
}: OwnDayProps) {
  return (
    <>
      <ListItem title={switchLabel}>
        <Toggle
          slot="after"
          aria-label={switchLabel}
          checked={value !== null}
          // The input is controlled, so `event.target.checked` is already reset here: flip the state.
          onChange={() => {
            onChange(value === null ? defaultValue : null)
          }}
        />
      </ListItem>
      {value !== null && (
        <ListItem
          link="#"
          title={dateLabel}
          after={formatDate(value, today)}
          onClick={() => {
            openDayPicker({ value, min, max, onPick: onChange })
          }}
        />
      )}
    </>
  )
}

// The guest's own arrival and departure, inside the reservation's period.
export default function GuestDetail({
  guest,
  draftGuest,
  period,
  today,
  canRemove,
  onChange,
  onRemove,
  onClose,
}: GuestDetailProps) {
  const { startDate, endDate } = period

  return (
    <Popup opened={!!guest && !!draftGuest} onPopupClosed={onClose}>
      <View>
        <Page>
          <Navbar title={guest ? guestName(guest) : ''}>
            <NavRight>
              <Link popupClose>Ferdig</Link>
            </NavRight>
          </Navbar>
          {guest && draftGuest && (
            <>
              <Block className="text-align-center">
                <Avatar guestId={guest.id} size={72} />
              </Block>
              <List strong inset dividersIos>
                <OwnDay
                  switchLabel="Egen ankomst"
                  dateLabel="Ankomstdato"
                  today={today}
                  value={draftGuest.fromDate}
                  defaultValue={startDate}
                  min={startDate}
                  max={draftGuest.toDate ?? endDate}
                  onChange={(fromDate) => {
                    onChange({ ...draftGuest, fromDate })
                  }}
                />
                <OwnDay
                  switchLabel="Egen avreise"
                  dateLabel="Avreisedato"
                  today={today}
                  value={draftGuest.toDate}
                  defaultValue={endDate}
                  min={draftGuest.fromDate ?? startDate}
                  max={endDate}
                  onChange={(toDate) => {
                    onChange({ ...draftGuest, toDate })
                  }}
                />
              </List>
              <Block>
                Uten egne datoer er gjesten med hele oppholdet:{' '}
                {formatDateRange(startDate, endDate, today)}.
              </Block>
              <Block>
                <Button color="red" disabled={!canRemove} onClick={onRemove}>
                  Slett gjest fra reservasjon
                </Button>
                {!canRemove && <p>En reservasjon må ha minst én gjest.</p>}
              </Block>
            </>
          )}
        </Page>
      </View>
    </Popup>
  )
}
