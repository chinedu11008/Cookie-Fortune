import { useCallback, useEffect, useState } from 'react'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'

/**
 * A wallet address that has never received any COOK on Cookie Chain has
 * no account entry in the ledger at all — getBalance still returns 0
 * for it (that call never errors), but a real transaction naming it as
 * fee payer fails simulation with "AccountNotFound". Checking the
 * balance up front lets the composer warn before that happens instead
 * of after.
 */
export function useWalletBalance() {
  const { connection } = useConnection()
  const { publicKey } = useWallet()
  const [lamports, setLamports] = useState(null)
  const [loading, setLoading] = useState(false)

  const refresh = useCallback(async () => {
    if (!publicKey) {
      setLamports(null)
      return
    }
    setLoading(true)
    try {
      const balance = await connection.getBalance(publicKey, 'confirmed')
      setLamports(balance)
    } catch {
      setLamports(null)
    } finally {
      setLoading(false)
    }
  }, [connection, publicKey])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { lamports, loading, refresh }
}
