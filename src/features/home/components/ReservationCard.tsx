import { List, ListItem } from 'framework7-react'
import AvatarStack from '@/features/home/components/AvatarStack.tsx'
import type { ReservationGuest } from '@/features/home/api/stats-api.ts'
import { formatDateRange } from '@/features/home/format.ts'
import './ReservationCard.css'

interface ReservationCardProps {
  /** Card title: "Gjeldende besøk" or "Neste besøk". */
  title: string
  /** Picks the status color: green for the current reservation, blue for the next one. */
  kind: 'current' | 'next'
  startDate: string
  endDate: string
  guests: ReservationGuest[]
  statusText: string
  /** Number of the reservation when all are sorted by start date, from 1. */
  order: number
}

// One reservation: titled with its state, dates, colored status line and the guests' photos.
export default function ReservationCard({
  title,
  kind,
  startDate,
  endDate,
  guests,
  statusText,
  order,
}: ReservationCardProps) {
  return (
    <List strong inset mediaList className={`reservation-card reservation-card-${kind}`}>
      <ListItem title={formatDateRange(startDate, endDate)}>
        <span slot="header" className="reservation-heading">
          <span className="reservation-dot" aria-hidden="true" />
          {title}
          <span className="reservation-order">#{order}</span>
        </span>
        <span slot="footer" className="reservation-status">
          {statusText}
        </span>
        <span slot="after">
          <AvatarStack guests={guests} />
        </span>
      </ListItem>
    </List>
  )
}
