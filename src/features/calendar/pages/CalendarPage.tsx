import { CalendarDays } from 'lucide-react'
import { Block, Navbar, Page } from 'framework7-react'

export default function CalendarPage() {
  return (
    <Page name="calendar">
      <Navbar title="Kalender" />
      <Block>
        <CalendarDays size={32} />
        <p>Kalender kommer snart.</p>
      </Block>
    </Page>
  )
}
