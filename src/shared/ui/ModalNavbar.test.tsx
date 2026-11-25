import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Page } from 'framework7-react'
import { describe, expect, it, vi } from 'vitest'
import ModalNavbar, { type ModalConfirm } from '@/shared/ui/ModalNavbar.tsx'
import { renderWithF7 } from '@/test/render-f7.tsx'

function renderNavbar(props: {
  leading?: 'close' | 'back'
  onClose?: () => void
  closeDisabled?: boolean
  confirm?: ModalConfirm
  title?: string
}) {
  renderWithF7(
    <Page>
      <ModalNavbar closeLabel="Lukk" {...props} />
    </Page>,
  )
}

describe('ModalNavbar', () => {
  it('has a title, a close X and a check, named for tests and screen readers', async () => {
    renderNavbar({ title: 'Ny', confirm: { label: 'Opprett' } })

    expect(await screen.findByText('Ny')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Lukk' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Opprett' })).toBeInTheDocument()
  })

  it('has no check when there is nothing to confirm', async () => {
    renderNavbar({})

    await screen.findByRole('link', { name: 'Lukk' })
    expect(screen.queryByRole('link', { name: 'Opprett' })).not.toBeInTheDocument()
  })

  it('has a close X by default', async () => {
    renderNavbar({ onClose: vi.fn() })

    await screen.findByRole('link', { name: 'Lukk' })
    expect(document.body.querySelector('.lucide-x')).toBeInTheDocument()
    expect(document.body.querySelector('.navbar .link.back')).toBeNull()
  })

  // Framework7's back link is an icon without a text, so it is found by its class.
  it("uses Framework7's own back link for a pushed page, and no X", async () => {
    renderNavbar({ leading: 'back', confirm: { label: 'Lagre' } })

    await screen.findByRole('link', { name: 'Lagre' })
    expect(document.body.querySelector('.navbar .link.back .icon-back')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Lukk' })).not.toBeInTheDocument()
    expect(document.body.querySelector('.lucide-x')).toBeNull()
  })

  it('calls onClose from the X, which does not close a popup by itself then', async () => {
    const onClose = vi.fn()
    renderNavbar({ onClose })

    const close = await screen.findByRole('link', { name: 'Lukk' })
    await userEvent.click(close)

    expect(onClose).toHaveBeenCalledOnce()
    expect(close).not.toHaveClass('popup-close')
  })

  it('lets the X close the popup it is in when there is no onClose', async () => {
    renderNavbar({})

    expect(await screen.findByRole('link', { name: 'Lukk' })).toHaveClass('popup-close')
  })

  it('does not let the X act while closing is disabled', async () => {
    const onClose = vi.fn()
    renderNavbar({ onClose, closeDisabled: true })

    const close = await screen.findByRole('link', { name: 'Lukk' })
    await userEvent.click(close)

    expect(close).toHaveClass('disabled')
    expect(onClose).not.toHaveBeenCalled()
  })

  it('does not close the popup with the X while closing is disabled and nothing handles it', async () => {
    renderNavbar({ closeDisabled: true })

    const close = await screen.findByRole('link', { name: 'Lukk' })

    expect(close).toHaveClass('disabled')
    expect(close).not.toHaveClass('popup-close')
  })

  it('has no title element when there is no title', async () => {
    renderNavbar({ confirm: { label: 'Opprett' } })

    await screen.findByRole('link', { name: 'Lukk' })
    expect(document.body.querySelector('.title')).toBeNull()
  })

  it('calls the confirm when it can be used', async () => {
    const onClick = vi.fn()
    renderNavbar({ confirm: { label: 'Opprett', onClick } })

    const check = await screen.findByRole('link', { name: 'Opprett' })
    await userEvent.click(check)

    expect(onClick).toHaveBeenCalledOnce()
    expect(check).toHaveAttribute('aria-disabled', 'false')
    expect(check).not.toHaveClass('disabled')
  })

  it('does nothing when the confirm is disabled, and does not close the popup', async () => {
    const onClick = vi.fn()
    renderNavbar({ confirm: { label: 'Opprett', disabled: true, closesPopup: true, onClick } })

    const check = await screen.findByRole('link', { name: 'Opprett' })
    await userEvent.click(check)

    expect(check).toHaveAttribute('aria-disabled', 'true')
    expect(check).toHaveClass('disabled')
    expect(check).not.toHaveClass('popup-close')
    expect(onClick).not.toHaveBeenCalled()
  })

  it('closes the popup with the check when it says so and can be used', async () => {
    renderNavbar({ confirm: { label: 'Ferdig', closesPopup: true } })

    expect(await screen.findByRole('link', { name: 'Ferdig' })).toHaveClass('popup-close')
  })

  it('shows a preloader and ignores taps while busy, keeping its name', async () => {
    const onClick = vi.fn()
    renderNavbar({ confirm: { label: 'Opprett', busy: true, onClick } })

    const check = await screen.findByRole('link', { name: 'Opprett' })
    await userEvent.click(check)

    expect(document.body.querySelector('.preloader')).toBeInTheDocument()
    expect(check).toHaveAttribute('aria-busy', 'true')
    expect(check).toHaveAttribute('aria-disabled', 'true')
    expect(onClick).not.toHaveBeenCalled()
  })
})
