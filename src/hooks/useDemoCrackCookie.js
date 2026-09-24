import { useCallback, useState } from 'react'
import { CRACK_STATUS } from './useCrackCookie'
import { addDemoFortune, getDemoIdentity } from '../lib/demoData'

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Same status lifecycle and return shape as useCrackCookie, so
 * <CrackCookie> can swap between the two based on mode without any
 * special-casing beyond which hook it reads from. `explorerUrl` is
 * always null here — a demo signature never exists on a real explorer.
 */
export function useDemoCrackCookie() {
  const [status, setStatus] = useState(CRACK_STATUS.IDLE)
  const [error, setError] = useState(null)
  const [signature, setSignature] = useState(null)

  const crackCookie = useCallback(async ({ message, replyTo, sprinkleLamports, sprinkleRecipient }) => {
    setError(null)
    setSignature(null)

    try {
      setStatus(CRACK_STATUS.BUILDING)
      await wait(350)

      setStatus(CRACK_STATUS.AWAITING_APPROVAL)
      await wait(650)

      setStatus(CRACK_STATUS.CONFIRMING)
      const fortune = addDemoFortune({
        author: getDemoIdentity(),
        message,
        replyTo,
        sprinkleLamports,
        sprinkleRecipient,
      })
      await wait(450)

      setSignature(fortune.signature)
      setStatus(CRACK_STATUS.CONFIRMED)
      return fortune.signature
    } catch (err) {
      setStatus(CRACK_STATUS.ERROR)
      setError(err?.message || 'Something went wrong in demo mode.')
      return null
    }
  }, [])

  const reset = useCallback(() => {
    setStatus(CRACK_STATUS.IDLE)
    setError(null)
    setSignature(null)
  }, [])

  return { status, error, signature, explorerUrl: null, crackCookie, reset }
}
