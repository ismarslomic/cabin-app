import { CalendarDays, Car, ChartColumn, House } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export interface TabDefinition {
  id: string
  label: string
  url: string
  icon: LucideIcon
}

export const tabs: TabDefinition[] = [
  { id: 'view-home', label: 'Hjem', url: '/', icon: House },
  { id: 'view-calendar', label: 'Kalender', url: '/kalender/', icon: CalendarDays },
  { id: 'view-statistics', label: 'Statistikk', url: '/statistikk/', icon: ChartColumn },
  { id: 'view-driving', label: 'Kjøring', url: '/kjoring/', icon: Car },
]

/** The tab whose root path matches the browser URL, or the first tab when none does. */
export function tabForPath(pathname: string): TabDefinition {
  const normalized = pathname.endsWith('/') ? pathname : `${pathname}/`
  return tabs.find((tab) => tab.url === normalized) ?? tabs[0]
}
