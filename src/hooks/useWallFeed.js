import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useConnection } from '@solana/wallet-adapter-react'
import { fetchFortunePage, summarizeFortunes } from '../lib/feed'

const POLL_INTERVAL_MS = 20000

export function useWallFeed() {
  const { connection } = useConnection()
  const [fortunes, setFortunes] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState(null)
  const [hasMore, setHasMore] = useState(true)
  const cursorRef = useRef(null)
  const knownSignatures = useRef(new Set())

  const loadInitial = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { fortunes: page, oldestSignature, hasMore: more } = await fetchFortunePage(connection)
      knownSignatures.current = new Set(page.map((f) => f.signature))
      setFortunes(page)
      cursorRef.current = oldestSignature
      setHasMore(more)
    } catch (err) {
      setError(err?.message || 'Could not load the wall from Cookie Chain.')
    } finally {
      setLoading(false)
    }
  }, [connection])

  const loadMore = useCallback(async () => {
    if (!hasMore || loadingMore) return
    setLoadingMore(true)
    try {
      const { fortunes: page, oldestSignature, hasMore: more } = await fetchFortunePage(connection, {
        before: cursorRef.current,
      })
      setFortunes((prev) => {
        const merged = [...prev]
        for (const f of page) {
          if (!knownSignatures.current.has(f.signature)) {
            knownSignatures.current.add(f.signature)
            merged.push(f)
          }
        }
        return merged
      })
      cursorRef.current = oldestSignature
      setHasMore(more)
    } catch (err) {
      setError(err?.message || 'Could not load more fortunes.')
    } finally {
      setLoadingMore(false)
    }
  }, [connection, hasMore, loadingMore])

  const refresh = useCallback(async () => {
    try {
      const { fortunes: page } = await fetchFortunePage(connection)
      setFortunes((prev) => {
        const seen = new Set(page.map((f) => f.signature))
        const merged = [...page]
        for (const f of prev) {
          if (!seen.has(f.signature)) merged.push(f)
        }
        merged.forEach((f) => knownSignatures.current.add(f.signature))
        return merged
      })
    } catch {
      // A background refresh failing quietly is fine — the reader
      // already has a wall full of fortunes on screen.
    }
  }, [connection])

  useEffect(() => {
    loadInitial()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connection])

  useEffect(() => {
    const id = setInterval(refresh, POLL_INTERVAL_MS)
    return () => clearInterval(id)
  }, [refresh])

  const stats = useMemo(() => summarizeFortunes(fortunes), [fortunes])

  return { fortunes, stats, loading, loadingMore, error, hasMore, loadMore, refresh }
}
