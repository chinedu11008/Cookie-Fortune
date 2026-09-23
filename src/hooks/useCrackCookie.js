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

  if (/AccountNotFound/i.test(message)) {
    return "This wallet has no COOK on Cookie Chain yet, so it can't pay the network fee. Bridge a little COOK over, or ask in the Cookie Chain Telegram, then try again."
  }

  if (/insufficient/i.test(message)) {
    return 'Not enough COOK in this wallet to cover the transaction and its network fee.'
  }

  if (/blockhash/i.test(message)) return 'That request expired before it was signed — try again.'

  if (/401|unauthorized/i.test(message)) {
    return "Your wallet's own relay rejected this network — try reconnecting the wallet, or a different wallet, then try again."
  }

  return message
}

/**
 * Drives one "crack a cookie" transaction end to end: build the
 * instructions, have the connected wallet sign, broadcast it ourselves
 * to Cookie Chain, then wait for on-chain confirmation. Every stage is
 * exposed via `status` so the UI can show real-time feedback.
 */
export function useCrackCookie() {
  const { connection } = useConnection()
  const { publicKey, signTransaction, sendTransaction } = useWallet()
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

        let txSignature
        if (signTransaction) {
          // Sign locally, then broadcast ourselves via Cookie Chain's own
          // RPC. Several wallets' combined "sign and send" shortcut
          // quietly routes the broadcast through their own hosted
          // relay/session service, which doesn't recognize a less common
          // network like Cookie Chain and fails (401 Unauthorized).
          // Signing only and sending via our own connection sidesteps
          // that entirely — the wallet is only asked for a signature.
          const signed = await signTransaction(transaction)
          txSignature = await connection.sendRawTransaction(signed.serialize(), {
            preflightCommitment: 'confirmed',
          })
        } else {
          // Fallback for the rare wallet that only exposes the combined
          // sign-and-send flow.
          txSignature = await sendTransaction(transaction, connection)
        }

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
    [connection, publicKey, signTransaction, sendTransaction],
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
