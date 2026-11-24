import {
  Block,
  BlockFooter,
  BlockTitle,
  Link,
  List,
  ListItem,
  SwipeoutActions,
  SwipeoutButton,
} from 'framework7-react'
import { CircleAlert, CirclePlus, Trash2, TriangleAlert, X } from 'lucide-react'
import '@/features/reservations/components/GuestsStep.css'
import { Avatar } from '@/features/profile/index.ts'
import type { Guest } from '@/features/reservations/api/types.ts'
import type { DraftGuest, DraftPeriod } from '@/features/reservations/lib/draft.ts'
import {
  guestDatesText,
  guestName,
  MAX_GUESTS,
  resetDatesText,
} from '@/features/reservations/lib/guests.ts'

interface GuestsStepProps {
  /** Every guest, to look up names. */
  guests: Guest[]
  draftGuests: DraftGuest[]
  period: DraftPeriod
  today: string
  /** The guests whose own dates were reset because the period changed. */
  resetGuestIds: string[]
  /** What went wrong when sending, shown under the guest list. */
  submitError: string | undefined
  onOpenGuest: (guestId: string) => void
  onRemoveGuest: (guestId: string) => void
  onAddGuest: () => void
  /** The user closes the note about reset dates. */
  onDismissResetNote: () => void
}

// The guests of the reservation. Tap a guest for own dates; swipe to remove.
export default function GuestsStep({
  guests,
  draftGuests,
  period,
  today,
  resetGuestIds,
  submitError,
  onOpenGuest,
  onRemoveGuest,
  onAddGuest,
  onDismissResetNote,
}: GuestsStepProps) {
  const byId = new Map(guests.map((guest) => [guest.id, guest]))
  // A reservation needs at least one guest.
  const canRemove = draftGuests.length > 1
  const canAdd = draftGuests.length < MAX_GUESTS
  const resetNames = resetGuestIds.flatMap((id) => {
    const guest = byId.get(id)
    return guest ? [guestName(guest)] : []
  })

  return (
    <>
      <BlockTitle>Gjester ({draftGuests.length})</BlockTitle>
      {/* Right under the heading: this is where the user is looking after changing the period. */}
      {resetNames.length > 0 && (
        <div role="status">
          <BlockFooter className="guests-note">
            <TriangleAlert size={16} aria-hidden="true" />
            <span>{resetDatesText(resetNames)}</span>
            <Link iconOnly aria-label="Skjul melding" onClick={onDismissResetNote}>
              <X size={16} aria-hidden="true" />
            </Link>
          </BlockFooter>
        </div>
      )}
      <List strong inset dividersIos>
        {/* flatMap: Framework7's `List` cannot handle a null child, so a missing guest gives no element. */}
        {draftGuests.flatMap((draftGuest) => {
          const guest = byId.get(draftGuest.guestId)
          if (!guest) return []
          return [
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
                <Avatar avatarUrl={guest.avatarUrl} size={40} />
              </span>
              {canRemove && (
                <SwipeoutActions right>
                  <SwipeoutButton
                    color="red"
                    className="guests-remove"
                    aria-label="Fjern gjest"
                    onClick={() => {
                      onRemoveGuest(draftGuest.guestId)
                    }}
                  >
                    <Trash2 size={20} aria-hidden="true" />
                  </SwipeoutButton>
                </SwipeoutActions>
              )}
            </ListItem>,
          ]
        })}
        <ListItem
          link="#"
          noChevron
          title="Legg til gjest"
          className={canAdd ? 'guests-add' : 'guests-add disabled'}
          onClick={() => {
            if (canAdd) onAddGuest()
          }}
        >
          <span slot="media" className="guests-add-icon">
            <CirclePlus size={24} aria-hidden="true" />
          </span>
        </ListItem>
      </List>
      {!canAdd && <Block>En reservasjon kan ha opptil {MAX_GUESTS} gjester.</Block>}
      {submitError && (
        <div role="alert">
          <Block className="text-color-red flow-message">
            <CircleAlert size={16} aria-hidden="true" />
            <span>{submitError}</span>
          </Block>
        </div>
      )}
    </>
  )
}
