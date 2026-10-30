import { ChartColumn } from 'lucide-react'
import { Block, Navbar, Page } from 'framework7-react'

export default function StatisticsPage() {
  return (
    <Page name="statistics">
      <Navbar title="Statistikk" />
      <Block>
        <ChartColumn size={32} />
        <p>Statistikk kommer snart.</p>
      </Block>
    </Page>
  )
}
