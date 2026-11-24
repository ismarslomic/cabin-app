import type { Router } from 'framework7/types'
import { Check } from 'lucide-react'
import { Block, Link, List, ListInput, Navbar, NavRight, Page, Preloader } from 'framework7-react'
import { useState } from 'react'
import { fetchProfile, updateProfile } from '@/features/profile/api/profile-api.ts'
import { setProfile, useProfile } from '@/features/profile/api/profile-store.ts'
import type { Gender, Profile } from '@/features/profile/api/types.ts'
import { birthYearErrorMessage, parseBirthYear } from '@/features/profile/birth-year.ts'
import { genderLabels } from '@/features/profile/labels.ts'
import {
  isVersionConflict,
  saveFailureText,
  versionConflictText,
} from '@/features/profile/api/error-texts.ts'
import { classifyFailure } from '@/shared/lib/api-error.ts'
import { handleCommonFailure } from '@/shared/ui/failure-feedback.ts'

function EditScreen({ profile, f7router }: { profile: Profile; f7router: Router.Router }) {
  const [firstName, setFirstName] = useState(profile.firstName)
  const [lastName, setLastName] = useState(profile.lastName)
  const [birthYear, setBirthYear] = useState(String(profile.birthYear))
  const [gender, setGender] = useState<Gender>(profile.gender)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string>()

  const year = parseBirthYear(birthYear)
  const yearInvalid = birthYear !== '' && year === null
  const valid = firstName.trim() !== '' && lastName.trim() !== '' && year !== null
  const changed =
    firstName.trim() !== profile.firstName ||
    lastName.trim() !== profile.lastName ||
    year !== profile.birthYear ||
    gender !== profile.gender
  const canSave = valid && changed && !saving

  // The profile changed elsewhere: fetch the latest and reset the form to it.
  const resetToLatest = async () => {
    try {
      const latest = await fetchProfile()
      setProfile(latest)
      setFirstName(latest.firstName)
      setLastName(latest.lastName)
      setBirthYear(String(latest.birthYear))
      setGender(latest.gender)
      setError(versionConflictText)
    } catch (e) {
      if (!handleCommonFailure(classifyFailure(e))) {
        setError('Kunne ikke hente nyeste profil. Prøv igjen senere.')
      }
    }
    setSaving(false)
  }

  const save = async () => {
    if (!canSave) return
    setSaving(true)
    setError(undefined)
    try {
      const saved = await updateProfile(
        { firstName: firstName.trim(), lastName: lastName.trim(), birthYear: year, gender },
        profile.version,
      )
      setProfile(saved)
      f7router.back()
    } catch (e) {
      const failure = classifyFailure(e)
      if (failure.kind === 'api' && isVersionConflict(failure)) {
        await resetToLatest()
        return
      }
      if (!handleCommonFailure(failure)) setError(saveFailureText(failure))
      setSaving(false)
    }
  }

  return (
    <Page name="edit-profile">
      <Navbar title="Rediger profil" backLink="Tilbake">
        <NavRight>
          <Link
            aria-label="Lagre"
            className={canSave ? undefined : 'disabled'}
            onClick={() => {
              void save()
            }}
          >
            <Check size={24} />
          </Link>
        </NavRight>
      </Navbar>
      <List strongIos dividersIos insetIos>
        <ListInput
          inputId="profile-first-name"
          label="Fornavn"
          type="text"
          placeholder="Påkrevd"
          autocomplete="given-name"
          value={firstName}
          onInput={(e) => {
            setFirstName((e.target as HTMLInputElement).value)
          }}
        />
        <ListInput
          inputId="profile-last-name"
          label="Etternavn"
          type="text"
          placeholder="Påkrevd"
          autocomplete="family-name"
          value={lastName}
          onInput={(e) => {
            setLastName((e.target as HTMLInputElement).value)
          }}
        />
        <ListInput
          inputId="profile-birth-year"
          label="Fødselsår"
          type="text"
          placeholder="Påkrevd"
          inputmode="numeric"
          value={birthYear}
          errorMessageForce={yearInvalid}
          errorMessage={birthYearErrorMessage()}
          onInput={(e) => {
            setBirthYear((e.target as HTMLInputElement).value)
          }}
        />
        <ListInput
          inputId="profile-gender"
          label="Kjønn"
          type="select"
          value={gender}
          onChange={(e) => {
            setGender((e.target as HTMLSelectElement).value as Gender)
          }}
        >
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
    </Page>
  )
}

export default function EditProfilePage({ f7router }: { f7router: Router.Router }) {
  const { profile } = useProfile()

  if (profile) return <EditScreen profile={profile} f7router={f7router} />

  return (
    <Page name="edit-profile">
      <Navbar title="Rediger profil" backLink="Tilbake" />
      <Block className="text-align-center">
        <Preloader />
      </Block>
    </Page>
  )
}
