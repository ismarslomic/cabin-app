import { UserRound } from 'lucide-react'
import { useAvatarUrl } from '@/features/profile/api/profile-store.ts'
import './Avatar.css'

interface AvatarProps {
  guestId?: string
  /** Diameter in pixels. */
  size: number
}

// The guest's photo; a person icon until it is loaded or when the guest has none.
export default function Avatar({ guestId, size }: AvatarProps) {
  const url = useAvatarUrl(guestId)

  return (
    <span className="avatar" style={{ width: size, height: size }} aria-hidden="true">
      {url ? <img src={url} alt="" /> : <UserRound size={Math.round(size * 0.6)} />}
    </span>
  )
}
