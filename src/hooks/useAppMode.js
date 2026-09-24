import { useCallback, useState } from 'react'

const STORAGE_KEY = 'cookiefortune:mode:v1'

export function useAppMode() {
  const [mode, setModeState] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === 'demo' ? 'demo' : 'live'
    } catch {
      return 'live'
    }
  })

  const setMode = useCallback((next) => {
    setModeState(next)
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // Mode just won't persist across reloads — not worth failing over.
    }
  }, [])

  return [mode, setMode]
}
