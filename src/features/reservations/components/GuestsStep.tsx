import {
  Block,
  BlockTitle,
  Button,
  List,
  ListItem,
  Preloader,
  SwipeoutActions,
  SwipeoutButton,
} from 'framework7-react'
import { Plus } from 'lucide-react'
import { Avatar } from '@/features/profile/index.ts'
import type { Guest } from '@/features/reservations/api/types.ts'
import type { DraftGuest, DraftPeriod } from '@/features/reservations/lib/draft.ts'
import { guestDatesText, guestName, MAX_GUESTS } from '@/features/reservations/lib/guests.ts'

interface GuestsStepProps {
  /** Every guest, to look up names. */
  guests: Guest[]
  draftGuests: DraftGuest[]
  period: DraftPeriod
  today: string
  /** Own dates were reset because the period changed. */
  datesWereReset: boolean
  /** The reservation is being sent. */
  submitting: boolean
  /** What went wrong when sending, shown above the button. */
  submitError: string | undefined
  onOpenGuest: (guestId: string) => void
  onRemoveGuest: (guestId: string) => void
  onAddGuest: () => void
  onSubmit: () => void
}

// Step 2: the guests of the reservation. Tap a guest for own dates; swipe to remove.
export default function GuestsStep({
  guests,
  draftGuests,
  period,
  today,
  datesWereReset,
  submitting,
  submitError,
  onOpenGuest,
  onRemoveGuest,
  onAddGuest,
  onSubmit,
}: GuestsStepProps) {
  const byId = new Map(guests.map((guest) => [guest.id, guest]))
  // A reservation needs at least one guest.
  const canRemove = draftGuests.length > 1
  const canAdd = draftGuests.length < MAX_GUESTS

  return (
    <>
      <BlockTitle>Gjester ({draftGuests.length})</BlockTitle>
      {datesWereReset && (
        <div role="status">
          <Block>Egne datoer ble nullstilt for gjester som ikke passer i den nye perioden.</Block>
        </div>
      )}
      <List strong inset dividersIos>
        {draftGuests.map((draftGuest) => {
          const guest = byId.get(draftGuest.guestId)
          if (!guest) return null
          return (
            <ListItem
              key={draftGuest.guestId}
              link="#"
              swipeout={canRemove}
              title={guestName(guest)}
              footer={guestDatesText(draftGuest, period, today)}
              onClick={() => {
                onOpenGuest(draftGuest.guestId)
              }}
            >
              <span slot="media">
                <Avatar guestId={guest.id} size={40} />
              </span>
              {canRemove && (
                <SwipeoutActions right>
                  <SwipeoutButton
                    color="red"
                    onClick={() => {
                      onRemoveGuest(draftGuest.guestId)
                    }}
                  >
                    Fjern
                  </SwipeoutButton>
                </SwipeoutActions>
              )}
            </ListItem>
          )
        })}
        <ListItem
          link="#"
          title="Legg til gjest"
          className={canAdd ? undefined : 'disabled'}
          onClick={() => {
            if (canAdd) onAddGuest()
          }}
        >
          <span slot="media">
            <Plus size={20} aria-hidden="true" />
          </span>
        </ListItem>
      </List>
      {!canAdd && <Block>En reservasjon kan ha opptil {MAX_GUESTS} gjester.</Block>}
      {submitError && (
        <div role="alert">
          <Block className="text-color-red">{submitError}</Block>
        </div>
      )}
      <Block>
        <Button large round fill disabled={submitting} onClick={onSubmit}>
          {submitting ? <Preloader size={20} /> : 'Opprett reservasjon'}
        </Button>
      </Block>
    </>
  )
}
