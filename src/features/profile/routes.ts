import type { Router } from 'framework7/types'
import EditProfilePage from '@/features/profile/pages/EditProfilePage.tsx'
import ProfilePage from '@/features/profile/pages/ProfilePage.tsx'

export const profileRoutes: Router.RouteParameters[] = [
  { path: '/profil/', component: ProfilePage },
  { path: '/profil/rediger/', component: EditProfilePage },
]
