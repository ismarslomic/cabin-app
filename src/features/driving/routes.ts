import type { Router } from 'framework7/types'
import DrivingPage from '@/features/driving/pages/DrivingPage.tsx'

export const drivingRoutes: Router.RouteParameters[] = [
  { path: '/kjoring/', component: DrivingPage },
]
