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
  View,
} from 'framework7-react'
import { useMemo, useState } from 'react'
import { useReservationFlowData } from '@/features/reservations/api/useReservationFlowData.ts'
import PeriodStep from '@/features/reservations/components/PeriodStep.tsx'
import StepIndicator from '@/features/reservations/components/StepIndicator.tsx'
import { initialPeriod, isSamePeriod } from '@/features/reservations/lib/draft.ts'
import { todayInOslo } from '@/shared/lib/dates.ts'
import ErrorState from '@/shared/ui/ErrorState.tsx'
import Placeholder from '@/shared/ui/Placeholder.tsx'

const STEPS = ['Periode', 'Gjester']

interface FlowProps {
  onClose: () => void
}

function ReservationFlow({ onClose }: FlowProps) {
  const today = useMemo(() => todayInOslo(), [])
  const initial = useMemo(() => initialPeriod(today), [today])
  const [period, setPeriod] = useState(initial)
  const [step, setStep] = useState(0)
  const [confirmingCancel, setConfirmingCancel] = useState(false)
  const { data, reload } = useReservationFlowData(today)

  // Closes at once when nothing was changed, otherwise asks before the draft is thrown away.
  const cancel = () => {
    if (isSamePeriod(period, initial)) onClose()
    else setConfirmingCancel(true)
  }

  return (
    <Page>
      <Navbar>
        <NavLeft>
          {step > 0 && (
            <Link
              onClick={() => {
                setStep(step - 1)
              }}
            >
              Tilbake
            </Link>
          )}
        </NavLeft>
        <NavTitle>Ny reservasjon</NavTitle>
        <NavRight>
          <Link onClick={cancel}>Avbryt</Link>
        </NavRight>
      </Navbar>
      <StepIndicator steps={STEPS} current={step} />
      {data.status === 'loading' && (
        <div role="status">
          <Block className="skeleton-text skeleton-effect-wave">Laster reservasjoner</Block>
        </div>
      )}
      {data.status === 'error' && (
        <ErrorState message="Kunne ikke hente reservasjonene." onRetry={reload} />
      )}
      {data.status === 'ready' && step === 0 && (
        <PeriodStep
          period={period}
          today={today}
          reservations={data.reservations}
          onChange={setPeriod}
          onNext={() => {
            setStep(1)
          }}
        />
      )}
      {data.status === 'ready' && step === 1 && <Placeholder title="Gjester" />}
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
