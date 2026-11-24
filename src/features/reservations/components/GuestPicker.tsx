import {
  Block,
  BlockTitle,
  List,
  ListItem,
  PageContent,
  Link,
  Searchbar,
  Sheet,
} from 'framework7-react'
import { Check, X } from 'lucide-react'
import { type ChangeEvent, useState } from 'react'
import '@/features/reservations/components/GuestPicker.css'
import { Avatar } from '@/features/profile/index.ts'
import type { Guest } from '@/features/reservations/api/types.ts'
import { filterGuests, groupGuests, guestName } from '@/features/reservations/lib/guests.ts'

interface GuestPickerProps {
  opened: boolean
  /** The guests that are not on the reservation yet. */
  available: Guest[]
  /** How many more guests the reservation can take. */
  room: number
  onAdd: (guestIds: string[]) => void
  onClose: () => void
}

interface GuestGroupProps {
  title: string
  guests: Guest[]
  selected: string[]
  full: boolean
  onToggle: (guestId: string) => void
}

function GuestGroup({ title, guests, selected, full, onToggle }: GuestGroupProps) {
  if (guests.length === 0) return null
  return (
    <>
      <BlockTitle>{title}</BlockTitle>
      <List strong inset dividersIos>
        {guests.map((guest) => {
          const checked = selected.includes(guest.id)
          return (
            <ListItem
              key={guest.id}
              checkbox
              name="guest"
              value={guest.id}
              title={guestName(guest)}
              checked={checked}
              disabled={full && !checked}
              onChange={() => {
                onToggle(guest.id)
              }}
            >
              <span slot="media">
                <Avatar avatarUrl={guest.avatarUrl} size={32} />
              </span>
            </ListItem>
          )
        })}
      </List>
    </>
  )
}

// A sheet to pick guests that are not on the reservation yet. Nothing is added until "Legg til".
export default function GuestPicker({ opened, available, room, onAdd, onClose }: GuestPickerProps) {
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<string[]>([])
  const shown = filterGuests(available, query)
  const { family, others } = groupGuests(shown)
  const full = selected.length >= room
  // Framework7 renders a sheet's content also while it is closed: show it only while open, so each
  // opening starts with an empty search and no guests selected.
  const [mounted, setMounted] = useState(false)
  if (opened && !mounted) {
    setMounted(true)
    setQuery('')
    setSelected([])
  }

  const toggle = (guestId: string) => {
    setSelected((current) =>
      current.includes(guestId)
        ? current.filter((id) => id !== guestId)
        : current.length < room
          ? [...current, guestId]
          : current,
    )
  }

  return (
    <Sheet
      opened={opened}
      backdrop
      className="guest-picker"
      onSheetClosed={() => {
        setMounted(false)
        // Closed by a swipe: tell the parent.
        if (opened) onClose()
      }}
    >
      {mounted && (
        <PageContent>
          {/* The header and the search stay in place while the list scrolls under them. */}
          <div className="guest-picker-top">
            <div className="guest-picker-header">
              <Link iconOnly aria-label="Lukk" className="guest-picker-button" onClick={onClose}>
                <X size={22} aria-hidden="true" />
              </Link>
              <div className="guest-picker-title">
                <strong>Velg gjester</strong>
                <span>{selected.length === 0 ? 'Ingen valgt' : `${selected.length} valgt`}</span>
              </div>
              <Link
                iconOnly
                aria-label="Legg til valgte"
                className={
                  selected.length === 0
                    ? 'guest-picker-button guest-picker-confirm disabled'
                    : 'guest-picker-button guest-picker-confirm'
                }
                onClick={() => {
                  if (selected.length > 0) onAdd(selected)
                }}
              >
                <Check size={24} aria-hidden="true" />
              </Link>
            </div>
            <Searchbar
              customSearch
              placeholder="Søk etter gjest"
              clearButton
              disableButton={false}
              value={query}
              onInput={(event: ChangeEvent<HTMLInputElement>) => {
                setQuery(event.target.value)
              }}
              onSearchbarClear={() => {
                setQuery('')
              }}
            />
          </div>
          {available.length === 0 && <Block>Alle gjestene er allerede lagt til.</Block>}
          {available.length > 0 && shown.length === 0 && <Block>Ingen gjester funnet.</Block>}
          <GuestGroup
            title="Familie"
            guests={family}
            selected={selected}
            full={full}
            onToggle={toggle}
          />
          <GuestGroup
            title="Andre"
            guests={others}
            selected={selected}
            full={full}
            onToggle={toggle}
          />
        </PageContent>
      )}
    </Sheet>
  )
}
