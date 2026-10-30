import { act, render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import AppPage from '@/shared/ui/AppPage.tsx'

const refresh = vi.hoisted(() => ({ refreshApp: vi.fn(() => Promise.resolve()) }))
const page = vi.hoisted(() => ({
  props: undefined as { onPtrRefresh?: (done: () => void) => void } | undefined,
}))

vi.mock('@/shared/lib/app-refresh.ts', () => refresh)
vi.mock('framework7-react', () => ({
  Page: (props: { onPtrRefresh?: (done: () => void) => void }) => {
    page.props = props
    return null
  },
}))

describe('AppPage pull-to-refresh', () => {
  it('checks for an app update, runs the page action and then finishes', async () => {
    const onRefresh = vi.fn(() => Promise.resolve())
    const done = vi.fn()
    render(<AppPage onRefresh={onRefresh} />)

    await act(async () => {
      page.props?.onPtrRefresh?.(done)
      await Promise.resolve()
    })

    expect(refresh.refreshApp).toHaveBeenCalled()
    expect(onRefresh).toHaveBeenCalled()
    expect(done).toHaveBeenCalled()
  })

  it('works without a page action', async () => {
    const done = vi.fn()
    render(<AppPage />)

    await act(async () => {
      page.props?.onPtrRefresh?.(done)
      await Promise.resolve()
    })

    expect(done).toHaveBeenCalled()
  })
})
