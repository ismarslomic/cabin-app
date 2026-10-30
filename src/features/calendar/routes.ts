import type { Router } from 'framework7/types'
import CalendarPage from '@/features/calendar/pages/CalendarPage.tsx'

export const calendarRoutes: Router.RouteParameters[] = [
  { path: '/kalender/', component: CalendarPage },
]
