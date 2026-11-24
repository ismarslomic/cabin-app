import {
  Block,
  BlockTitle,
  Button,
  List,
  ListItem,
  PageContent,
  Searchbar,
  Sheet,
  Toolbar,
} from 'framework7-react'
import { useState } from 'react'
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
                <Avatar guestId={guest.id} size={32} />
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
      swipeToClose
      backdrop
      style={{ height: '85%' }}
      onSheetClosed={() => {
        setMounted(false)
        // Closed by a swipe: tell the parent.
        if (opened) onClose()
      }}
    >
      {mounted && (
        <>
          <Toolbar top>
            <Button onClick={onClose}>Avbryt</Button>
            <Button
              disabled={selected.length === 0}
              onClick={() => {
                onAdd(selected)
              }}
            >
              Legg til valgte ({selected.length})
            </Button>
          </Toolbar>
          <PageContent>
            <Searchbar
              customSearch
              placeholder="Søk etter gjest"
              clearButton
              disableButton={false}
              value={query}
              onInput={(event: React.ChangeEvent<HTMLInputElement>) => {
                setQuery(event.target.value)
              }}
              onSearchbarClear={() => {
                setQuery('')
              }}
            />
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
        </>
      )}
    </Sheet>
  )
}
