import { act, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { f7 } from 'framework7-react'
import { useState } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { resetProfileStore } from '@/features/profile/api/profile-store.ts'
import { resetGuestsCache } from '@/features/reservations/api/guests-api.ts'
import { reloadForLogin, SessionExpiredError } from '@/shared/lib/http.ts'
import { NETWORK_TEXT, NO_ACCESS_TEXT, resetFailureFeedback } from '@/shared/ui/failure-feedback.ts'
import NewReservationPopup from '@/features/reservations/components/NewReservationPopup.tsx'
import { renderWithF7 } from '@/test/render-f7.tsx'

vi.mock('@/shared/lib/http.ts', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/shared/lib/http.ts')>()),
  reloadForLogin: vi.fn(),
}))

const fetchMock = vi.fn()

// The flow's own popup; the guest detail popup is nested in its page.
const flowPopup = '.framework7-root > .popup'

/** An existing reservation: the first and the last day of the stay (UTC dates). */
const reservation = (first: string, last: string) => ({
  id: 'r1',
  startTime: `${first}T15:00:00Z`,
  endTime: `${last}T12:00:00Z`,
})

function calendarDay(dataDate: string): HTMLElement {
  const day = document.querySelector<HTMLElement>(`.calendar-sheet [data-date="${dataDate}"]`)
  if (!day) throw new Error(`No calendar day ${dataDate}`)
  return day
}

const guest = (id: string, firstName: string, isFamily: boolean) => ({
  id,
  firstName,
  lastName: 'Test',
  isFamily,
})

// Ola and Kari are family; Per (the current user) and Siri are not.
const allGuests = [
  guest('kari', 'Kari', true),
  guest('ola', 'Ola', true),
  guest('per', 'Per', false),
  guest('siri', 'Siri', false),
]

interface Stub {
  reservations?: unknown[]
  guests?: unknown[]
  /** The answer to creating a reservation; a created reservation by default. */
  create?: (body: unknown) => Promise<Response>
}

// jsdom has no CSS transitions: finish the closing of the guest popup by hand.
function finishGuestPopupClose() {
  // A calendar sheet that was used also never finishes closing: drop it, so the next
  // `calendarDay` is looked up in the calendar of the next opening.
  document.querySelectorAll('.calendar-sheet').forEach((sheet) => {
    sheet.remove()
  })
  act(() => {
    document.querySelector('.popup.modal-out')?.dispatchEvent(new Event('transitionend'))
  })
}

// Answers by URL; a new Response per call (StrictMode runs effects twice).
function stubReservations({
  reservations = [],
  guests = allGuests,
  create = () => Promise.resolve(Response.json({ id: 'new' }, { status: 201 })),
}: Stub = {}) {
  fetchMock.mockImplementation((url: string, init?: RequestInit) => {
    if (url === '/api/reservations' && init?.method === 'POST') {
      return create(JSON.parse(init.body as string))
    }
    if (url.startsWith('/api/reservations')) return Promise.resolve(Response.json(reservations))
    if (url === '/api/guests') return Promise.resolve(Response.json(guests))
    if (url === '/api/me') return Promise.resolve(Response.json({ id: 'per', role: 'FAMILY_USER' }))
    return Promise.resolve(new Response(null, { status: 404 }))
  })
  vi.stubGlobal('fetch', fetchMock)
}

function renderPopup(onClose = vi.fn(), onCreated = vi.fn()) {
  renderWithF7(<NewReservationPopup opened onCreated={onCreated} onClose={onClose} />)
  return onClose
}

// A parent that opens the popup, as Home will.
function Harness({ onCreated = vi.fn() }: { onCreated?: () => void }) {
  const [opened, setOpened] = useState(false)
  return (
    <>
      <button
        type="button"
        onClick={() => {
          setOpened(true)
        }}
      >
        Åpne
      </button>
      <NewReservationPopup
        opened={opened}
        onCreated={onCreated}
        onClose={() => {
          setOpened(false)
        }}
      />
    </>
  )
}

describe('NewReservationPopup', () => {
  beforeEach(() => {
    // Monday 2026-11-23: the coming weekend is 27-29 November.
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-11-23T10:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
    fetchMock.mockReset()
    resetGuestsCache()
    resetProfileStore()
    resetFailureFeedback()
    vi.mocked(reloadForLogin).mockReset()
  })

  it('shows the coming weekend with the default times', async () => {
    stubReservations()
    renderPopup()

    expect(await screen.findByText('fre 27. nov.')).toBeInTheDocument()
    expect(screen.getByText('søn 29. nov.')).toBeInTheDocument()
    expect(screen.getByText('2 netter')).toBeInTheDocument()
    expect(screen.getByLabelText('Ankomst kl.')).toHaveValue('16:00')
    expect(screen.getByLabelText('Avreise kl.')).toHaveValue('13:00')
    expect(screen.getByRole('link', { name: 'Kommende helg' })).toHaveClass('button-active')
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/reservations?from=2026-11-23&to=2028-11-24',
      expect.anything(),
    )
  })

  it('shows the times as rows inside the same card as the dates', async () => {
    stubReservations()
    renderPopup()

    const arrival = await screen.findByLabelText('Ankomst kl.')

    // A row outside the list's <ul> would have no card and show list bullets.
    expect(arrival.closest('.list ul')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'fre 27. nov.' }).closest('.list ul')).toBe(
      arrival.closest('.list ul'),
    )
    expect(screen.getByLabelText('Avreise kl.').closest('.list ul')).toBe(
      arrival.closest('.list ul'),
    )
  })

  it('picks the weekend after with a quick pick', async () => {
    stubReservations()
    const user = userEvent.setup()
    renderPopup()

    await user.click(await screen.findByRole('link', { name: 'Neste helg' }))

    expect(screen.getByText('fre 4. des.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Neste helg' })).toHaveClass('button-active')
    expect(screen.getByRole('link', { name: 'Kommende helg' })).not.toHaveClass('button-active')
  })

  it('opens the calendar from the date rows', async () => {
    stubReservations()
    const user = userEvent.setup()
    renderPopup()

    await user.click(await screen.findByRole('button', { name: 'fre 27. nov.' }))

    expect(document.querySelector('.calendar-sheet')).toBeInTheDocument()
  })

  it('sets the period from two taps in the calendar', async () => {
    stubReservations()
    const user = userEvent.setup()
    renderPopup()

    await user.click(await screen.findByRole('button', { name: 'fre 27. nov.' }))
    // The calendar counts months from 0: "2026-10-12" is 12 November.
    await user.click(calendarDay('2026-10-12'))
    await user.click(calendarDay('2026-10-14'))

    expect(await screen.findByText('tor 12. nov.')).toBeInTheDocument()
    expect(screen.getByText('lør 14. nov.')).toBeInTheDocument()
    expect(screen.getByText('2 netter')).toBeInTheDocument()
  })

  it('ignores a calendar closed after the first tap only', async () => {
    stubReservations()
    const user = userEvent.setup()
    renderPopup()

    await user.click(await screen.findByRole('button', { name: 'fre 27. nov.' }))
    await user.click(calendarDay('2026-10-12'))
    expect(screen.getByText('fre 27. nov.')).toBeInTheDocument()

    f7.sheet.close('.calendar-sheet')

    expect(screen.getByText('fre 27. nov.')).toBeInTheDocument()
    expect(screen.getByText('søn 29. nov.')).toBeInTheDocument()
  })

  it('rejects the same day for start and end', async () => {
    stubReservations()
    const user = userEvent.setup()
    renderPopup()

    await user.click(await screen.findByRole('button', { name: 'fre 27. nov.' }))
    await user.click(calendarDay('2026-10-12'))
    await user.click(calendarDay('2026-10-12'))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Sluttdatoen må være etter startdatoen.',
    )
    expect(screen.getByRole('link', { name: 'Opprett' })).toHaveClass('disabled')
  })

  it('disables fully booked days in the calendar, but not the handover days', async () => {
    stubReservations({ reservations: [reservation('2026-12-10', '2026-12-14')] })
    const user = userEvent.setup()
    renderPopup()

    await user.click(await screen.findByRole('link', { name: 'Neste helg' }))
    await user.click(screen.getByRole('button', { name: 'fre 4. des.' }))

    expect(calendarDay('2026-11-11')).toHaveClass('calendar-day-disabled')
    expect(calendarDay('2026-11-13')).toHaveClass('calendar-day-disabled')
    expect(calendarDay('2026-11-10')).not.toHaveClass('calendar-day-disabled')
    expect(calendarDay('2026-11-14')).not.toHaveClass('calendar-day-disabled')
  })

  it('warns when the period overlaps a reservation and blocks "Opprett"', async () => {
    stubReservations({ reservations: [reservation('2026-11-26', '2026-11-30')] })
    renderPopup()

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Perioden overlapper en annen reservasjon. Velg andre datoer.',
    )
    expect(screen.getByRole('link', { name: 'Opprett' })).toHaveClass('disabled')
  })

  it('allows a same-day handover', async () => {
    stubReservations({ reservations: [reservation('2026-11-25', '2026-11-27')] })
    renderPopup()

    await screen.findByText('2 netter')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Opprett' })).not.toHaveClass('disabled')
  })

  it('rejects a time before 02:00 and blocks "Opprett"', async () => {
    stubReservations()
    const user = userEvent.setup()
    renderPopup()

    const arrival = await screen.findByLabelText('Ankomst kl.')
    await user.clear(arrival)
    await user.type(arrival, '01:30')

    expect(screen.getByText('Velg et tidspunkt mellom 02:00 og 23:59.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Opprett' })).toHaveClass('disabled')
  })

  it('shows the period problem before a time problem, and marks the time field', async () => {
    stubReservations({ reservations: [reservation('2026-11-26', '2026-11-30')] })
    const user = userEvent.setup()
    renderPopup()

    const arrival = await screen.findByLabelText('Ankomst kl.')
    await user.clear(arrival)
    await user.type(arrival, '01:30')

    expect(screen.getByRole('alert')).toHaveTextContent('Perioden overlapper en annen reservasjon.')
    expect(arrival).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByLabelText('Avreise kl.')).toHaveAttribute('aria-invalid', 'false')
  })

  it('shows the period and the guests on one page', async () => {
    stubReservations()
    renderPopup()

    expect(await screen.findByRole('link', { name: 'Kommende helg' })).toBeInTheDocument()
    expect(screen.getByText('Gjester (3)')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Neste' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Tilbake' })).not.toBeInTheDocument()
  })

  it('shows the period before the guests', async () => {
    stubReservations()
    renderPopup()

    const period = await screen.findByText('Eller velg datoer')
    const guests = screen.getByText('Gjester (3)')

    expect(period.compareDocumentPosition(guests) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('does not send while "Opprett" is disabled', async () => {
    const create = vi.fn(() => Promise.resolve(new Response(null, { status: 201 })))
    stubReservations({ reservations: [reservation('2026-11-26', '2026-11-30')], create })
    const user = userEvent.setup()
    renderPopup()

    const save = await screen.findByRole('link', { name: 'Opprett' })
    expect(save).toHaveAttribute('aria-disabled', 'true')
    await user.click(save)

    expect(create).not.toHaveBeenCalled()
  })

  describe('guests', () => {
    // The day pill in the guest detail: the period section has a pill with the same name.
    function ownDatePill(name = 'fre 27. nov.') {
      const list = screen.getByRole('checkbox', { name: 'Egen ankomst' }).closest('.list ul')
      return within(list as HTMLElement).getByRole('button', { name })
    }

    async function openGuests() {
      const user = userEvent.setup()
      renderPopup()
      await screen.findByText(/^Gjester \(\d+\)$/)
      return user
    }

    it('starts with the family and the current user', async () => {
      stubReservations()
      await openGuests()

      expect(screen.getByText('Kari Test')).toBeInTheDocument()
      expect(screen.getByText('Ola Test')).toBeInTheDocument()
      expect(screen.getByText('Per Test')).toBeInTheDocument()
      expect(screen.queryByText('Siri Test')).not.toBeInTheDocument()
    })

    it('has an add row without a chevron, that is disabled at the most guests', async () => {
      const many = Array.from({ length: 50 }, (_, index) =>
        guest(`g${index}`, `Gjest${index}`, true),
      )
      stubReservations({ guests: many })
      const user = await openGuests()

      const add = screen.getByRole('link', { name: 'Legg til gjest' }).closest('li')
      expect(add).toHaveClass('no-chevron', 'disabled')
      expect(screen.getByText('En reservasjon kan ha opptil 50 gjester.')).toBeInTheDocument()
      await user.click(screen.getByRole('link', { name: 'Legg til gjest' }))
      // The picker did not open.
      expect(screen.queryByRole('link', { name: 'Legg til valgte' })).not.toBeInTheDocument()
    })

    it('adds guests from the picker, grouped, with a title and how many are picked', async () => {
      stubReservations()
      const user = await openGuests()

      await user.click(screen.getByRole('link', { name: 'Legg til gjest' }))
      expect(await screen.findByText('Andre')).toBeInTheDocument()
      expect(screen.getByText('Velg gjester')).toBeInTheDocument()
      expect(screen.getByText('Ingen valgt')).toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'Legg til valgte' })).toHaveClass('disabled')

      await user.click(screen.getByRole('checkbox', { name: 'Siri Test' }))
      expect(screen.getByText('1 valgt')).toBeInTheDocument()
      await user.click(screen.getByRole('link', { name: 'Legg til valgte' }))

      expect(screen.getByText('Gjester (4)')).toBeInTheDocument()
      expect(screen.getByText('Alle gjestene er allerede lagt til.')).toBeInTheDocument()
    })

    it('starts empty each time the picker is opened', async () => {
      stubReservations()
      const user = await openGuests()

      await user.click(screen.getByRole('link', { name: 'Legg til gjest' }))
      await user.click(await screen.findByRole('checkbox', { name: 'Siri Test' }))
      await user.type(screen.getByRole('searchbox'), 'sir')
      await user.click(screen.getByRole('link', { name: 'Lukk' }))
      // jsdom has no CSS transitions: finish the closing of the sheet by hand.
      act(() => {
        document.querySelector('.sheet-modal')?.dispatchEvent(new Event('transitionend'))
      })
      await user.click(screen.getByRole('link', { name: 'Legg til gjest' }))

      expect(await screen.findByText('Ingen valgt')).toBeInTheDocument()
      expect(screen.getByRole('searchbox')).toHaveValue('')
    })

    it('adds nothing when the picker is closed with the X', async () => {
      stubReservations()
      const user = await openGuests()

      await user.click(screen.getByRole('link', { name: 'Legg til gjest' }))
      await user.click(await screen.findByRole('checkbox', { name: 'Siri Test' }))
      await user.click(screen.getByRole('link', { name: 'Lukk' }))

      expect(screen.getByText('Gjester (3)')).toBeInTheDocument()
    })

    it('does not add anything when nothing is picked, also when the check is tapped', async () => {
      stubReservations()
      const user = await openGuests()

      await user.click(screen.getByRole('link', { name: 'Legg til gjest' }))
      await user.click(await screen.findByRole('link', { name: 'Legg til valgte' }))

      expect(screen.getByText('Gjester (3)')).toBeInTheDocument()
    })

    it('asks for the avatar only of guests that have one, using the URL from the API', async () => {
      const withAvatar = {
        ...guest('siri', 'Siri', false),
        avatarUrl: '/api/guests/siri/avatar?v=9',
      }
      stubReservations({ guests: [guest('kari', 'Kari', true), withAvatar] })
      const user = await openGuests()

      await user.click(screen.getByRole('link', { name: 'Legg til gjest' }))
      await screen.findByRole('checkbox', { name: 'Siri Test' })

      const avatarCalls = fetchMock.mock.calls
        .map(([url]) => url as string)
        .filter((url) => url.includes('/avatar'))
      expect(avatarCalls).toEqual(['/api/guests/siri/avatar?v=9'])
    })

    it('filters the picker by name', async () => {
      stubReservations({ guests: [...allGuests, guest('anne', 'Anne', false)] })
      const user = await openGuests()

      await user.click(screen.getByRole('link', { name: 'Legg til gjest' }))
      await user.type(await screen.findByRole('searchbox'), 'ann')

      expect(screen.getByRole('checkbox', { name: 'Anne Test' })).toBeInTheDocument()
      expect(screen.queryByRole('checkbox', { name: 'Siri Test' })).not.toBeInTheDocument()

      await user.clear(screen.getByRole('searchbox'))
      await user.type(screen.getByRole('searchbox'), 'zzz')
      expect(screen.getByText('Ingen gjester funnet.')).toBeInTheDocument()
    })

    it('removes a guest from the detail view, but never the last one', async () => {
      stubReservations({ guests: [guest('per', 'Per', false)] })
      const user = await openGuests()

      await user.click(screen.getByText('Per Test'))
      // The class of a list button is on its <li>.
      expect(screen.getByRole('link', { name: 'Fjern fra reservasjon' }).closest('li')).toHaveClass(
        'disabled',
      )
      expect(screen.getByText('En reservasjon må ha minst én gjest.')).toBeInTheDocument()
    })

    it('removes a guest with the delete button in the detail view', async () => {
      stubReservations()
      const user = await openGuests()

      await user.click(screen.getByText('Ola Test'))
      await user.click(screen.getByRole('link', { name: 'Fjern fra reservasjon' }))
      // The popup slides away with its content; the guest is taken out when it has closed.
      expect(screen.getByRole('heading', { name: 'Ola Test' })).toBeInTheDocument()
      expect(screen.getByText('Gjester (3)')).toBeInTheDocument()
      finishGuestPopupClose()

      expect(screen.getByText('Gjester (2)')).toBeInTheDocument()
      expect(screen.queryByText('Ola Test')).not.toBeInTheDocument()
    })

    it('has a disabled check until something changes, also when the switches are only turned on', async () => {
      stubReservations()
      const user = await openGuests()

      await user.click(screen.getByText('Ola Test'))
      const check = screen.getByRole('link', { name: 'Ferdig' })
      expect(check).toHaveAttribute('aria-disabled', 'true')

      // Own dates that equal the reservation's are no change.
      await user.click(screen.getByRole('checkbox', { name: 'Egen ankomst' }))
      await user.click(screen.getByRole('checkbox', { name: 'Egen avreise' }))
      expect(check).toHaveAttribute('aria-disabled', 'true')

      await user.click(ownDatePill())
      await user.click(calendarDay('2026-10-28'))
      expect(check).toHaveAttribute('aria-disabled', 'false')
    })

    it('does not close the guest popup when the disabled check is tapped', async () => {
      stubReservations()
      const user = await openGuests()

      await user.click(screen.getByText('Ola Test'))
      await user.click(screen.getByRole('link', { name: 'Ferdig' }))

      // Closing would start the closing animation of the popup.
      expect(document.querySelector('.popup.modal-out')).toBeNull()
      expect(screen.getByRole('heading', { name: 'Ola Test' })).toBeInTheDocument()
    })

    it('takes a guest out of the note about reset dates when the guest is edited or removed', async () => {
      stubReservations()
      const user = await openGuests()
      // Ola and Kari get their own arrival on the 28th, then the period moves to the weekend after.
      for (const name of ['Ola Test', 'Kari Test']) {
        await user.click(screen.getByText(name))
        await user.click(screen.getByRole('checkbox', { name: 'Egen ankomst' }))
        await user.click(ownDatePill())
        await user.click(calendarDay('2026-10-28'))
        await user.click(screen.getByRole('link', { name: 'Ferdig' }))
        finishGuestPopupClose()
      }
      await user.click(screen.getByRole('link', { name: 'Neste helg' }))
      expect(screen.getByRole('status')).toHaveTextContent('for Kari Test og Ola Test')

      // Editing Ola again: the note is about Kari only. Removing Kari: no note.
      await user.click(screen.getByText('Ola Test'))
      await user.click(screen.getByRole('checkbox', { name: 'Egen avreise' }))
      await user.click(ownDatePill('søn 6. des.'))
      // The calendar writes the day and the month (counted from 0) without a leading zero.
      await user.click(calendarDay('2026-11-5'))
      await user.click(screen.getByRole('link', { name: 'Ferdig' }))
      finishGuestPopupClose()
      expect(screen.getByRole('status')).toHaveTextContent('for Kari Test fordi')
      expect(screen.getByRole('status')).not.toHaveTextContent('Ola Test')

      const row = screen.getByText('Kari Test').closest('li') as HTMLElement
      await user.click(within(row).getByRole('link', { name: 'Fjern gjest' }))
      expect(screen.queryByRole('status')).not.toBeInTheDocument()
    })

    it('stores an own date equal to the reservation as none, so the guest follows the group', async () => {
      stubReservations()
      const user = await openGuests()

      await user.click(screen.getByText('Ola Test'))
      await user.click(screen.getByRole('checkbox', { name: 'Egen ankomst' }))
      await user.click(ownDatePill())
      await user.click(calendarDay('2026-10-28'))
      await user.click(screen.getByRole('link', { name: 'Ferdig' }))
      expect(await screen.findByText('Ankomst lør 28. nov.')).toBeInTheDocument()
      finishGuestPopupClose()

      // Back to the first day of the reservation: that is no own arrival.
      await user.click(screen.getByText('Ola Test'))
      await user.click(ownDatePill('lør 28. nov.'))
      await user.click(calendarDay('2026-10-27'))
      await user.click(screen.getByRole('link', { name: 'Ferdig' }))
      finishGuestPopupClose()

      expect(screen.queryByText('Ankomst lør 28. nov.')).not.toBeInTheDocument()
      await user.click(screen.getByText('Ola Test'))
      expect(screen.getByRole('checkbox', { name: 'Egen ankomst' })).not.toBeChecked()
    })

    it('throws the changes away when the guest popup is closed with the X', async () => {
      stubReservations()
      const user = await openGuests()

      await user.click(screen.getByText('Ola Test'))
      await user.click(screen.getByRole('checkbox', { name: 'Egen ankomst' }))
      await user.click(ownDatePill())
      await user.click(calendarDay('2026-10-28'))
      await user.click(screen.getByRole('link', { name: 'Lukk' }))

      expect(screen.queryByText('Ankomst lør 28. nov.')).not.toBeInTheDocument()
    })

    it('keeps one date row per switch when a switch is turned on and off again and again', async () => {
      stubReservations()
      const user = await openGuests()

      await user.click(screen.getByText('Ola Test'))
      const arrival = screen.getByRole('checkbox', { name: 'Egen ankomst' })
      const list = arrival.closest('.list ul') as HTMLElement
      // With the departure on too, both date rows exist at once (they once shared a React key).
      await user.click(screen.getByRole('checkbox', { name: 'Egen avreise' }))
      for (let turn = 0; turn < 3; turn++) {
        await user.click(arrival)
        await user.click(arrival)
      }
      await user.click(arrival)

      expect(within(list).getAllByText('Ankomst')).toHaveLength(1)
      expect(within(list).getAllByText('Avreise')).toHaveLength(1)
    })

    it('removes a guest with the trash button that a swipe on the row shows', async () => {
      stubReservations()
      const user = await openGuests()

      // The swipe button is an icon (a trash can); the guest popup has its own "Fjern fra reservasjon".
      const row = screen.getByText('Ola Test').closest('li') as HTMLElement
      await user.click(within(row).getByRole('link', { name: 'Fjern gjest' }))

      expect(screen.getByText('Gjester (2)')).toBeInTheDocument()
      expect(screen.queryByText('Ola Test')).not.toBeInTheDocument()
    })

    it('does not remove the last guest, also when the delete button is tapped', async () => {
      stubReservations({ guests: [guest('per', 'Per', false)] })
      const user = await openGuests()

      await user.click(screen.getByText('Per Test'))
      await user.click(screen.getByRole('link', { name: 'Fjern fra reservasjon' }))

      expect(screen.getByText('Gjester (1)')).toBeInTheDocument()
      expect(screen.getByRole('heading', { name: 'Per Test' })).toBeInTheDocument()
    })

    it('shows the guest like a contact card: name, own dates, hint and a done check', async () => {
      stubReservations()
      const user = await openGuests()

      await user.click(screen.getByText('Ola Test'))

      expect(screen.getByRole('heading', { name: 'Ola Test' })).toBeInTheDocument()
      expect(screen.getByText('Egne datoer')).toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'Ferdig' })).toBeInTheDocument()
      // One period at the end: the dates already end with one.
      const hint = screen.getByText(/Uten egne datoer/)
      expect(hint).toHaveTextContent(
        'Uten egne datoer er gjesten med hele oppholdet: fre 27. nov. – søn 29. nov.',
      )
      expect(hint).not.toHaveTextContent('..')
    })

    it('shows the own-date switches inside the list of the guest detail', async () => {
      stubReservations()
      const user = await openGuests()

      await user.click(screen.getByText('Ola Test'))

      const arrival = screen.getByRole('checkbox', { name: 'Egen ankomst' })
      expect(arrival.closest('.list ul')).toBeInTheDocument()
      expect(screen.getByRole('checkbox', { name: 'Egen avreise' }).closest('.list ul')).toBe(
        arrival.closest('.list ul'),
      )
      // The date row that appears when the switch is on is in the same list too.
      await user.click(arrival)
      const list = arrival.closest('.list ul') as HTMLElement
      expect(within(list).getByRole('button', { name: 'fre 27. nov.' })).toBeInTheDocument()
      expect(within(list).getByText('Ankomst')).toBeInTheDocument()
    })

    it('gives a guest own dates inside the stay', async () => {
      stubReservations()
      const user = await openGuests()

      await user.click(screen.getByText('Ola Test'))
      await user.click(screen.getByRole('checkbox', { name: 'Egen ankomst' }))
      await user.click(ownDatePill())
      // 27-29 November; the calendar counts months from 0.
      await user.click(calendarDay('2026-10-28'))
      // The changes are kept with the check ("Ferdig").
      await user.click(screen.getByRole('link', { name: 'Ferdig' }))

      expect(await screen.findByText('Ankomst lør 28. nov.')).toBeInTheDocument()
      await user.click(screen.getByRole('checkbox', { name: 'Egen avreise' }))
      expect(screen.getAllByText('søn 29. nov.').length).toBeGreaterThan(0)
    })

    it('resets own dates that do not fit a new period and says so', async () => {
      stubReservations()
      const user = await openGuests()
      await user.click(screen.getByText('Ola Test'))
      await user.click(screen.getByRole('checkbox', { name: 'Egen ankomst' }))
      await user.click(ownDatePill())
      await user.click(calendarDay('2026-10-28'))
      await user.click(screen.getByRole('link', { name: 'Ferdig' }))
      await screen.findByText('Ankomst lør 28. nov.')

      await user.click(screen.getByRole('link', { name: 'Neste helg' }))

      expect(screen.queryByText('Ankomst lør 28. nov.')).not.toBeInTheDocument()
      expect(screen.getByRole('status')).toHaveTextContent(
        'Egne datoer er fjernet for Ola Test fordi de ikke passer i den nye perioden. Gjesten følger nå hele oppholdet.',
      )

      // A later period change that removes nothing takes the note away.
      await user.click(screen.getByRole('link', { name: 'Kommende helg' }))
      expect(screen.queryByRole('status')).not.toBeInTheDocument()
    })

    it('lets the user close the note about reset dates', async () => {
      stubReservations()
      const user = await openGuests()
      await user.click(screen.getByText('Ola Test'))
      await user.click(screen.getByRole('checkbox', { name: 'Egen ankomst' }))
      await user.click(ownDatePill())
      await user.click(calendarDay('2026-10-28'))
      await user.click(screen.getByRole('link', { name: 'Ferdig' }))
      finishGuestPopupClose()
      await user.click(screen.getByRole('link', { name: 'Neste helg' }))
      expect(screen.getByRole('status')).toBeInTheDocument()

      await user.click(screen.getByRole('link', { name: 'Skjul melding' }))

      expect(screen.queryByRole('status')).not.toBeInTheDocument()
    })

    it('asks before throwing away a changed guest list', async () => {
      stubReservations()
      const user = await openGuests()

      await user.click(screen.getByText('Ola Test'))
      await user.click(screen.getByRole('link', { name: 'Fjern fra reservasjon' }))
      await user.click(screen.getByRole('link', { name: 'Avbryt' }))

      expect(await screen.findByText('Forkast reservasjonen?')).toBeInTheDocument()
    })
  })

  describe('submitting', () => {
    const apiError = (status: number, code: string) =>
      Promise.resolve(Response.json({ code, message: 'English' }, { status }))

    async function submit(user: ReturnType<typeof userEvent.setup>) {
      // The dimmed check is there while loading: wait for the page first.
      await screen.findByText(/^Gjester \(\d+\)$/)
      await user.click(screen.getByRole('link', { name: 'Opprett' }))
    }

    it('sends the period and the guests, then tells the parent and closes', async () => {
      const bodies: unknown[] = []
      stubReservations({
        create: (body) => {
          bodies.push(body)
          return Promise.resolve(Response.json({ id: 'new' }, { status: 201 }))
        },
      })
      const user = userEvent.setup()
      const onClose = vi.fn()
      const onCreated = vi.fn()
      renderPopup(onClose, onCreated)

      await submit(user)

      await waitFor(() => {
        expect(onCreated).toHaveBeenCalledOnce()
      })
      expect(onClose).toHaveBeenCalledOnce()
      expect(bodies).toEqual([
        {
          startTime: '2026-11-27T15:00:00Z',
          endTime: '2026-11-29T12:00:00Z',
          guests: [
            { guestId: 'kari', fromDate: null, toDate: null },
            { guestId: 'ola', fromDate: null, toDate: null },
            { guestId: 'per', fromDate: null, toDate: null },
          ],
        },
      ])
    })

    it('shows a preloader and sends only once while waiting', async () => {
      const create = vi.fn(() => new Promise<Response>(() => undefined))
      stubReservations({ create })
      const user = userEvent.setup()
      renderPopup()

      await submit(user)
      const button = document.querySelector('.preloader')?.closest('a')
      expect(button).toHaveClass('disabled')
      if (button) await user.click(button)

      expect(create).toHaveBeenCalledOnce()
    })

    it('does not cancel while the reservation is being sent', async () => {
      stubReservations({ create: () => new Promise<Response>(() => undefined) })
      const user = userEvent.setup()
      const onClose = renderPopup()

      await submit(user)
      await user.click(screen.getByRole('link', { name: 'Avbryt' }))

      expect(onClose).not.toHaveBeenCalled()
      expect(screen.getByText('Gjester (3)')).toBeInTheDocument()
    })

    it('shows the overlap under the period and keeps the guests', async () => {
      stubReservations({ create: () => apiError(409, 'OVERLAP') })
      const user = userEvent.setup()
      renderPopup()

      await submit(user)

      expect(await screen.findByRole('alert')).toHaveTextContent(
        'Perioden overlapper en annen reservasjon. Velg andre datoer.',
      )
      expect(screen.getByText('Gjester (3)')).toBeInTheDocument()
    })

    it('scrolls the message under the period into view when the server reports a problem', async () => {
      const scrollIntoView = vi.fn()
      // jsdom has no `scrollIntoView`.
      Element.prototype.scrollIntoView = scrollIntoView
      stubReservations({ create: () => apiError(409, 'OVERLAP') })
      const user = userEvent.setup()
      renderPopup()

      await submit(user)

      await vi.waitFor(() => {
        expect(scrollIntoView).toHaveBeenCalled()
      })
      Reflect.deleteProperty(Element.prototype, 'scrollIntoView')
    })

    it('blocks "Opprett" until the period is changed after an overlap', async () => {
      stubReservations({ create: () => apiError(409, 'OVERLAP') })
      const user = userEvent.setup()
      renderPopup()

      await submit(user)

      expect(await screen.findByRole('alert')).toHaveTextContent(
        'Perioden overlapper en annen reservasjon. Velg andre datoer.',
      )
      expect(screen.getByRole('link', { name: 'Opprett' })).toHaveClass('disabled')
      // Changing the period takes the message away.
      await user.click(screen.getByRole('link', { name: 'Neste helg' }))
      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'Opprett' })).not.toHaveClass('disabled')
    })

    it('shows the problem above the button and lets the user try again', async () => {
      stubReservations({ create: () => apiError(400, 'UNKNOWN_GUEST') })
      const user = userEvent.setup()
      renderPopup()

      await submit(user)

      expect(await screen.findByRole('alert')).toHaveTextContent(
        'En av gjestene finnes ikke lenger. Fjern gjesten og prøv igjen.',
      )
      expect(screen.getByText('Gjester (3)')).toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'Opprett' })).not.toHaveClass('disabled')
    })

    it('clears the problem on a retry and closes when it then works', async () => {
      let attempt = 0
      stubReservations({
        create: () =>
          ++attempt === 1
            ? apiError(400, 'UNKNOWN_GUEST')
            : Promise.resolve(new Response(null, { status: 201 })),
      })
      const user = userEvent.setup()
      const onCreated = vi.fn()
      renderPopup(vi.fn(), onCreated)

      await submit(user)
      expect(await screen.findByRole('alert')).toBeInTheDocument()
      await user.click(screen.getByRole('link', { name: 'Opprett' }))

      await waitFor(() => {
        expect(onCreated).toHaveBeenCalledOnce()
      })
      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    })

    it('takes the problem away when the guest list changes', async () => {
      stubReservations({ create: () => apiError(400, 'UNKNOWN_GUEST') })
      const user = userEvent.setup()
      renderPopup()

      await submit(user)
      await screen.findByRole('alert')
      await user.click(screen.getByText('Ola Test'))
      await user.click(screen.getByRole('link', { name: 'Fjern fra reservasjon' }))
      finishGuestPopupClose()

      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    })

    it('lets the user try again after a network failure', async () => {
      stubReservations({ create: () => Promise.reject(new TypeError('Failed to fetch')) })
      const user = userEvent.setup()
      renderPopup()

      await submit(user)
      await screen.findByText(NETWORK_TEXT)

      expect(screen.getByRole('link', { name: 'Opprett' })).not.toHaveClass('disabled')
    })

    it('does not close a popup opened since when an old request ends', async () => {
      let finish: (response: Response) => void = () => undefined
      stubReservations({
        create: () =>
          new Promise<Response>((resolve) => {
            finish = resolve
          }),
      })
      const user = userEvent.setup()
      const onCreated = vi.fn()
      renderWithF7(<Harness onCreated={onCreated} />)
      await user.click(screen.getByRole('button', { name: 'Åpne' }))
      await submit(user)

      // The popup is closed from outside while the request is still running, then opened again.
      act(() => {
        f7.popup.close(flowPopup)
      })
      act(() => {
        document.querySelector(flowPopup)?.dispatchEvent(new Event('transitionend'))
      })
      await user.click(await screen.findByRole('button', { name: 'Åpne' }))
      expect(await screen.findByText('Hurtigvalg')).toBeInTheDocument()
      finish(new Response(null, { status: 201 }))

      await waitFor(() => {
        expect(onCreated).toHaveBeenCalledOnce()
      })
      expect(screen.getByText('Hurtigvalg')).toBeInTheDocument()
    })

    it('shows a toast for a network failure and keeps the draft', async () => {
      stubReservations({ create: () => Promise.reject(new TypeError('Failed to fetch')) })
      const user = userEvent.setup()
      renderPopup()

      await submit(user)

      expect(await screen.findByText(NETWORK_TEXT)).toBeInTheDocument()
      expect(screen.getByText('Gjester (3)')).toBeInTheDocument()
      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    })

    it('says so and closes when the user may not create reservations', async () => {
      stubReservations({ create: () => apiError(403, 'FORBIDDEN') })
      const user = userEvent.setup()
      const onClose = renderPopup()

      await submit(user)
      await user.click(await screen.findByText('OK'))

      expect(onClose).toHaveBeenCalledOnce()
    })

    it('reloads the page for the login when the session has expired', async () => {
      stubReservations({ create: () => Promise.reject(new SessionExpiredError()) })
      const user = userEvent.setup()
      renderPopup()

      await submit(user)

      await waitFor(() => {
        expect(reloadForLogin).toHaveBeenCalled()
      })
      expect(screen.queryByText(NO_ACCESS_TEXT)).not.toBeInTheDocument()
      expect(screen.queryByText(NETWORK_TEXT)).not.toBeInTheDocument()
      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    })
  })

  it('closes at once on "Avbryt" when nothing was changed', async () => {
    stubReservations()
    const user = userEvent.setup()
    const onClose = renderPopup()

    await screen.findByText('2 netter')
    await user.click(screen.getByRole('link', { name: 'Avbryt' }))

    expect(onClose).toHaveBeenCalledOnce()
  })

  it('asks before throwing a changed draft away', async () => {
    stubReservations()
    const user = userEvent.setup()
    const onClose = renderPopup()

    await user.click(await screen.findByRole('link', { name: 'Neste helg' }))
    await user.click(screen.getByRole('link', { name: 'Avbryt' }))
    expect(await screen.findByText('Forkast reservasjonen?')).toBeInTheDocument()
    expect(onClose).not.toHaveBeenCalled()

    await user.click(screen.getByText('Forkast'))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('keeps the draft when the user chooses to continue editing', async () => {
    stubReservations()
    const user = userEvent.setup()
    const onClose = renderPopup()

    await user.click(await screen.findByRole('link', { name: 'Neste helg' }))
    await user.click(screen.getByRole('link', { name: 'Avbryt' }))
    await user.click(await screen.findByText('Fortsett å redigere'))

    expect(onClose).not.toHaveBeenCalled()
    expect(screen.getByRole('link', { name: 'Neste helg' })).toHaveClass('button-active')
  })

  it('starts from the date of the opening, not of the app start', async () => {
    stubReservations()
    const user = userEvent.setup()
    renderWithF7(<Harness />)
    // The app has been open since Monday; the flow is opened on Tuesday 1 December.
    vi.setSystemTime(new Date('2026-12-01T10:00:00Z'))

    await user.click(screen.getByRole('button', { name: 'Åpne' }))

    expect(await screen.findByText('fre 4. des.')).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/reservations?from=2026-12-01&to=2028-12-02',
      expect.anything(),
    )
  })

  it('tells the parent when the popup is closed by something else', async () => {
    stubReservations()
    const onClose = renderPopup()
    await screen.findByText('2 netter')

    act(() => {
      f7.popup.close(flowPopup)
    })
    // jsdom has no CSS transitions: finish the closing animation by hand.
    act(() => {
      document.querySelector(flowPopup)?.dispatchEvent(new Event('transitionend'))
    })

    await waitFor(() => {
      expect(onClose).toHaveBeenCalled()
    })
  })

  it('shows a skeleton of the page and a dimmed check while the data loads', async () => {
    fetchMock.mockImplementation(() => new Promise<Response>(() => undefined))
    vi.stubGlobal('fetch', fetchMock)
    const { container } = renderWithF7(
      <NewReservationPopup opened onCreated={vi.fn()} onClose={vi.fn()} />,
    )

    expect(await screen.findByRole('status')).toHaveTextContent('Laster …')
    // The same structure as the loaded page: quick picks, the period card and the guest list.
    expect(container.querySelectorAll('.flow-skeleton-segmented')).toHaveLength(1)
    expect(container.querySelectorAll('.flow-skeleton-chip')).toHaveLength(6)
    expect(container.querySelectorAll('.flow-skeleton-avatar')).toHaveLength(3)
    expect(screen.getByRole('link', { name: 'Opprett' })).toHaveAttribute('aria-disabled', 'true')
  })

  it('offers a retry when the reservations cannot be loaded', async () => {
    let failing = true
    fetchMock.mockImplementation(() =>
      failing
        ? Promise.reject(new TypeError('Failed to fetch'))
        : Promise.resolve(Response.json([])),
    )
    vi.stubGlobal('fetch', fetchMock)
    const user = userEvent.setup()
    renderPopup()

    expect(await screen.findByText('Kunne ikke hente data til reservasjonen.')).toBeInTheDocument()
    failing = false
    await user.click(screen.getByRole('link', { name: 'Prøv igjen' }))

    expect(await screen.findByText('2 netter')).toBeInTheDocument()
  })

  it('says so and closes when the user may not create reservations', async () => {
    fetchMock.mockImplementation((url: string) =>
      Promise.resolve(
        url === '/api/me'
          ? Response.json({ id: 'per', role: 'GUEST_USER' })
          : Response.json({ code: 'FORBIDDEN', message: 'x' }, { status: 403 }),
      ),
    )
    vi.stubGlobal('fetch', fetchMock)
    const user = userEvent.setup()
    const onClose = renderPopup()

    expect(await screen.findByText('Du har ikke tilgang til appen.')).toBeInTheDocument()
    await user.click(screen.getByText('OK'))

    expect(onClose).toHaveBeenCalledOnce()
  })

  it('reloads the page for the login when the session has expired', async () => {
    fetchMock.mockRejectedValue(new SessionExpiredError())
    vi.stubGlobal('fetch', fetchMock)
    renderPopup()

    await waitFor(() => {
      expect(reloadForLogin).toHaveBeenCalled()
    })
  })
})
