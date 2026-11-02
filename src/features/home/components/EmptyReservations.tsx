import { Block } from 'framework7-react'
import { CalendarX } from 'lucide-react'
import ReserveButton from '@/features/home/components/ReserveButton.tsx'
import './EmptyReservations.css'

// Shown instead of "Gjeldende besøk" when no one is at the cabin and nothing is booked.
// It holds the reserve button and stretches to fill the page down to the year statistics.
export default function EmptyReservations() {
  return (
    <Block strong inset className="empty-reservations">
      <CalendarX size={40} aria-hidden="true" />
      <h3>Ingen planlagte besøk</h3>
      <p className="placeholder-text">
        Du har ingen gjeldende eller kommende reservasjoner akkurat nå.
      </p>
      <ReserveButton hasCurrent={false} hasNext={false} inCard />
    </Block>
  )
}
