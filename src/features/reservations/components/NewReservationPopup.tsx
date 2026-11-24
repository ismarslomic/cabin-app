import {
  Actions,
  ActionsButton,
  ActionsGroup,
  ActionsLabel,
  Block,
  f7,
  Link,
  Navbar,
  NavLeft,
  NavRight,
  NavTitle,
  Page,
  Popup,
  View,
} from 'framework7-react'
import { useEffect, useEffectEvent, useMemo, useState } from 'react'
import { reloadProfile, useProfile } from '@/features/profile/index.ts'
import type { Guest, Reservation } from '@/features/reservations/api/types.ts'
import { useReservationFlowData } from '@/features/reservations/api/useReservationFlowData.ts'
import GuestDetail from '@/features/reservations/components/GuestDetail.tsx'
import GuestPicker from '@/features/reservations/components/GuestPicker.tsx'
import GuestsStep from '@/features/reservations/components/GuestsStep.tsx'
import PeriodStep from '@/features/reservations/components/PeriodStep.tsx'
import StepIndicator from '@/features/reservations/components/StepIndicator.tsx'
import {
  defaultGuests,
  initialPeriod,
  isSameGuests,
  isSamePeriod,
  reconcileGuestDates,
  type DraftGuest,
  type DraftPeriod,
} from '@/features/reservations/lib/draft.ts'
import { addGuests, guestsToAdd, MAX_GUESTS } from '@/features/reservations/lib/guests.ts'
import { todayInOslo } from '@/shared/lib/dates.ts'
import ErrorState from '@/shared/ui/ErrorState.tsx'

const STEPS = ['Periode', 'Gjester']

interface FlowNavbarProps {
  /** The step to go back from; no "Tilbake" on the first step. */
  step: number
  onBack: () => void
  onCancel: () => void
}

function FlowNavbar({ step, onBack, onCancel }: FlowNavbarProps) {
  return (
    <Navbar>
      <NavLeft>{step > 0 && <Link onClick={onBack}>Tilbake</Link>}</NavLeft>
      <NavTitle>Ny reservasjon</NavTitle>
      <NavRight>
        <Link onClick={onCancel}>Avbryt</Link>
      </NavRight>
    </Navbar>
  )
}

interface DraftFlowProps {
  today: string
  reservations: Reservation[]
  guests: Guest[]
  currentUserId: string
  onClose: () => void
}

// The two steps and the draft, once everything is loaded. The draft starts from the family.
function DraftFlow({ today, reservations, guests, currentUserId, onClose }: DraftFlowProps) {
  const initial = useMemo(() => initialPeriod(today), [today])
  const initialGuests = useMemo(() => defaultGuests(guests, currentUserId), [guests, currentUserId])
  const [period, setPeriod] = useState(initial)
  const [draftGuests, setDraftGuests] = useState(initialGuests)
  const [datesWereReset, setDatesWereReset] = useState(false)
  const [step, setStep] = useState(0)
  const [openGuestId, setOpenGuestId] = useState<string | null>(null)
  const [picking, setPicking] = useState(false)
  const [confirmingCancel, setConfirmingCancel] = useState(false)

  const isChanged = !isSamePeriod(period, initial) || !isSameGuests(draftGuests, initialGuests)

  // Closes at once when nothing was changed, otherwise asks before the draft is thrown away.
  const cancel = () => {
    if (isChanged) setConfirmingCancel(true)
    else onClose()
  }

  // Own dates that do not fit the new period are reset, and step 2 says so.
  const changePeriod = (next: DraftPeriod) => {
    const { guests: kept, reset } = reconcileGuestDates(draftGuests, next.startDate, next.endDate)
    setPeriod(next)
    if (reset > 0) setDraftGuests(kept)
    setDatesWereReset(reset > 0)
  }

  const changeGuest = (changed: DraftGuest) => {
    setDraftGuests((current) =>
      current.map((guest) => (guest.guestId === changed.guestId ? changed : guest)),
    )
    setDatesWereReset(false)
  }

  const removeGuest = (guestId: string) => {
    setDraftGuests((current) => current.filter((guest) => guest.guestId !== guestId))
    setOpenGuestId(null)
  }

  const openGuest =
    openGuestId === null ? undefined : draftGuests.find((guest) => guest.guestId === openGuestId)

  return (
    <Page>
      <FlowNavbar
        step={step}
        onBack={() => {
          setStep(step - 1)
        }}
        onCancel={cancel}
      />
      <StepIndicator steps={STEPS} current={step} />
      {step === 0 && (
        <PeriodStep
          period={period}
          today={today}
          reservations={reservations}
          onChange={changePeriod}
          onNext={() => {
            setStep(1)
          }}
        />
      )}
      {step === 1 && (
        <GuestsStep
          guests={guests}
          draftGuests={draftGuests}
          period={period}
          today={today}
          datesWereReset={datesWereReset}
          onOpenGuest={setOpenGuestId}
          onRemoveGuest={removeGuest}
          onAddGuest={() => {
            setPicking(true)
          }}
        />
      )}
      <GuestPicker
        opened={picking}
        available={guestsToAdd(guests, draftGuests)}
        room={MAX_GUESTS - draftGuests.length}
        onAdd={(guestIds) => {
          setDraftGuests((current) => addGuests(current, guestIds))
          setPicking(false)
        }}
        onClose={() => {
          setPicking(false)
        }}
      />
      <GuestDetail
        guest={guests.find((guest) => guest.id === openGuestId)}
        draftGuest={openGuest}
        period={period}
        today={today}
        canRemove={draftGuests.length > 1}
        onChange={changeGuest}
        onRemove={() => {
          if (openGuestId !== null) removeGuest(openGuestId)
        }}
        onClose={() => {
          setOpenGuestId(null)
        }}
      />
      <Actions
        opened={confirmingCancel}
        onActionsClosed={() => {
          setConfirmingCancel(false)
        }}
      >
        <ActionsGroup>
          <ActionsLabel>Forkast reservasjonen?</ActionsLabel>
          <ActionsButton color="red" onClick={onClose}>
            Forkast reservasjonen
          </ActionsButton>
        </ActionsGroup>
        <ActionsGroup>
          <ActionsButton>Fortsett å redigere</ActionsButton>
        </ActionsGroup>
      </Actions>
    </Page>
  )
}

interface FlowProps {
  onClose: () => void
}

// Loads what the flow needs (reservations, guests, the current user), then shows the draft flow.
function ReservationFlow({ onClose }: FlowProps) {
  const today = useMemo(() => todayInOslo(), [])
  const { data, reload } = useReservationFlowData(today)
  const profile = useProfile()

  // No access: say so and leave. `onClose` may change between renders, the alert must not repeat.
  const leaveForbidden = useEffectEvent(() => {
    f7.dialog.alert('Du har ikke tilgang til appen.', onClose)
  })
  const forbidden = data.status === 'forbidden'
  useEffect(() => {
    if (forbidden) leaveForbidden()
  }, [forbidden])

  if (data.status === 'ready' && profile.status === 'ready') {
    return (
      <DraftFlow
        today={today}
        reservations={data.reservations}
        guests={data.guests}
        currentUserId={profile.profile.id}
        onClose={onClose}
      />
    )
  }

  const failed = data.status === 'error' || profile.status === 'error'
  return (
    <Page>
      <FlowNavbar step={0} onBack={onClose} onCancel={onClose} />
      <StepIndicator steps={STEPS} current={0} />
      {failed ? (
        <ErrorState
          message="Kunne ikke hente data til reservasjonen."
          onRetry={() => {
            reload()
            if (profile.status === 'error') void reloadProfile()
          }}
        />
      ) : (
        <div role="status">
          <Block className="skeleton-text skeleton-effect-wave">Laster reservasjoner</Block>
        </div>
      )}
    </Page>
  )
}

interface NewReservationPopupProps {
  opened: boolean
  onClose: () => void
}

// The flow for a new reservation, in a modal. Only the "Avbryt" button closes it: swipe-to-close
// and a tap on the backdrop would throw the draft away without asking (Framework7 has no way to
// veto them).
export default function NewReservationPopup({ opened, onClose }: NewReservationPopupProps) {
  // Framework7 renders a popup's content also while it is closed. The flow is mounted when the
  // popup opens and removed when it has closed, so every opening starts with today's date, a
  // fresh draft and a fresh load.
  const [mounted, setMounted] = useState(false)
  if (opened && !mounted) setMounted(true)

  return (
    <Popup
      opened={opened}
      swipeToClose={false}
      closeByBackdropClick={false}
      onPopupClosed={() => {
        setMounted(false)
        // Closed by something other than the parent (such as a route change): tell the parent.
        if (opened) onClose()
      }}
    >
      <View>{mounted && <ReservationFlow onClose={onClose} />}</View>
    </Popup>
  )
}
