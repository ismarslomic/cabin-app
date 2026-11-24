import { act, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { f7 } from 'framework7-react'
import { useState } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { reloadForLogin, SessionExpiredError } from '@/shared/lib/http.ts'
import NewReservationPopup from '@/features/reservations/components/NewReservationPopup.tsx'
import { renderWithF7 } from '@/test/render-f7.tsx'

vi.mock('@/shared/lib/http.ts', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/shared/lib/http.ts')>()),
  reloadForLogin: vi.fn(),
}))

const fetchMock = vi.fn()

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

function stubReservations(reservations: unknown[] = []) {
  fetchMock.mockImplementation(() => Promise.resolve(Response.json(reservations)))
  vi.stubGlobal('fetch', fetchMock)
}

function renderPopup(onClose = vi.fn()) {
  renderWithF7(<NewReservationPopup opened onClose={onClose} />)
  return onClose
}

// A parent that opens the popup, as Home will.
function Harness() {
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
    expect(fetchMock.mock.calls[0]?.[0]).toBe('/api/reservations?from=2026-11-23&to=2028-11-24')
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
    stubReservations([reservation('2026-12-10', '2026-12-14')])
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
    stubReservations([reservation('2026-11-26', '2026-11-30')])
    renderPopup()

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Perioden overlapper en annen reservasjon. Velg andre datoer.',
    )
    expect(screen.getByRole('link', { name: 'Neste' })).toHaveClass('disabled')
  })

  it('allows a same-day handover', async () => {
    stubReservations([reservation('2026-11-25', '2026-11-27')])
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
    expect(screen.getByText('Gjester', { selector: '.block-title' })).toBeInTheDocument()

    await user.click(screen.getByRole('link', { name: 'Tilbake' }))
    expect(screen.getByRole('link', { name: 'Kommende helg' })).toBeInTheDocument()
  })

  it('closes at once on "Avbryt" when nothing was changed', async () => {
    stubReservations()
    const user = userEvent.setup()
    const onClose = renderPopup()

    await user.click(await screen.findByRole('link', { name: 'Avbryt' }))

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
    expect(fetchMock.mock.calls[0]?.[0]).toBe('/api/reservations?from=2026-12-01&to=2028-12-02')
  })

  it('tells the parent when the popup is closed by something else', async () => {
    stubReservations()
    const onClose = renderPopup()
    await screen.findByText('2 netter')

    act(() => {
      f7.popup.close('.popup')
    })
    // jsdom has no CSS transitions: finish the closing animation by hand.
    act(() => {
      document.querySelector('.popup')?.dispatchEvent(new Event('transitionend'))
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

    expect(await screen.findByText('Kunne ikke hente reservasjonene.')).toBeInTheDocument()
    failing = false
    await user.click(screen.getByRole('link', { name: 'Prøv igjen' }))

    expect(await screen.findByText('2 netter')).toBeInTheDocument()
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
