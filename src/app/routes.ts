import type { Router } from 'framework7/types'
import { calendarRoutes } from '@/features/calendar/index.ts'
import { drivingRoutes } from '@/features/driving/index.ts'
import { homeRoutes } from '@/features/home/index.ts'
import { statisticsRoutes } from '@/features/statistics/index.ts'

export const routes: Router.RouteParameters[] = [
  ...homeRoutes,
  ...calendarRoutes,
  ...statisticsRoutes,
  ...drivingRoutes,
]
