import { describe, expect, it, vi } from 'vitest'
import { refreshApp, registerAppRefresh } from '@/shared/lib/app-refresh.ts'

describe('refreshApp', () => {
  it('does nothing when no handler is registered', async () => {
    await expect(refreshApp()).resolves.toBeUndefined()
  })

  it('runs the registered handler until it is unregistered', async () => {
    const handler = vi.fn(() => Promise.resolve())
    const unregister = registerAppRefresh(handler)

    await refreshApp()
    expect(handler).toHaveBeenCalledTimes(1)

    unregister()
    await refreshApp()
    expect(handler).toHaveBeenCalledTimes(1)
  })
})
