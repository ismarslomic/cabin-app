import { render } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import UpdatePrompt from '@/app/UpdatePrompt.tsx'

const sw = vi.hoisted(() => ({
  offlineReady: false,
  needRefresh: false,
  updateServiceWorker: vi.fn(() => Promise.resolve()),
  setOfflineReady: vi.fn(),
  setNeedRefresh: vi.fn(),
}))
const toast = vi.hoisted(() => ({
  open: vi.fn(),
  create: vi.fn(),
}))

vi.mock('virtual:pwa-register/react', () => ({
  useRegisterSW: () => ({
    offlineReady: [sw.offlineReady, sw.setOfflineReady],
    needRefresh: [sw.needRefresh, sw.setNeedRefresh],
    updateServiceWorker: sw.updateServiceWorker,
  }),
}))
vi.mock('framework7-react', () => ({
  f7ready: (callback: (f7: unknown) => void) => callback({ toast }),
}))

describe('UpdatePrompt', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    sw.offlineReady = false
    sw.needRefresh = false
    toast.create.mockReturnValue({ open: toast.open })
  })

  it('shows nothing when there is nothing to report', () => {
    render(<UpdatePrompt />)

    expect(toast.create).not.toHaveBeenCalled()
  })

  it('tells the user the app works offline', () => {
    sw.offlineReady = true

    render(<UpdatePrompt />)

    expect(toast.create).toHaveBeenCalledWith(
      expect.objectContaining({ text: 'Appen fungerer nå uten nett' }),
    )
    expect(toast.open).toHaveBeenCalled()
  })

  it('offers an update and reloads when the user accepts', () => {
    sw.needRefresh = true

    render(<UpdatePrompt />)

    const options = toast.create.mock.calls[0]?.[0]
    expect(options).toMatchObject({
      text: 'Ny versjon er tilgjengelig',
      closeButtonText: 'Oppdater',
    })

    options.on.closeButtonClick()

    expect(sw.updateServiceWorker).toHaveBeenCalledWith(true)
  })
})
