import { Block, Button } from 'framework7-react'
import { Plus } from 'lucide-react'
import { useCanReserve } from '@/features/reservations/index.ts'
import './ReserveButton.css'

interface ReserveButtonProps {
  hasCurrent: boolean
  hasNext: boolean
  /** Inside another card (the empty state): no block margins of its own. */
  inCard?: boolean
  onReserve: () => void
}

// Always visible; the accent gets quieter the more is already booked.
// Opens the flow for a new reservation; hidden for a user who may not create one.
export default function ReserveButton({
  hasCurrent,
  hasNext,
  inCard = false,
  onReserve,
}: ReserveButtonProps) {
  const canReserve = useCanReserve()
  if (!canReserve) return null

  const variant =
    hasCurrent && hasNext ? { outline: true } : hasCurrent ? { tonal: true } : { fill: true }

  const button = (
    <Button large round onClick={onReserve} {...variant}>
      <Plus size={20} aria-hidden="true" />
      &nbsp;Reserver ny
    </Button>
  )

  return inCard ? (
    button
  ) : (
    <Block inset className="home-reserve">
      {button}
    </Block>
  )
}
