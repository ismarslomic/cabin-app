import { act, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { f7 } from 'framework7-react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { reloadForLogin } from '@/shared/lib/http.ts'
import { ApiRequestError } from '@/shared/lib/api-error.ts'
import { SessionExpiredError } from '@/shared/lib/http.ts'
import {
  handleCommonFailure,
  handleLoadFailure,
  NETWORK_TEXT,
  NO_ACCESS_TEXT,
  resetFailureFeedback,
} from '@/shared/ui/failure-feedback.ts'
import { renderWithF7 } from '@/test/render-f7.tsx'

vi.mock('@/shared/lib/http.ts', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/shared/lib/http.ts')>()),
  reloadForLogin: vi.fn(),
}))

// The Framework7 app must be running before `f7.dialog` and `f7.toast` exist.
async function startApp() {
  renderWithF7(<span />)
  await vi.waitFor(() => {
    expect(f7.dialog).toBeDefined()
  })
}

const nextTick = () =>
  act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0))
  })

describe('handleCommonFailure', () => {
  afterEach(() => {
    vi.mocked(reloadForLogin).mockReset()
    resetFailureFeedback()
  })

  it('reloads for the login when the session has expired, without a message', async () => {
    await startApp()

    expect(handleCommonFailure({ kind: 'session' }, { networkToast: true })).toBe(true)

    expect(reloadForLogin).toHaveBeenCalledOnce()
    await nextTick()
    expect(screen.queryByText(NO_ACCESS_TEXT)).not.toBeInTheDocument()
    expect(screen.queryByText(NETWORK_TEXT)).not.toBeInTheDocument()
  })

  it('shows the no-access alert and tells when it is dismissed', async () => {
    await startApp()
    const dismissed = vi.fn()
    const user = userEvent.setup()

    expect(handleCommonFailure({ kind: 'forbidden' }, { onForbiddenDismissed: dismissed })).toBe(
      true,
    )
    expect(await screen.findByText(NO_ACCESS_TEXT)).toBeInTheDocument()
    await user.click(screen.getByText('OK'))

    expect(dismissed).toHaveBeenCalledOnce()
  })

  it('shows a toast for a network failure when asked to', async () => {
    await startApp()

    expect(handleCommonFailure({ kind: 'network' }, { networkToast: true })).toBe(true)

    expect(await screen.findByText(NETWORK_TEXT)).toBeInTheDocument()
  })

  it('leaves a network failure to the caller by default', () => {
    expect(handleCommonFailure({ kind: 'network' })).toBe(false)
  })

  it('leaves an API error to the caller', () => {
    expect(handleCommonFailure({ kind: 'api', status: 409, code: 'OVERLAP' })).toBe(false)
    expect(reloadForLogin).not.toHaveBeenCalled()
  })

  it('shows one no-access alert for several failures and tells every caller', async () => {
    await startApp()
    const first = vi.fn()
    const second = vi.fn()
    const user = userEvent.setup()

    handleCommonFailure({ kind: 'forbidden' }, { onForbiddenDismissed: first })
    handleCommonFailure({ kind: 'forbidden' }, { onForbiddenDismissed: second })

    expect(await screen.findAllByText(NO_ACCESS_TEXT)).toHaveLength(1)
    await user.click(screen.getByText('OK'))
    expect(first).toHaveBeenCalledOnce()
    expect(second).toHaveBeenCalledOnce()
  })
})

describe('handleLoadFailure', () => {
  afterEach(() => {
    vi.mocked(reloadForLogin).mockReset()
    resetFailureFeedback()
  })

  it('keeps loading while the page reloads for the login', () => {
    expect(handleLoadFailure(new SessionExpiredError())).toBe('loading')
    expect(reloadForLogin).toHaveBeenCalledOnce()
  })

  it('shows an error after the no-access alert, so the user can retry', async () => {
    await startApp()

    expect(handleLoadFailure(new ApiRequestError(403))).toBe('error')
    expect(await screen.findByText(NO_ACCESS_TEXT)).toBeInTheDocument()
  })

  it.each([new TypeError('Failed to fetch'), new ApiRequestError(500)])(
    'shows an error for %s, without a toast',
    async (error) => {
      await startApp()

      expect(handleLoadFailure(error)).toBe('error')

      await nextTick()
      expect(screen.queryByText(NETWORK_TEXT)).not.toBeInTheDocument()
    },
  )
})
