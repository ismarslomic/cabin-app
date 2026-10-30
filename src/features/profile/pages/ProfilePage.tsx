import { Block, Button, Link, List, ListItem, Navbar, NavRight, Preloader } from 'framework7-react'
import { loadProfile, reloadProfile, useProfile } from '@/features/profile/api/profile-store.ts'
import Avatar from '@/features/profile/components/Avatar.tsx'
import { genderLabels, roleLabels } from '@/features/profile/labels.ts'
import AppPage from '@/shared/ui/AppPage.tsx'

export default function ProfilePage() {
  const { status, profile } = useProfile()

  return (
    <AppPage name="profile" onRefresh={loadProfile}>
      <Navbar title="Profil" backLink="Tilbake">
        {profile && (
          <NavRight>
            <Link href="/profil/rediger/">Rediger</Link>
          </NavRight>
        )}
      </Navbar>
      {profile && (
        <>
          <Block className="text-align-center">
            <Avatar guestId={profile.id} size={96} />
            <h2>
              {profile.firstName} {profile.lastName}
            </h2>
          </Block>
          <List inset strong>
            <ListItem title="Fornavn" after={profile.firstName} />
            <ListItem title="Etternavn" after={profile.lastName} />
            <ListItem title="E-post" after={profile.email} />
            <ListItem title="Fødselsår" after={String(profile.birthYear)} />
            <ListItem title="Kjønn" after={genderLabels[profile.gender]} />
            <ListItem title="Familie" after={profile.isFamily ? 'Ja' : 'Nei'} />
            <ListItem title="Rolle" after={roleLabels[profile.role]} />
          </List>
        </>
      )}
      {!profile && status === 'loading' && (
        <Block className="text-align-center">
          <Preloader />
        </Block>
      )}
      {status === 'expired' && (
        <div role="alert">
          <Block className="text-align-center">
            Økten din har utløpt. Last inn appen på nytt for å logge inn igjen.
          </Block>
        </div>
      )}
      {status === 'error' && (
        <div role="alert">
          <Block className="text-align-center">
            <p>Kunne ikke hente profilen.</p>
            <Button
              onClick={() => {
                void reloadProfile()
              }}
            >
              Prøv igjen
            </Button>
          </Block>
        </div>
      )}
    </AppPage>
  )
}
