import { useCallback, useEffect, useState } from 'react'
import { fetchCurrentYearStats, fetchLiveStats } from '@/features/home/api/stats-api.ts'
import type { CurrentYearStats, LiveStats } from '@/features/home/api/stats-api.ts'
import { SessionExpiredError } from '@/shared/lib/http.ts'

export type HomeStatsState =
  | { status: 'loading' }
  | { status: 'ready'; live: LiveStats; year: CurrentYearStats }
  | { status: 'expired' | 'error' }

async function load(): Promise<HomeStatsState> {
  try {
    const [live, year] = await Promise.all([fetchLiveStats(), fetchCurrentYearStats()])
    return { status: 'ready', live, year }
  } catch (error: unknown) {
    return { status: error instanceof SessionExpiredError ? 'expired' : 'error' }
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
