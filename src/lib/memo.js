import { SystemProgram, Transaction, TransactionInstruction, PublicKey } from '@solana/web3.js'
import { MEMO_PROGRAM_ID, APP_TAG, MEMO_DELIMITER } from './constants'

// A CookieFortune memo looks like:
//   COOKIEFORTUNE_V1|<replyTo signature or empty>|<message text>
// The tag lets the wall tell its own posts apart from unrelated memo
// traffic (Memo is a shared program — anything can write to it).
export function encodeFortuneMemo(message, { replyTo } = {}) {
  return [APP_TAG, replyTo || '', message].join(MEMO_DELIMITER)
}

export function decodeFortuneMemo(memoText) {
  const prefix = APP_TAG + MEMO_DELIMITER
  if (!memoText || !memoText.startsWith(prefix)) return null
  const rest = memoText.slice(prefix.length)
  const delimIndex = rest.indexOf(MEMO_DELIMITER)
  if (delimIndex === -1) return null
  const replyTo = rest.slice(0, delimIndex) || null
  const message = rest.slice(delimIndex + 1)
  if (!message) return null
  return { replyTo, message }
}

/**
 * Builds an unsigned transaction that "cracks a cookie": a Memo
 * instruction carrying the fortune, plus an optional direct,
 * peer-to-peer COOK transfer ("sprinkle") when replying to someone
 * else's fortune. There is never a pooled or app-owned wallet — a
 * sprinkle goes straight from the poster's own wallet to the fortune
 * author's wallet, in the same transaction.
 */
export function buildCrackCookieTransaction({
  payer,
  message,
  replyTo,
  sprinkleLamports,
  sprinkleRecipient,
}) {
  if (!payer) throw new Error('Connect a wallet first.')
  const trimmed = (message || '').trim()
  if (!trimmed) throw new Error('Write a fortune before cracking the cookie.')

  const instructions = []

  if (sprinkleLamports && sprinkleRecipient) {
    instructions.push(
      SystemProgram.transfer({
        fromPubkey: payer,
        toPubkey: new PublicKey(sprinkleRecipient),
        lamports: sprinkleLamports,
      }),
    )
  }

  const memoText = encodeFortuneMemo(trimmed, { replyTo })
  instructions.push(
    new TransactionInstruction({
      keys: [{ pubkey: payer, isSigner: true, isWritable: false }],
      programId: MEMO_PROGRAM_ID,
      data: Buffer.from(memoText, 'utf-8'),
    }),
  )

  const transaction = new Transaction().add(...instructions)
  transaction.feePayer = payer
  return transaction
}
