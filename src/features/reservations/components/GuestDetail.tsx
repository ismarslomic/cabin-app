import {
  Block,
  BlockFooter,
  BlockTitle,
  Link,
  List,
  ListButton,
  ListItem,
  Navbar,
  NavLeft,
  NavRight,
  Page,
  Popup,
  Toggle,
} from 'framework7-react'
import { Check, X } from 'lucide-react'
import { useState } from 'react'
import { Avatar } from '@/features/profile/index.ts'
import '@/features/reservations/components/flow-primary.css'
import '@/features/reservations/components/GuestDetail.css'
import type { Guest } from '@/features/reservations/api/types.ts'
import {
  type DraftGuest,
  type DraftPeriod,
  isSameGuests,
  normalizeGuestDates,
} from '@/features/reservations/lib/draft.ts'
import { guestName } from '@/features/reservations/lib/guests.ts'
import { formatDate, formatDateRange } from '@/shared/lib/dates.ts'
import { openDayPicker } from '@/shared/ui/day-picker.ts'
import '@/shared/ui/chips.css'

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
  /** The guest is being removed: the popup closes, with the content kept until it has closed. */
  closing: boolean
  onClose: () => void
}

interface OwnDayOptions {
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

// A switch for an own arrival or departure and, when it is on, the row that picks the day. These
// are list items returned from a function, not a component: Framework7's `List` puts only
// `ListItem` elements inside its <ul>, so a wrapper component would end up outside the card. The
// keys include the label: `List` flattens both arrays into one list, so the keys must differ
// between the arrival and the departure.
function ownDayItems({
  switchLabel,
  dateLabel,
  today,
  value,
  defaultValue,
  min,
  max,
  onChange,
}: OwnDayOptions) {
  const items = [
    <ListItem key={`${switchLabel}-switch`} title={switchLabel}>
      <Toggle
        slot="after"
        aria-label={switchLabel}
        checked={value !== null}
        // The input is controlled, so `event.target.checked` is already reset here: flip the state.
        onChange={() => {
          onChange(value === null ? defaultValue : null)
        }}
      />
    </ListItem>,
  ]
  if (value !== null) {
    items.push(
      // The day as a pill like in the period section.
      <ListItem key={`${switchLabel}-date`} title={dateLabel}>
        <div slot="after" className="chips">
          <button
            type="button"
            className="chip"
            onClick={() => {
              openDayPicker({ value, min, max, onPick: onChange })
            }}
          >
            {formatDate(value, today)}
          </button>
        </div>
      </ListItem>,
    )
  }
  return items
}

interface GuestFormProps {
  guest: Guest
  draftGuest: DraftGuest
  period: DraftPeriod
  today: string
  canRemove: boolean
  onSave: (guest: DraftGuest) => void
  onRemove: () => void
}

// What the guest popup shows. The user edits a copy: the check saves it, the X (and anything that
// closes the popup) throws it away. It is mounted when the popup opens, so every opening starts from
// the guest as it is in the reservation.
function GuestForm({
  guest,
  draftGuest,
  period,
  today,
  canRemove,
  onSave,
  onRemove,
}: GuestFormProps) {
  const { startDate, endDate } = period
  const [edited, setEdited] = useState(draftGuest)
  // What would be saved: an own date equal to the reservation's counts as no own date. The check
  // is only enabled when that differs from what the guest has now.
  const saved = normalizeGuestDates(edited, period)
  const changed = !isSameGuests([saved], [draftGuest])

  return (
    <>
      <Navbar>
        <NavLeft>
          <Link iconOnly popupClose aria-label="Lukk">
            <X size={22} aria-hidden="true" />
          </Link>
        </NavLeft>
        <NavRight>
          <Link
            iconOnly
            popupClose={changed}
            aria-label="Ferdig"
            aria-disabled={!changed}
            className={changed ? 'flow-primary' : 'flow-primary disabled'}
            onClick={() => {
              if (changed) onSave(saved)
            }}
          >
            <Check size={24} aria-hidden="true" />
          </Link>
        </NavRight>
      </Navbar>
      <Block className="text-align-center">
        <Avatar avatarUrl={guest.avatarUrl} size={72} />
        <h2 className="guest-detail-name">{guestName(guest)}</h2>
      </Block>
      <BlockTitle>Egne datoer</BlockTitle>
      <List strong inset dividersIos>
        {ownDayItems({
          switchLabel: 'Egen ankomst',
          dateLabel: 'Ankomst',
          today,
          value: edited.fromDate,
          defaultValue: startDate,
          min: startDate,
          max: edited.toDate ?? endDate,
          onChange: (fromDate) => {
            setEdited((current) => ({ ...current, fromDate }))
          },
        })}
        {ownDayItems({
          switchLabel: 'Egen avreise',
          dateLabel: 'Avreise',
          today,
          value: edited.toDate,
          defaultValue: endDate,
          min: edited.fromDate ?? startDate,
          max: endDate,
          onChange: (toDate) => {
            setEdited((current) => ({ ...current, toDate }))
          },
        })}
      </List>
      <BlockFooter>
        Uten egne datoer er gjesten med hele oppholdet: {formatDateRange(startDate, endDate, today)}
      </BlockFooter>
      <List strong inset>
        <ListButton
          link="#"
          color="red"
          title="Fjern fra reservasjon"
          className={canRemove ? undefined : 'disabled'}
          onClick={() => {
            if (canRemove) onRemove()
          }}
        />
      </List>
      {!canRemove && <BlockFooter>En reservasjon må ha minst én gjest.</BlockFooter>}
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
  closing,
  onClose,
}: GuestDetailProps) {
  return (
    <Popup opened={!!guest && !!draftGuest && !closing} onPopupClosed={onClose}>
      <Page>
        {guest && draftGuest && (
          <GuestForm
            key={guest.id}
            guest={guest}
            draftGuest={draftGuest}
            period={period}
            today={today}
            canRemove={canRemove}
            onSave={onChange}
            onRemove={onRemove}
          />
        )}
      </Page>
    </Popup>
  )
}
