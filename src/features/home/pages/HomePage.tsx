import { Navbar } from 'framework7-react'
import { useState } from 'react'
import HomeHero from '@/features/home/components/HomeHero.tsx'
import { pickHero } from '@/features/home/components/heroes.ts'
import AppPage from '@/shared/ui/AppPage.tsx'
import Placeholder from '@/shared/ui/Placeholder.tsx'

export default function HomePage() {
  // A random photo per app launch; pulling down to refresh picks another one.
  const [hero, setHero] = useState(() => pickHero())

  return (
    <AppPage
      name="home"
      onRefresh={() => {
        setHero((current) => pickHero(Math.random, current))
      }}
    >
      <Navbar title="Slomic smarthytte" large transparent />
      <HomeHero hero={hero} />
      <Placeholder title="Gjeldende besøk" />
      <Placeholder title="Neste besøk" />
      <Placeholder title="Dette året" />
    </AppPage>
  )
}
