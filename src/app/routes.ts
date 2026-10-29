import type { Router } from 'framework7/types'
import { homeRoutes } from '@/features/home/index.ts'

export const routes: Router.RouteParameters[] = [...homeRoutes]
