import type { Router } from 'framework7/types'
import HomePage from '@/features/home/pages/HomePage.tsx'

export const homeRoutes: Router.RouteParameters[] = [{ path: '/', component: HomePage }]
