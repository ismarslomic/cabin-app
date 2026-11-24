import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Page } from 'framework7-react'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import PeriodStep from '@/features/reservations/components/PeriodStep.tsx'
import type { DraftPeriod } from '@/features/reservations/lib/draft.ts'
import { periodIssueText } from '@/features/reservations/lib/period-issue.ts'
import { renderWithF7 } from '@/test/render-f7.tsx'

const TODAY = '2026-11-23'

const weekend: DraftPeriod = {
  startDate: '2026-11-27',
  endDate: '2026-11-29',
  arrivalTime: '16:00',
  departureTime: '13:00',
}

// Keeps the period in state like the flow does, and reports every change to the spy.
function Step({ initial, onChange }: StepProps) {
  const [period, setPeriod] = useState(initial)
  return (
    <Page>
      <PeriodStep
        period={period}
        today={TODAY}
        reservations={[]}
        message={periodIssueText(period, TODAY, [])}
        onChange={(next) => {
          setPeriod(next)
          onChange(next)
        }}
      />
    </Page>
  )
}

interface StepProps {
  initial: DraftPeriod
  onChange: (period: DraftPeriod) => void
}

function renderStep(initial: DraftPeriod = weekend) {
  const onChange = vi.fn()
  renderWithF7(<Step initial={initial} onChange={onChange} />)
  return { onChange }
}

describe('PeriodStep', () => {
  it('shows arrival and departure as a day and a time each', async () => {
    renderStep()

    expect(await screen.findByText('Ankomst')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'fre 27. nov.' })).toBeInTheDocument()
    expect(screen.getByLabelText('Ankomst kl.')).toHaveValue('16:00')
    expect(screen.getByText('Avreise')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'søn 29. nov.' })).toBeInTheDocument()
    expect(screen.getByLabelText('Avreise kl.')).toHaveValue('13:00')
    expect(screen.getByText('2 netter')).toBeInTheDocument()
  })

  it('reports a quick pick as a new period, keeping the times', async () => {
    const { onChange } = renderStep({ ...weekend, arrivalTime: '18:30' })

    await userEvent.click(await screen.findByRole('link', { name: 'Neste helg' }))

    expect(onChange).toHaveBeenCalledWith({
      startDate: '2026-12-04',
      endDate: '2026-12-06',
      arrivalTime: '18:30',
      departureTime: '13:00',
    })
  })

  it('reports a new departure time', async () => {
    const { onChange } = renderStep()

    const departure = await screen.findByLabelText('Avreise kl.')
    await userEvent.clear(departure)
    await userEvent.type(departure, '11:15')

    expect(onChange).toHaveBeenLastCalledWith({ ...weekend, departureTime: '11:15' })
  })

  it.each([
    [{ startDate: '2026-11-27', endDate: '2026-11-27' }, 'Sluttdatoen må være etter startdatoen.'],
    [{ startDate: '2026-11-28', endDate: '2026-11-27' }, 'Sluttdatoen må være etter startdatoen.'],
    [
      { startDate: '2026-12-01', endDate: '2027-01-31' },
      'Et opphold kan ikke være lengre enn 60 netter.',
    ],
    [
      { startDate: '2028-11-22', endDate: '2028-11-24' },
      'Du kan ikke reservere mer enn 2 år fram i tid.',
    ],
  ])('shows why the period %o cannot be used', async (dates, text) => {
    renderStep({ ...weekend, ...dates })

    expect(await screen.findByRole('alert')).toHaveTextContent(text)
  })

  it('has no length when the end is not after the start, but keeps it for other problems', async () => {
    renderStep({ ...weekend, endDate: '2026-11-27' })
    await screen.findByRole('alert')
    expect(screen.queryByText('Varighet')).not.toBeInTheDocument()
  })

  it('keeps the length visible while another problem is shown', async () => {
    renderStep({ ...weekend, startDate: '2026-12-01', endDate: '2027-01-31' })

    expect(await screen.findByRole('alert')).toBeInTheDocument()
    expect(screen.getByText('Varighet')).toBeInTheDocument()
  })

  it('writes one night in the singular', async () => {
    renderStep({ ...weekend, endDate: '2026-11-28' })

    expect(await screen.findByText('1 natt')).toBeInTheDocument()
  })
})
