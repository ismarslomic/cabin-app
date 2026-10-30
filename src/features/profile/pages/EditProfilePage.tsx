import type { Router } from 'framework7/types'
import { Block, Button, List, ListInput, Navbar, Page, Preloader } from 'framework7-react'
import { useState } from 'react'
import { ProfileApiError, updateProfile } from '@/features/profile/api/profile-api.ts'
import { loadProfile, useProfile } from '@/features/profile/api/profile-store.ts'
import type { Gender, Profile } from '@/features/profile/api/types.ts'
import { genderLabels, MIN_BIRTH_YEAR, parseBirthYear } from '@/features/profile/labels.ts'
import { SessionExpiredError } from '@/shared/lib/http.ts'

const CURRENT_YEAR = new Date().getFullYear()

function EditForm({ profile, f7router }: { profile: Profile; f7router: Router.Router }) {
  const [firstName, setFirstName] = useState(profile.firstName)
  const [lastName, setLastName] = useState(profile.lastName)
  const [birthYear, setBirthYear] = useState(String(profile.birthYear))
  const [gender, setGender] = useState<Gender>(profile.gender)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string>()

  const year = parseBirthYear(birthYear, CURRENT_YEAR)
  const yearInvalid = birthYear !== '' && year === null
  const valid = firstName.trim() !== '' && lastName.trim() !== '' && year !== null

  const save = async () => {
    if (!valid) return
    setSaving(true)
    setError(undefined)
    try {
      await updateProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        birthYear: year,
        gender,
      })
      await loadProfile()
      f7router.back()
    } catch (e) {
      setError(
        e instanceof SessionExpiredError
          ? 'Økten din har utløpt. Last inn appen på nytt for å logge inn igjen.'
          : e instanceof ProfileApiError
            ? e.message
            : 'Kunne ikke lagre profilen.',
      )
      setSaving(false)
    }
  }

  return (
    <>
      <List inset strong form>
        <ListInput
          inputId="profile-first-name"
          type="text"
          autocomplete="given-name"
          value={firstName}
          onInput={(e) => {
            setFirstName((e.target as HTMLInputElement).value)
          }}
        >
          <label slot="label" htmlFor="profile-first-name">
            Fornavn
          </label>
        </ListInput>
        <ListInput
          inputId="profile-last-name"
          type="text"
          autocomplete="family-name"
          value={lastName}
          onInput={(e) => {
            setLastName((e.target as HTMLInputElement).value)
          }}
        >
          <label slot="label" htmlFor="profile-last-name">
            Etternavn
          </label>
        </ListInput>
        <ListInput
          inputId="profile-birth-year"
          type="text"
          inputmode="numeric"
          value={birthYear}
          errorMessageForce={yearInvalid}
          errorMessage={`Skriv et årstall mellom ${MIN_BIRTH_YEAR} og ${CURRENT_YEAR}`}
          onInput={(e) => {
            setBirthYear((e.target as HTMLInputElement).value)
          }}
        >
          <label slot="label" htmlFor="profile-birth-year">
            Fødselsår
          </label>
        </ListInput>
        <ListInput
          inputId="profile-gender"
          type="select"
          value={gender}
          onChange={(e) => {
            setGender((e.target as HTMLSelectElement).value as Gender)
          }}
        >
          <label slot="label" htmlFor="profile-gender">
            Kjønn
          </label>
          {(Object.keys(genderLabels) as Gender[]).map((value) => (
            <option key={value} value={value}>
              {genderLabels[value]}
            </option>
          ))}
        </ListInput>
      </List>
      {error && (
        <div role="alert">
          <Block className="text-color-red">{error}</Block>
        </div>
      )}
      <Block>
        <Button
          fill
          large
          disabled={!valid || saving}
          onClick={() => {
            void save()
          }}
        >
          Lagre
        </Button>
      </Block>
    </>
  )
}

export default function EditProfilePage({ f7router }: { f7router: Router.Router }) {
  const { profile } = useProfile()

  return (
    <Page name="edit-profile">
      <Navbar title="Rediger profil" backLink="Tilbake" />
      {profile ? (
        <EditForm profile={profile} f7router={f7router} />
      ) : (
        <Block className="text-align-center">
          <Preloader />
        </Block>
      )}
    </Page>
  )
}
