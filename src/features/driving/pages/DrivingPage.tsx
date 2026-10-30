import { Car } from 'lucide-react'
import { Block, Navbar, Page } from 'framework7-react'

export default function DrivingPage() {
  return (
    <Page name="driving">
      <Navbar title="Kjøring" />
      <Block>
        <Car size={32} />
        <p>Kjøring kommer snart.</p>
      </Block>
    </Page>
  )
}
