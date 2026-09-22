import { MEMO_PROGRAM_ID, SYSTEM_PROGRAM_ID, FEED_PAGE_SIZE } from './constants'
import { decodeFortuneMemo } from './memo'

// Minimal, dependency-free decode of a System Program "Transfer"
// instruction's raw data: a 4-byte little-endian u32 tag (2 = Transfer)
// followed by an 8-byte little-endian u64 lamport amount.
function decodeSystemTransferLamports(dataBytes) {
  if (!dataBytes || dataBytes.length < 12) return null
  const tag = dataBytes[0] | (dataBytes[1] << 8) | (dataBytes[2] << 16) | (dataBytes[3] << 24)
  if (tag !== 2) return null
  let lamports = 0n
  for (let i = 0; i < 8; i++) {
    lamports |= BigInt(dataBytes[4 + i]) << BigInt(8 * i)
  }
  return Number(lamports)
}

// CookieFortune has no backend and no database — the chain *is* the
// database. The Memo program's own address receives every transaction
// that ever used it (from any app), so we page through its signature
// history and keep only the ones tagged as CookieFortune posts.
//
// This is a deliberately simple, fully client-side indexer. It's fine
// for a hackathon-scale wall; a busier chain would want a real indexer
// or an API that can search memos server-side instead of fetching each
// transaction individually.

async function mapWithConcurrency(items, limit, mapper) {
  const results = new Array(items.length)
  let cursor = 0
  async function worker() {
    while (cursor < items.length) {
      const index = cursor++
      results[index] = await mapper(items[index], index)
    }
  }
  const workers = Array.from({ length: Math.min(limit, items.length) }, worker)
  await Promise.all(workers)
  return results
}

function decodeFortuneFromTransaction(tx, signature, fallbackBlockTime) {
  if (!tx || tx.meta?.err) return null

  const message = tx.transaction.message
  const accountKeys = message.getAccountKeys()

  let memoProgramIndex = -1
  for (let i = 0; i < accountKeys.length; i++) {
    if (accountKeys.get(i)?.equals(MEMO_PROGRAM_ID)) {
      memoProgramIndex = i
      break
    }
  }
  if (memoProgramIndex === -1) return null

  const memoInstruction = message.compiledInstructions.find(
    (ix) => ix.programIdIndex === memoProgramIndex,
  )
  if (!memoInstruction) return null

  let memoText
  try {
    memoText = Buffer.from(memoInstruction.data).toString('utf-8')
  } catch {
    return null
  }

  const decoded = decodeFortuneMemo(memoText)
  if (!decoded) return null

  const author = accountKeys.get(0)
  if (!author) return null

  // A fortune can optionally carry a "sprinkle" — a direct, peer-to-peer
  // COOK transfer bundled in the same transaction (see src/lib/memo.js).
  // Look for a System Program transfer instruction alongside the memo.
  let sprinkle = null
  let systemProgramIndex = -1
  for (let i = 0; i < accountKeys.length; i++) {
    if (accountKeys.get(i)?.equals(SYSTEM_PROGRAM_ID)) {
      systemProgramIndex = i
      break
    }
  }
  if (systemProgramIndex !== -1) {
    const transferInstruction = message.compiledInstructions.find(
      (ix) => ix.programIdIndex === systemProgramIndex,
    )
    if (transferInstruction) {
      const lamports = decodeSystemTransferLamports(transferInstruction.data)
      const recipientIndex = transferInstruction.accountKeyIndexes?.[1]
      const recipient = recipientIndex !== undefined ? accountKeys.get(recipientIndex) : null
      if (lamports && recipient) {
        sprinkle = { lamports, recipient: recipient.toBase58() }
      }
    }
  }

  return {
    signature,
    author: author.toBase58(),
    message: decoded.message,
    replyTo: decoded.replyTo,
    sprinkle,
    blockTime: tx.blockTime ?? fallbackBlockTime ?? null,
  }
}

/**
 * Fetches one page of the wall, oldest-first cursor included so the
 * caller can page further back with { before }.
 */
export async function fetchFortunePage(connection, { before } = {}) {
  const signatureInfos = await connection.getSignaturesForAddress(
    MEMO_PROGRAM_ID,
    { limit: FEED_PAGE_SIZE, before },
  )

  const successful = signatureInfos.filter((info) => !info.err)
  if (successful.length === 0) {
    return {
      fortunes: [],
      oldestSignature: signatureInfos.at(-1)?.signature ?? null,
      hasMore: signatureInfos.length === FEED_PAGE_SIZE,
    }
  }

  const transactions = await mapWithConcurrency(successful, 8, (info) =>
    connection
      .getTransaction(info.signature, { maxSupportedTransactionVersion: 0 })
      .catch(() => null),
  )

  const fortunes = []
  transactions.forEach((tx, i) => {
    const info = successful[i]
    const fortune = decodeFortuneFromTransaction(tx, info.signature, info.blockTime)
    if (fortune) fortunes.push(fortune)
  })

  fortunes.sort((a, b) => (b.blockTime ?? 0) - (a.blockTime ?? 0))

  return {
    fortunes,
    oldestSignature: signatureInfos.at(-1)?.signature ?? null,
    hasMore: signatureInfos.length === FEED_PAGE_SIZE,
  }
}

export function summarizeFortunes(fortunes) {
  const byAuthor = new Map()
  let totalSprinkled = 0

  for (const fortune of fortunes) {
    byAuthor.set(fortune.author, (byAuthor.get(fortune.author) || 0) + 1)
    if (fortune.sprinkle?.lamports) {
      totalSprinkled += fortune.sprinkle.lamports
    }
  }

  const leaderboard = Array.from(byAuthor.entries())
    .map(([author, count]) => ({ author, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)

  return {
    totalFortunes: fortunes.length,
    uniqueBakers: byAuthor.size,
    leaderboard,
    totalSprinkled,
  }
}
