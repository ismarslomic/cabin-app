import {
  Actions,
  ActionsButton,
  ActionsGroup,
  ActionsLabel,
  Block,
  Link,
  Navbar,
  NavLeft,
  NavRight,
  NavTitle,
  Page,
  Popup,
  Preloader,
} from 'framework7-react'
import { X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { reloadProfile, useProfile } from '@/features/profile/index.ts'
import {
  describeCreateFailure,
  type PeriodProblem,
} from '@/features/reservations/api/error-texts.ts'
import { createReservation } from '@/features/reservations/api/reservations-api.ts'
import type { Guest, Reservation } from '@/features/reservations/api/types.ts'
import { useReservationFlowData } from '@/features/reservations/api/useReservationFlowData.ts'
import GuestDetail from '@/features/reservations/components/GuestDetail.tsx'
import GuestPicker from '@/features/reservations/components/GuestPicker.tsx'
import GuestsStep from '@/features/reservations/components/GuestsStep.tsx'
import '@/features/reservations/components/NewReservationPopup.css'
import PeriodStep from '@/features/reservations/components/PeriodStep.tsx'
import StepIndicator from '@/features/reservations/components/StepIndicator.tsx'
import {
  buildCreateRequest,
  defaultGuests,
  initialPeriod,
  isSameGuests,
  isSamePeriod,
  reconcileGuestDates,
  type DraftGuest,
  type DraftPeriod,
} from '@/features/reservations/lib/draft.ts'
import { addGuests, guestsToAdd, MAX_GUESTS } from '@/features/reservations/lib/guests.ts'
import { classifyFailure, type Failure } from '@/shared/lib/api-error.ts'
import { periodIssueText } from '@/features/reservations/lib/period-issue.ts'
import { todayInOslo } from '@/shared/lib/dates.ts'
import { handleCommonFailure } from '@/shared/ui/failure-feedback.ts'
import ErrorState from '@/shared/ui/ErrorState.tsx'

const STEPS = ['Periode', 'Gjester']

interface PrimaryAction {
  label: string
  disabled: boolean
  /** Shows a preloader instead of the label. */
  busy?: boolean
  onClick: () => void
}

interface FlowNavbarProps {
  /** The reservation is being sent: going back or cancelling waits until it is done. */
  busy?: boolean
  /** The step to go back from; no "Tilbake" on the first step. */
  step: number
  /** What the user does next ("Neste", "Opprett"), at the top right like the iOS Calendar. */
  primary?: PrimaryAction
  onBack: () => void
  onCancel: () => void
}

// Like the iOS Calendar's "new event": close on the left, the primary action on the right.
function FlowNavbar({ busy = false, step, primary, onBack, onCancel }: FlowNavbarProps) {
  const waiting = busy ? 'disabled' : undefined
  const primaryDisabled = primary?.disabled || primary?.busy
  return (
    <Navbar>
      <NavLeft>
        <Link
          iconOnly
          aria-label="Avbryt"
          className={waiting}
          onClick={busy ? undefined : onCancel}
        >
          <X size={22} aria-hidden="true" />
        </Link>
        {step > 0 && (
          <Link className={waiting} onClick={busy ? undefined : onBack}>
            Tilbake
          </Link>
        )}
      </NavLeft>
      <NavTitle>Ny reservasjon</NavTitle>
      <NavRight>
        {primary && (
          <Link
            aria-label={primary.label}
            aria-busy={primary.busy}
            className={primaryDisabled ? 'flow-primary disabled' : 'flow-primary'}
            onClick={primaryDisabled ? undefined : primary.onClick}
          >
            {primary.busy ? <Preloader size={18} /> : primary.label}
          </Link>
        )}
      </NavRight>
    </Navbar>
  )
}

interface DraftFlowProps {
  today: string
  reservations: Reservation[]
  guests: Guest[]
  currentUserId: string
  onCreated: () => void
  onClose: () => void
}

// The two steps and the draft, once everything is loaded. The draft starts from the family.
function DraftFlow({
  today,
  reservations,
  guests,
  currentUserId,
  onCreated,
  onClose,
}: DraftFlowProps) {
  const initial = useMemo(() => initialPeriod(today), [today])
  const initialGuests = useMemo(() => defaultGuests(guests, currentUserId), [guests, currentUserId])
  const [period, setPeriod] = useState(initial)
  const [draftGuests, setDraftGuests] = useState(initialGuests)
  const [datesWereReset, setDatesWereReset] = useState(false)
  const [step, setStep] = useState(0)
  const [openGuestId, setOpenGuestId] = useState<string | null>(null)
  const [picking, setPicking] = useState(false)
  const [confirmingCancel, setConfirmingCancel] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string>()
  const [serverProblem, setServerProblem] = useState<PeriodProblem>()
  // A request can outlive the flow (the popup was closed meanwhile): then it must not touch the UI.
  const alive = useRef(false)
  const sending = useRef(false)
  useEffect(() => {
    alive.current = true
    return () => {
      alive.current = false
    }
  }, [])

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
    setServerProblem(undefined)
    setSubmitError(undefined)
    if (reset > 0) setDraftGuests(kept)
    setDatesWereReset(reset > 0)
  }

  const changeGuest = (changed: DraftGuest) => {
    setDraftGuests((current) =>
      current.map((guest) => (guest.guestId === changed.guestId ? changed : guest)),
    )
    setDatesWereReset(false)
    setSubmitError(undefined)
  }

  const removeGuest = (guestId: string) => {
    setDraftGuests((current) => current.filter((guest) => guest.guestId !== guestId))
    setOpenGuestId(null)
    setSubmitError(undefined)
  }

  // Shows a failure the whole app does not handle: where the user can fix it.
  const showCreateFailure = (failure: Failure) => {
    const described = describeCreateFailure(failure)
    if (described.kind === 'period') {
      setServerProblem(described.problem)
      setStep(0)
    } else {
      setSubmitError(described.text)
    }
  }

  const handleSubmitFailure = (error: unknown) => {
    const failure = classifyFailure(error)
    const handled = handleCommonFailure(failure, {
      networkToast: true,
      onForbiddenDismissed: onClose,
    })
    if (!handled) showCreateFailure(failure)
    setSubmitting(false)
  }

  const submit = async () => {
    // A ref, not the state: two taps before the next render must not send twice.
    if (sending.current) return
    sending.current = true
    setSubmitting(true)
    setSubmitError(undefined)

    const request = buildCreateRequest(period, draftGuests)
    try {
      await createReservation(request)
    } catch (error) {
      sending.current = false
      // The flow may be gone (popup closed meanwhile): then there is no UI to update.
      if (alive.current) handleSubmitFailure(error)
      return
    }

    // The reservation exists. Home needs to know, but a popup opened since is not ours to close.
    onCreated()
    if (alive.current) onClose()
  }

  const periodIssue = periodIssueText(period, today, reservations, serverProblem)
  const primary: PrimaryAction =
    step === 0
      ? {
          label: 'Neste',
          disabled: periodIssue !== undefined,
          onClick: () => {
            setStep(1)
          },
        }
      : {
          label: 'Opprett',
          disabled: false,
          busy: submitting,
          onClick: () => {
            void submit()
          },
        }

  const openGuest =
    openGuestId === null ? undefined : draftGuests.find((guest) => guest.guestId === openGuestId)

  return (
    <Page>
      <FlowNavbar
        busy={submitting}
        step={step}
        primary={primary}
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
          message={periodIssue}
          onChange={changePeriod}
        />
      )}
      {step === 1 && (
        <GuestsStep
          guests={guests}
          draftGuests={draftGuests}
          period={period}
          today={today}
          datesWereReset={datesWereReset}
          submitError={submitError}
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
  onCreated: () => void
  onClose: () => void
}

// Loads what the flow needs (reservations, guests, the current user), then shows the draft flow.
function ReservationFlow({ onCreated, onClose }: FlowProps) {
  const today = useMemo(() => todayInOslo(), [])
  const { data, reload } = useReservationFlowData(today, onClose)
  const profile = useProfile()

  if (data.status === 'ready' && profile.status === 'ready') {
    return (
      <DraftFlow
        today={today}
        reservations={data.reservations}
        guests={data.guests}
        currentUserId={profile.profile.id}
        onCreated={onCreated}
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
  /** A reservation was created; the popup is closed right after. */
  onCreated: () => void
  onClose: () => void
}

// The flow for a new reservation, in a modal. Only the "Avbryt" button closes it: swipe-to-close
// and a tap on the backdrop would throw the draft away without asking (Framework7 has no way to
// veto them).
export default function NewReservationPopup({
  opened,
  onCreated,
  onClose,
}: NewReservationPopupProps) {
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
      {mounted && <ReservationFlow onCreated={onCreated} onClose={onClose} />}
    </Popup>
  )
}
