import { Navbar } from 'framework7-react'
import { ProfileNavRight } from '@/features/profile/index.ts'
import AppPage from '@/shared/ui/AppPage.tsx'
import Placeholder from '@/shared/ui/Placeholder.tsx'
import ViewSwitcher from '@/shared/ui/ViewSwitcher.tsx'

export default function DrivingPage() {
  return (
    <AppPage name="driving">
      <Navbar title="Kjøring" large transparent>
        <ProfileNavRight />
        <ViewSwitcher options={['År', 'Turer', 'Kjøretøy']} />
      </Navbar>
      <Placeholder title="Nøkkeltall" />
      <Placeholder title="Kart" />
      <Placeholder title="Siste turer" />
    </AppPage>
  )
}
