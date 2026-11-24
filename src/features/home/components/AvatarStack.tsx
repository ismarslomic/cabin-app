import { Avatar } from '@/features/profile/index.ts'
import type { ReservationGuest } from '@/features/home/api/stats-api.ts'
import { isAtCabin } from '@/features/reservations/index.ts'
import './AvatarStack.css'

const MAX_AVATARS = 4

// Overlapping guest photos; guests beyond the first four collapse into a "+N" chip.
// With `today` (yyyy-MM-dd), guests whose own stay does not include today are dimmed.
export default function AvatarStack({
  guests,
  today,
}: {
  guests: ReservationGuest[]
  today?: string
}) {
  const absent = (guest: ReservationGuest) => today !== undefined && !isAtCabin(guest, today)

  const shown = guests.slice(0, MAX_AVATARS)
  const hidden = guests.length - shown.length
  const names = guests.map((guest) => guest.firstName).join(', ')

  return (
    <span className="avatar-stack" role="img" aria-label={`Gjester: ${names}`}>
      {shown.map((guest) => (
        <span key={guest.guestId} className={absent(guest) ? 'avatar-stack-absent' : undefined}>
          <Avatar avatarUrl={guest.avatarUrl} size={32} />
        </span>
      ))}
      {hidden > 0 && <span className="avatar-stack-more">+{hidden}</span>}
    </span>
  )
}
