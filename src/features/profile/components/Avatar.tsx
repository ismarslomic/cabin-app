import { UserRound } from 'lucide-react'
import { useAvatarUrl } from '@/features/profile/api/profile-store.ts'
import './Avatar.css'

interface AvatarProps {
  /** The avatar URL from the API; null or missing for a guest without an avatar (no request). */
  avatarUrl?: string | null
  /** Diameter in pixels. */
  size: number
}

// The guest's photo; a person icon until it is loaded or when the guest has none. A guest without
// an avatar (`avatarUrl` null) costs no request.
export default function Avatar({ avatarUrl, size }: AvatarProps) {
  const url = useAvatarUrl(avatarUrl)

  return (
    <span className="avatar" style={{ width: size, height: size }} aria-hidden="true">
      {url ? <img src={url} alt="" /> : <UserRound size={Math.round(size * 0.6)} />}
    </span>
  )
}
