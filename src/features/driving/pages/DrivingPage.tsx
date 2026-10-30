import { Navbar, Page } from 'framework7-react'
import Placeholder from '@/shared/ui/Placeholder.tsx'
import ViewSwitcher from '@/shared/ui/ViewSwitcher.tsx'

export default function DrivingPage() {
  return (
    <Page name="driving">
      <Navbar title="Kjøring" large transparent />
      <ViewSwitcher options={['År', 'Turer', 'Kjøretøy']} />
      <Placeholder title="Nøkkeltall" />
      <Placeholder title="Kart" />
      <Placeholder title="Siste turer" />
    </Page>
  )
}
