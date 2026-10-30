import { act, render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import UpdatePrompt from '@/app/UpdatePrompt.tsx'
import { checkForUpdate, signInAgain, UPDATE_CHECK_INTERVAL_MS } from '@/app/update-check.ts'

const sw = vi.hoisted(() => ({
  offlineReady: false,
  needRefresh: false,
  updateServiceWorker: vi.fn(() => Promise.resolve()),
  setOfflineReady: vi.fn(),
  setNeedRefresh: vi.fn(),
  options: undefined as
    | { onRegisteredSW?: (swUrl: string, worker: ServiceWorkerRegistration) => void }
    | undefined,
}))
const toast = vi.hoisted(() => ({
  open: vi.fn(),
  create: vi.fn(),
}))

vi.mock('virtual:pwa-register/react', () => ({
  useRegisterSW: (options: typeof sw.options) => {
    sw.options = options
    return {
      offlineReady: [sw.offlineReady, sw.setOfflineReady],
      needRefresh: [sw.needRefresh, sw.setNeedRefresh],
      updateServiceWorker: sw.updateServiceWorker,
    }
  },
}))
vi.mock('@/app/update-check.ts', () => ({
  UPDATE_CHECK_INTERVAL_MS: 600_000,
  checkForUpdate: vi.fn(),
  signInAgain: vi.fn(() => Promise.resolve()),
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
    vi.mocked(checkForUpdate).mockResolvedValue('checked')
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

  describe('update checks', () => {
    const worker = {} as ServiceWorkerRegistration

    const register = () => {
      render(<UpdatePrompt />)
      act(() => {
        sw.options?.onRegisteredSW?.('/sw.js', worker)
      })
    }

    afterEach(() => {
      vi.useRealTimers()
    })

    it('checks every 10 minutes', () => {
      vi.useFakeTimers()
      register()

      vi.advanceTimersByTime(UPDATE_CHECK_INTERVAL_MS - 1)
      expect(checkForUpdate).not.toHaveBeenCalled()

      vi.advanceTimersByTime(1)
      expect(checkForUpdate).toHaveBeenCalledWith('/sw.js', worker)
    })

    it('checks when the app returns to the foreground', () => {
      register()

      document.dispatchEvent(new Event('visibilitychange'))

      expect(checkForUpdate).toHaveBeenCalledWith('/sw.js', worker)
    })

    it('offers to sign in again when the session has expired', async () => {
      vi.mocked(checkForUpdate).mockResolvedValue('session-expired')
      register()

      await act(async () => {
        document.dispatchEvent(new Event('visibilitychange'))
        await Promise.resolve()
      })

      const options = toast.create.mock.calls[0]?.[0]
      expect(options).toMatchObject({ text: 'Økten din er utløpt', closeButtonText: 'Logg inn' })

      options.on.closeButtonClick()

      expect(signInAgain).toHaveBeenCalled()
    })
  })
})
