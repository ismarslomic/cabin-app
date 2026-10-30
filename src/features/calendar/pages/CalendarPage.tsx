import { Navbar, Page } from 'framework7-react'
import Placeholder from '@/shared/ui/Placeholder.tsx'
import ViewSwitcher from '@/shared/ui/ViewSwitcher.tsx'

export default function CalendarPage() {
  return (
    <Page name="calendar">
      <Navbar title="Kalender" large transparent>
        <ViewSwitcher options={['Måned', 'Liste', 'År']} />
      </Navbar>
      <Placeholder title="Kalender" />
      <Placeholder title="Besøk" />
    </Page>
  )
}
