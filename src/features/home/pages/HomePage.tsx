import { House } from 'lucide-react'
import { Block, Navbar, Page } from 'framework7-react'

export default function HomePage() {
  return (
    <Page name="home">
      <Navbar title="Slomic Smarthytte" />
      <Block>
        <House size={32} />
        <p>Velkommen til smarthytta.</p>
      </Block>
    </Page>
  )
}
