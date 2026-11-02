import { Block, Button } from 'framework7-react'
import { Plus } from 'lucide-react'
import './ReserveButton.css'

interface ReserveButtonProps {
  hasCurrent: boolean
  hasNext: boolean
  /** Inside another card (the empty state): no block margins of its own. */
  inCard?: boolean
}

// Always visible; the accent gets quieter the more is already booked.
// Opens the Calendar tab until the booking flow exists.
export default function ReserveButton({ hasCurrent, hasNext, inCard = false }: ReserveButtonProps) {
  const variant =
    hasCurrent && hasNext ? { outline: true } : hasCurrent ? { tonal: true } : { fill: true }

  const button = (
    <Button large round tabLink="#view-calendar" {...variant}>
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
