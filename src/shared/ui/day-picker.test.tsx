import { f7 } from 'framework7-react'
import { describe, expect, it, vi } from 'vitest'
import { openDayPicker } from '@/shared/ui/day-picker.ts'
import { renderWithF7 } from '@/test/render-f7.tsx'

describe('openDayPicker', () => {
  it('opens a one-day calendar limited to min and max, and reports the picked day', async () => {
    // The Framework7 app must be running before `f7.calendar` exists.
    renderWithF7(<span />)
    await vi.waitFor(() => {
      expect(f7.calendar).toBeDefined()
    })
    const destroy = vi.fn()
    const open = vi.fn()
    const create = vi.spyOn(f7.calendar, 'create').mockReturnValue({ open } as never)
    const onPick = vi.fn()

    openDayPicker({ value: '2026-11-28', min: '2026-11-27', max: '2026-11-29', onPick })

    const params = create.mock.calls[0]?.[0]
    expect(open).toHaveBeenCalledOnce()
    expect(params?.minDate).toEqual(new Date(2026, 10, 27))
    expect(params?.maxDate).toEqual(new Date(2026, 10, 29))
    params?.on?.change?.({} as never, [new Date(2026, 10, 29)])
    expect(onPick).toHaveBeenCalledWith('2026-11-29')
    params?.on?.closed?.({ destroy } as never)
    expect(destroy).toHaveBeenCalledOnce()
    create.mockRestore()
  })
})
