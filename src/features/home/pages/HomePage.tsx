import { Navbar, NavTitle } from 'framework7-react'
import { useState } from 'react'
import HomeHero from '@/features/home/components/HomeHero.tsx'
import HomeLogo from '@/features/home/components/HomeLogo.tsx'
import { pickHero } from '@/features/home/components/heroes.ts'
import { ProfileNavRight } from '@/features/profile/index.ts'
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
      <Navbar large transparent>
        {/* The small title shows when the page is scrolled; the large one is the logo. */}
        <NavTitle>Slomic smarthytte</NavTitle>
        <div slot="title-large">
          <HomeLogo />
        </div>
        <ProfileNavRight />
      </Navbar>
      <HomeHero hero={hero} />
      <Placeholder title="Gjeldende besøk" />
      <Placeholder title="Neste besøk" />
      <Placeholder title="Dette året" />
    </AppPage>
  )
}
