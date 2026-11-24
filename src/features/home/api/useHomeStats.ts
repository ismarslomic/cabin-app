import { useCallback, useEffect, useState } from 'react'
import { fetchCurrentYearStats, fetchLiveStats } from '@/features/home/api/stats-api.ts'
import type { CurrentYearStats, LiveStats } from '@/features/home/api/stats-api.ts'
import { handleLoadFailure } from '@/shared/ui/failure-feedback.ts'

export type HomeStatsState =
  | { status: 'loading' }
  | { status: 'ready'; live: LiveStats; year: CurrentYearStats }
  | { status: 'error' }

async function load(): Promise<HomeStatsState> {
  try {
    const [live, year] = await Promise.all([fetchLiveStats(), fetchCurrentYearStats()])
    return { status: 'ready', live, year }
  } catch (error: unknown) {
    // A session or access problem is also handled for the whole app.
    return { status: handleLoadFailure(error) }
  }
}

/** Loads the Home page data. `reload` fetches again without showing the loading state. */
export function useHomeStats(): { state: HomeStatsState; reload: () => Promise<void> } {
  const [state, setState] = useState<HomeStatsState>({ status: 'loading' })

  const reload = useCallback(async () => {
    setState(await load())
  }, [])

  useEffect(() => {
    let active = true
    void load().then((next) => {
      if (active) setState(next)
    })
    return () => {
      active = false
    }
  }, [])

  return { state, reload }
}
