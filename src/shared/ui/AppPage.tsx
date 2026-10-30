import { Page } from 'framework7-react'
import type { ComponentProps } from 'react'
import { refreshApp } from '@/shared/lib/app-refresh.ts'

type AppPageProps = ComponentProps<typeof Page> & {
  /** Page-specific part of a pull-to-refresh (e.g. reload the page's data); runs next to the update check. */
  onRefresh?: () => void | Promise<void>
}

// A Framework7 Page with pull-to-refresh: pulling down checks for a new version of the app, and
// runs the page's own `onRefresh` if it has one.
export default function AppPage({ onRefresh, ...props }: AppPageProps) {
  return (
    <Page
      ptr
      onPtrRefresh={(done: () => void) => {
        void Promise.all([refreshApp(), onRefresh?.()]).finally(done)
      }}
      {...props}
    />
  )
}
