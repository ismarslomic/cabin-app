import { Navbar, Page } from 'framework7-react'
import Placeholder from '@/shared/ui/Placeholder.tsx'
import ViewSwitcher from '@/shared/ui/ViewSwitcher.tsx'

export default function StatisticsPage() {
  return (
    <Page name="statistics">
      <Navbar title="Statistikk" large transparent>
        <ViewSwitcher options={['År', 'Gjester', 'Kjøring']} />
      </Navbar>
      <Placeholder title="Nøkkeltall" />
      <Placeholder title="Dager på hytta per måned" />
      <Placeholder title="Gjester" />
    </Page>
  )
}
