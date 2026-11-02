import { Avatar } from '@/features/profile/index.ts'
import type { ReservationGuest } from '@/features/home/api/stats-api.ts'
import './AvatarStack.css'

const MAX_AVATARS = 4

// Overlapping guest photos; guests beyond the first four collapse into a "+N" chip.
export default function AvatarStack({ guests }: { guests: ReservationGuest[] }) {
  const shown = guests.slice(0, MAX_AVATARS)
  const hidden = guests.length - shown.length
  const names = guests.map((guest) => guest.firstName).join(', ')

  return (
    <span className="avatar-stack" role="img" aria-label={`Gjester: ${names}`}>
      {shown.map((guest) => (
        <Avatar key={guest.guestId} guestId={guest.guestId} size={32} />
      ))}
      {hidden > 0 && <span className="avatar-stack-more">+{hidden}</span>}
    </span>
  )
}
