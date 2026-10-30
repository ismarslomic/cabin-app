import { Navbar } from 'framework7-react'
import { ProfileNavRight } from '@/features/profile/index.ts'
import AppPage from '@/shared/ui/AppPage.tsx'
import Placeholder from '@/shared/ui/Placeholder.tsx'
import ViewSwitcher from '@/shared/ui/ViewSwitcher.tsx'

export default function StatisticsPage() {
  return (
    <AppPage name="statistics">
      <Navbar title="Statistikk" large transparent>
        <ProfileNavRight />
        <ViewSwitcher options={['År', 'Gjester', 'Kjøring']} />
      </Navbar>
      <Placeholder title="Nøkkeltall" />
      <Placeholder title="Dager på hytta per måned" />
      <Placeholder title="Gjester" />
    </AppPage>
  )
}
