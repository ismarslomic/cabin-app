import { Block, Navbar, Page } from 'framework7-react'

export default function HomePage() {
  return (
    <Page name="home">
      <Navbar title="Slomic Smarthytte" />
      <Block>
        <p>Velkommen til smarthytta.</p>
      </Block>
    </Page>
  )
}
