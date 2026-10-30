import type { Router } from 'framework7/types'
import StatisticsPage from '@/features/statistics/pages/StatisticsPage.tsx'

export const statisticsRoutes: Router.RouteParameters[] = [
  { path: '/statistikk/', component: StatisticsPage },
]
