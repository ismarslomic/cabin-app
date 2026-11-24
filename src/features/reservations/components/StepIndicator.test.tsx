import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import StepIndicator from '@/features/reservations/components/StepIndicator.tsx'

describe('StepIndicator', () => {
  it('marks the current step and the steps before it', () => {
    render(<StepIndicator steps={['Periode', 'Gjester']} current={1} />)

    expect(screen.getByRole('list', { name: 'Steg' })).toBeInTheDocument()
    const [first, second] = screen.getAllByRole('listitem')
    expect(first).toHaveClass('step-active')
    expect(first).not.toHaveAttribute('aria-current')
    expect(second).toHaveClass('step-active')
    expect(second).toHaveAttribute('aria-current', 'step')
  })

  it('leaves later steps inactive', () => {
    render(<StepIndicator steps={['Periode', 'Gjester']} current={0} />)

    expect(screen.getAllByRole('listitem')[1]).not.toHaveClass('step-active')
  })
})
