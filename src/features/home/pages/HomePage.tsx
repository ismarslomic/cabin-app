import { Block, BlockTitle, Button, Navbar, NavTitle } from 'framework7-react'
import { useState } from 'react'
import { useHomeStats } from '@/features/home/api/useHomeStats.ts'
import EmptyReservations from '@/features/home/components/EmptyReservations.tsx'
import HomeHero from '@/features/home/components/HomeHero.tsx'
import HomeSkeleton from '@/features/home/components/HomeSkeleton.tsx'
import HomeLogo from '@/features/home/components/HomeLogo.tsx'
import ReservationCard from '@/features/home/components/ReservationCard.tsx'
import ReserveButton from '@/features/home/components/ReserveButton.tsx'
import YearStats from '@/features/home/components/YearStats.tsx'
import { pickHero } from '@/features/home/components/heroes.ts'
import { currentStatusText, nextStatusText } from '@/features/home/format.ts'
import { ProfileNavRight } from '@/features/profile/index.ts'
import AppPage from '@/shared/ui/AppPage.tsx'
import './HomePage.css'

export default function HomePage() {
  // A random photo per app launch; pulling down to refresh picks another one.
  const [hero, setHero] = useState(() => pickHero())
  const { state, reload } = useHomeStats()

  return (
    <AppPage
      name="home"
      onRefresh={async () => {
        setHero((current) => pickHero(Math.random, current))
        await reload()
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
      {state.status === 'loading' && <HomeSkeleton />}
      {state.status === 'expired' && (
        <div role="alert">
          <Block className="text-align-center">
            Økten din har utløpt. Last inn appen på nytt for å logge inn igjen.
          </Block>
        </div>
      )}
      {state.status === 'error' && (
        <div role="alert">
          <Block className="text-align-center">
            <p>Kunne ikke hente besøkene.</p>
            <Button
              onClick={() => {
                void reload()
              }}
            >
              Prøv igjen
            </Button>
          </Block>
        </div>
      )}
      {state.status === 'ready' && (
        <>
          {state.live.currentReservation && (
            <ReservationCard
              title="Gjeldende besøk"
              kind="current"
              startDate={state.live.currentReservation.startDate}
              endDate={state.live.currentReservation.endDate}
              guests={state.live.currentReservation.guests}
              statusText={currentStatusText(state.live.currentReservation.remainingNights)}
              order={state.live.currentReservation.reservationOrderInYear}
            />
          )}
          {state.live.nextReservation && (
            <ReservationCard
              title="Neste besøk"
              kind="next"
              startDate={state.live.nextReservation.startDate}
              endDate={state.live.nextReservation.endDate}
              guests={state.live.nextReservation.guests}
              statusText={nextStatusText(state.live.nextReservation.daysUntil)}
              order={state.live.nextReservation.reservationOrderInYear}
            />
          )}
          {!state.live.currentReservation && !state.live.nextReservation && <EmptyReservations />}
          {(state.live.currentReservation || state.live.nextReservation) && (
            <ReserveButton
              hasCurrent={!!state.live.currentReservation}
              hasNext={!!state.live.nextReservation}
            />
          )}
          <div className="home-year">
            <BlockTitle>Dette året</BlockTitle>
            <YearStats stats={state.year} />
          </div>
        </>
      )}
    </AppPage>
  )
}
