import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import ModalHeader from '@/shared/ui/ModalHeader.tsx'
import { renderWithF7 } from '@/test/render-f7.tsx'

describe('ModalHeader', () => {
  it('shows the title and the subtitle, with a named close X and check', async () => {
    renderWithF7(
      <ModalHeader
        title="Velg gjester"
        subtitle="2 valgt"
        closeLabel="Lukk"
        onClose={vi.fn()}
        confirm={{ label: 'Legg til' }}
      />,
    )

    expect(await screen.findByText('Velg gjester')).toBeInTheDocument()
    expect(screen.getByText('2 valgt')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Lukk' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Legg til' })).toBeInTheDocument()
  })

  it('calls onClose from the X and the confirm from the check', async () => {
    const onClose = vi.fn()
    const onClick = vi.fn()
    renderWithF7(
      <ModalHeader
        title="T"
        closeLabel="Lukk"
        onClose={onClose}
        confirm={{ label: 'OK', onClick }}
      />,
    )

    await userEvent.click(await screen.findByRole('link', { name: 'Lukk' }))
    await userEvent.click(screen.getByRole('link', { name: 'OK' }))

    expect(onClose).toHaveBeenCalledOnce()
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('does nothing when the confirm is disabled', async () => {
    const onClick = vi.fn()
    renderWithF7(
      <ModalHeader
        title="T"
        closeLabel="Lukk"
        onClose={vi.fn()}
        confirm={{ label: 'OK', disabled: true, onClick }}
      />,
    )

    const check = await screen.findByRole('link', { name: 'OK' })
    await userEvent.click(check)

    expect(check).toHaveClass('disabled')
    expect(check).toHaveAttribute('aria-disabled', 'true')
    expect(onClick).not.toHaveBeenCalled()
  })

  it('has no subtitle line when there is none, and a close X that can be used', async () => {
    const onClose = vi.fn()
    renderWithF7(
      <ModalHeader title="Velg" closeLabel="Lukk" onClose={onClose} confirm={{ label: 'OK' }} />,
    )

    const close = await screen.findByRole('link', { name: 'Lukk' })

    expect(close).not.toHaveClass('disabled')
    expect(document.body.querySelector('.modal-header-title span')).toBeNull()
  })
})
