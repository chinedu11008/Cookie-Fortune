import { useCallback, useEffect, useMemo, useState } from 'react'
import { getDemoFortunes, subscribeDemoFortunes } from '../lib/demoData'
import { summarizeFortunes } from '../lib/feed'

/**
 * Mirrors useWallFeed's return shape so <Wall>, <Leaderboard>, and
 * <StatsBar> don't need to know which mode they're rendering.
 */
export function useDemoWall() {
  const [fortunes, setFortunes] = useState(() => getDemoFortunes())

  useEffect(() => subscribeDemoFortunes(setFortunes), [])

  const refresh = useCallback(() => setFortunes(getDemoFortunes()), [])
  const stats = useMemo(() => summarizeFortunes(fortunes), [fortunes])

  return {
    fortunes,
    stats,
    loading: false,
    loadingMore: false,
    error: null,
    hasMore: false,
    loadMore: () => {},
    refresh,
  }
}
