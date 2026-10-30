import { Link, NavRight } from 'framework7-react'
import Avatar from '@/features/profile/components/Avatar.tsx'
import { useProfile } from '@/features/profile/api/profile-store.ts'

// The avatar in the top right corner of a navbar; opens the profile page. Must be a child of <Navbar>.
export default function ProfileNavRight() {
  const { profile } = useProfile()

  return (
    <NavRight>
      <Link href="/profil/" aria-label="Profil">
        <Avatar guestId={profile?.id} size={32} />
      </Link>
    </NavRight>
  )
}
