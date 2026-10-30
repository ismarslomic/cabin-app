import { Navbar, Page } from 'framework7-react'
import HomeHero from '@/features/home/components/HomeHero.tsx'
import Placeholder from '@/shared/ui/Placeholder.tsx'

export default function HomePage() {
  return (
    <Page name="home">
      <Navbar title="Hytteportalen" large transparent />
      <HomeHero />
      <Placeholder title="Gjeldende besøk" />
      <Placeholder title="Neste besøk" />
      <Placeholder title="Dette året" />
    </Page>
  )
}
