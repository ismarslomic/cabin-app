import { act, screen, waitFor } from '@testing-library/react'
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

    await user.click(await screen.findByText('Start'))

    expect(document.querySelector('.calendar-sheet')).toBeInTheDocument()
  })

  it('sets the period from two taps in the calendar', async () => {
    stubReservations()
    const user = userEvent.setup()
    renderPopup()

    await user.click(await screen.findByText('Start'))
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

    await user.click(await screen.findByText('Start'))
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

    await user.click(await screen.findByText('Start'))
    await user.click(calendarDay('2026-10-12'))
    await user.click(calendarDay('2026-10-12'))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Sluttdatoen må være etter startdatoen.',
    )
    expect(screen.getByRole('link', { name: 'Neste' })).toHaveClass('disabled')
  })

  it('disables fully booked days in the calendar, but not the handover days', async () => {
    stubReservations({ reservations: [reservation('2026-12-10', '2026-12-14')] })
    const user = userEvent.setup()
    renderPopup()

    await user.click(await screen.findByRole('link', { name: 'Neste helg' }))
    await user.click(screen.getByText('Start'))

    expect(calendarDay('2026-11-11')).toHaveClass('calendar-day-disabled')
    expect(calendarDay('2026-11-13')).toHaveClass('calendar-day-disabled')
    expect(calendarDay('2026-11-10')).not.toHaveClass('calendar-day-disabled')
    expect(calendarDay('2026-11-14')).not.toHaveClass('calendar-day-disabled')
  })

  it('warns when the period overlaps a reservation and blocks "Neste"', async () => {
    stubReservations({ reservations: [reservation('2026-11-26', '2026-11-30')] })
    renderPopup()

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Perioden overlapper en annen reservasjon. Velg andre datoer.',
    )
    expect(screen.getByRole('link', { name: 'Neste' })).toHaveClass('disabled')
  })

  it('allows a same-day handover', async () => {
    stubReservations({ reservations: [reservation('2026-11-25', '2026-11-27')] })
    renderPopup()

    await screen.findByText('2 netter')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Neste' })).not.toHaveClass('disabled')
  })

  it('rejects a time before 02:00 and blocks "Neste"', async () => {
    stubReservations()
    const user = userEvent.setup()
    renderPopup()

    const arrival = await screen.findByLabelText('Ankomst kl.')
    await user.clear(arrival)
    await user.type(arrival, '01:30')

    expect(screen.getByText('Velg et tidspunkt mellom 02:00 og 23:59.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Neste' })).toHaveClass('disabled')
  })

  it('goes to the guests step and back', async () => {
    stubReservations()
    const user = userEvent.setup()
    renderPopup()

    await user.click(await screen.findByRole('link', { name: 'Neste' }))
    expect(screen.getByText('Gjester (3)')).toBeInTheDocument()

    await user.click(screen.getByRole('link', { name: 'Tilbake' }))
    expect(screen.getByRole('link', { name: 'Kommende helg' })).toBeInTheDocument()
  })

  describe('guests step', () => {
    async function openGuests() {
      const user = userEvent.setup()
      renderPopup()
      await user.click(await screen.findByRole('link', { name: 'Neste' }))
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

    it('adds guests from the picker, grouped, and adds nothing on "Avbryt"', async () => {
      stubReservations()
      const user = await openGuests()

      await user.click(screen.getByText('Legg til gjest'))
      expect(await screen.findByText('Andre')).toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'Legg til valgte (0)' })).toHaveClass('disabled')

      await user.click(screen.getByRole('checkbox', { name: 'Siri Test' }))
      await user.click(screen.getByRole('link', { name: 'Legg til valgte (1)' }))

      expect(screen.getByText('Gjester (4)')).toBeInTheDocument()
      expect(screen.getByText('Alle gjestene er allerede lagt til.')).toBeInTheDocument()
    })

    it('filters the picker by name', async () => {
      stubReservations({ guests: [...allGuests, guest('anne', 'Anne', false)] })
      const user = await openGuests()

      await user.click(screen.getByText('Legg til gjest'))
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
      expect(screen.getByRole('link', { name: 'Slett gjest fra reservasjon' })).toHaveClass(
        'disabled',
      )
      expect(screen.getByText('En reservasjon må ha minst én gjest.')).toBeInTheDocument()
    })

    it('removes a guest with the delete button in the detail view', async () => {
      stubReservations()
      const user = await openGuests()

      await user.click(screen.getByText('Ola Test'))
      await user.click(screen.getByRole('link', { name: 'Slett gjest fra reservasjon' }))

      expect(screen.getByText('Gjester (2)')).toBeInTheDocument()
      expect(screen.queryByText('Ola Test')).not.toBeInTheDocument()
    })

    it('gives a guest own dates inside the stay', async () => {
      stubReservations()
      const user = await openGuests()

      await user.click(screen.getByText('Ola Test'))
      await user.click(screen.getByRole('checkbox', { name: 'Egen ankomst' }))
      await user.click(screen.getByText('Ankomstdato'))
      // 27-29 November; the calendar counts months from 0.
      await user.click(calendarDay('2026-10-28'))

      expect(await screen.findByText('Ankomst lør 28. nov.')).toBeInTheDocument()
      await user.click(screen.getByRole('checkbox', { name: 'Egen avreise' }))
      expect(screen.getAllByText('søn 29. nov.').length).toBeGreaterThan(0)
    })

    it('resets own dates that do not fit a new period and says so', async () => {
      stubReservations()
      const user = await openGuests()
      await user.click(screen.getByText('Ola Test'))
      await user.click(screen.getByRole('checkbox', { name: 'Egen ankomst' }))
      await user.click(screen.getByText('Ankomstdato'))
      await user.click(calendarDay('2026-10-28'))
      await screen.findByText('Ankomst lør 28. nov.')

      await user.click(screen.getByRole('link', { name: 'Tilbake' }))
      await user.click(screen.getByRole('link', { name: 'Neste helg' }))
      await user.click(screen.getByRole('link', { name: 'Neste' }))

      expect(screen.queryByText('Ankomst lør 28. nov.')).not.toBeInTheDocument()
      expect(screen.getByRole('status')).toHaveTextContent('Egne datoer ble nullstilt')
    })

    it('asks before throwing away a changed guest list', async () => {
      stubReservations()
      const user = await openGuests()

      await user.click(screen.getByText('Ola Test'))
      await user.click(screen.getByRole('link', { name: 'Slett gjest fra reservasjon' }))
      await user.click(screen.getByRole('link', { name: 'Avbryt' }))

      expect(await screen.findByText('Forkast reservasjonen?')).toBeInTheDocument()
    })
  })

  describe('submitting', () => {
    const apiError = (status: number, code: string) =>
      Promise.resolve(Response.json({ code, message: 'English' }, { status }))

    async function submit(user: ReturnType<typeof userEvent.setup>) {
      await user.click(await screen.findByRole('link', { name: 'Neste' }))
      await user.click(screen.getByRole('link', { name: 'Opprett reservasjon' }))
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

    it('does not cancel or go back while the reservation is being sent', async () => {
      stubReservations({ create: () => new Promise<Response>(() => undefined) })
      const user = userEvent.setup()
      const onClose = renderPopup()

      await submit(user)
      await user.click(screen.getByRole('link', { name: 'Avbryt' }))
      await user.click(screen.getByRole('link', { name: 'Tilbake' }))

      expect(onClose).not.toHaveBeenCalled()
      expect(screen.getByText('Gjester (3)')).toBeInTheDocument()
    })

    it('goes back to the period step when the period overlaps another reservation', async () => {
      stubReservations({ create: () => apiError(409, 'OVERLAP') })
      const user = userEvent.setup()
      renderPopup()

      await submit(user)

      expect(await screen.findByRole('alert')).toHaveTextContent(
        'Perioden overlapper en annen reservasjon. Velg andre datoer.',
      )
      expect(screen.getByRole('link', { name: 'Neste' })).toHaveClass('disabled')
      // Changing the period takes the message away.
      await user.click(screen.getByRole('link', { name: 'Neste helg' }))
      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'Neste' })).not.toHaveClass('disabled')
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
      expect(screen.getByRole('link', { name: 'Opprett reservasjon' })).not.toHaveClass('disabled')
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
      await user.click(screen.getByRole('link', { name: 'Opprett reservasjon' }))

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
      await user.click(screen.getByRole('link', { name: 'Slett gjest fra reservasjon' }))

      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    })

    it('lets the user try again after a network failure', async () => {
      stubReservations({ create: () => Promise.reject(new TypeError('Failed to fetch')) })
      const user = userEvent.setup()
      renderPopup()

      await submit(user)
      await screen.findByText(NETWORK_TEXT)

      expect(screen.getByRole('link', { name: 'Opprett reservasjon' })).not.toHaveClass('disabled')
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

    await user.click(screen.getByText('Forkast reservasjonen'))
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
