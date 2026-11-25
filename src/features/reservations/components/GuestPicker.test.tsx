import { act } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import GuestPicker from '@/features/reservations/components/GuestPicker.tsx'
import { renderWithF7 } from '@/test/render-f7.tsx'

describe('GuestPicker', () => {
  // React's StrictMode mounts the sheet twice in development. With `swipeToClose`, Framework7 then
  // leaves a touch handler on a destroyed sheet, which throws on the first touch (for example in
  // the search field). The sheet is closed with the "X", not with a swipe.
  it('can be touched without errors, also when mounted twice (StrictMode)', async () => {
    const errors: unknown[] = []
    const onError = (event: ErrorEvent) => {
      errors.push(event.error)
      event.preventDefault()
    }
    window.addEventListener('error', onError)
    renderWithF7(<GuestPicker opened available={[]} room={5} onAdd={vi.fn()} onClose={vi.fn()} />)
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50))
    })

    const sheet = document.querySelector('.sheet-modal') as HTMLElement
    for (const type of ['touchstart', 'mousedown']) {
      act(() => {
        sheet.dispatchEvent(new Event(type, { bubbles: true }))
      })
    }

    window.removeEventListener('error', onError)
    expect(errors).toEqual([])
  })
})
