import { useCallback, useState } from 'react'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { buildCrackCookieTransaction } from '../lib/memo'
import { EXPLORER_TX_URL } from '../lib/constants'

export const CRACK_STATUS = {
  IDLE: 'idle',
  BUILDING: 'building',
  AWAITING_APPROVAL: 'awaiting-approval',
  CONFIRMING: 'confirming',
  CONFIRMED: 'confirmed',
  ERROR: 'error',
}

function describeError(err) {
  const message = err?.message || String(err)
  if (/reject/i.test(message)) return 'You declined the transaction in your wallet.'
  if (/insufficient/i.test(message)) {
    return 'Not enough COOK in this wallet to cover the transaction and its network fee.'
  }
  if (/blockhash/i.test(message)) return 'That request expired before it was signed — try again.'
  return message
}

/**
 * Drives one "crack a cookie" transaction end to end: build the
 * instructions, have the connected wallet sign + send them to Cookie
 * Chain, then wait for on-chain confirmation. Every stage is exposed
 * via `status` so the UI can show real-time feedback.
 */
export function useCrackCookie() {
  const { connection } = useConnection()
  const { publicKey, sendTransaction } = useWallet()
  const [status, setStatus] = useState(CRACK_STATUS.IDLE)
  const [error, setError] = useState(null)
  const [signature, setSignature] = useState(null)

  const crackCookie = useCallback(
    async ({ message, replyTo, sprinkleLamports, sprinkleRecipient }) => {
      setError(null)
      setSignature(null)

      if (!publicKey) {
        setStatus(CRACK_STATUS.ERROR)
        setError('Connect a wallet first.')
        return null
      }

      try {
        setStatus(CRACK_STATUS.BUILDING)
        const transaction = buildCrackCookieTransaction({
          payer: publicKey,
          message,
          replyTo,
          sprinkleLamports,
          sprinkleRecipient,
        })

        const latestBlockhash = await connection.getLatestBlockhash('confirmed')
        transaction.recentBlockhash = latestBlockhash.blockhash

        setStatus(CRACK_STATUS.AWAITING_APPROVAL)
        const txSignature = await sendTransaction(transaction, connection)
        setSignature(txSignature)

        setStatus(CRACK_STATUS.CONFIRMING)
        const confirmation = await connection.confirmTransaction(
          { signature: txSignature, ...latestBlockhash },
          'confirmed',
        )
        if (confirmation.value.err) {
          throw new Error('Cookie Chain rejected the transaction during confirmation.')
        }

        setStatus(CRACK_STATUS.CONFIRMED)
        return txSignature
      } catch (err) {
        setStatus(CRACK_STATUS.ERROR)
        setError(describeError(err))
        return null
      }
    },
    [connection, publicKey, sendTransaction],
  )

  const reset = useCallback(() => {
    setStatus(CRACK_STATUS.IDLE)
    setError(null)
    setSignature(null)
  }, [])

  return {
    status,
    error,
    signature,
    explorerUrl: signature ? `${EXPLORER_TX_URL}${signature}` : null,
    crackCookie,
    reset,
  }
}
