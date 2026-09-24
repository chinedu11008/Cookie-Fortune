import { Keypair } from '@solana/web3.js'
import { MAX_FORTUNE_LENGTH } from './constants'

// Demo mode never touches Cookie Chain. Everything here lives in
// localStorage on this one device, so it's safe to explore with no
// wallet, no COOK, and no risk — good for a first look, a walkthrough
// video, or judging without needing a funded wallet.

const FORTUNES_KEY = 'cookiefortune:demo-fortunes:v1'
const IDENTITY_KEY = 'cookiefortune:demo-identity:v1'
const SIGNATURE_PREFIX = 'demo-'

const SEED_AUTHORS = [
  '8YaVN3HfUYxzEAzz1pMYWrFuSyXDS3VhLjBiexR5UF79',
  'HgWUFz7Mvt7PRFYtBEuc5956V9ScAxc2aSA6M76nNgTW',
  '7uSKZ9AQ6sGxzC6j8SUe1aEiCU4smUWPzJ1aAo5HCSgL',
  '88yu7PgUvd1WJkDVpkR6RXCciAE8ffT5KSZCrReeN2Wc',
  '6jWkQxoWowFVgUBQ9k6j16uLJXLaQJudKzqiJyjVGVgf',
]

// { minutesAgo, author index, message, optional sprinkle in lamports }
const SEED_TEMPLATE = [
  { minutesAgo: 6, author: 0, message: 'A wise ape once said: never sell the bottom.' },
  { minutesAgo: 19, author: 1, message: 'The blockchain remembers what your group chat forgets.' },
  {
    minutesAgo: 34,
    author: 2,
    message: 'Good things come to those who bridge.',
    sprinkleLamports: 12_000_000,
    sprinkleTo: 1,
  },
  { minutesAgo: 58, author: 3, message: 'Patience is a virtue. Gas fees are not — luckily, neither are ours.' },
  { minutesAgo: 95, author: 4, message: 'Somewhere on Cookie Chain, a cookie is being cracked in your honor.' },
  {
    minutesAgo: 140,
    author: 1,
    message: 'The best time to post was yesterday. The second best time is now.',
    sprinkleLamports: 5_000_000,
    sprinkleTo: 3,
  },
  { minutesAgo: 210, author: 2, message: "Fortune favors the wallet that cracks first. That's you, degen." },
]

function randomToken(length) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz123456789'
  let out = ''
  for (let i = 0; i < length; i++) out += chars[Math.floor(Math.random() * chars.length)]
  return out
}

export function isDemoSignature(signature) {
  return typeof signature === 'string' && signature.startsWith(SIGNATURE_PREFIX)
}

/** A stable, fake-but-real-shaped wallet address for this browser's demo identity. */
export function getDemoIdentity() {
  try {
    let stored = localStorage.getItem(IDENTITY_KEY)
    if (!stored) {
      stored = Keypair.generate().publicKey.toBase58()
      localStorage.setItem(IDENTITY_KEY, stored)
    }
    return stored
  } catch {
    // localStorage unavailable (private browsing, quota) — fall back to
    // a fresh identity for this session only.
    return Keypair.generate().publicKey.toBase58()
  }
}

function seedFortunes() {
  const now = Math.floor(Date.now() / 1000)
  return SEED_TEMPLATE.map((entry, i) => ({
    signature: `${SIGNATURE_PREFIX}seed-${i}`,
    author: SEED_AUTHORS[entry.author],
    message: entry.message,
    replyTo: null,
    sprinkle: entry.sprinkleLamports
      ? { lamports: entry.sprinkleLamports, recipient: SEED_AUTHORS[entry.sprinkleTo] }
      : null,
    blockTime: now - entry.minutesAgo * 60,
  }))
}

function loadPosted() {
  try {
    const raw = localStorage.getItem(FORTUNES_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function savePosted(fortunes) {
  try {
    localStorage.setItem(FORTUNES_KEY, JSON.stringify(fortunes))
  } catch {
    // Demo mode degrades gracefully to seed-only data if storage fails.
  }
}

const listeners = new Set()
function notify() {
  const fortunes = getDemoFortunes()
  listeners.forEach((fn) => fn(fortunes))
}

export function getDemoFortunes() {
  return [...loadPosted(), ...seedFortunes()].sort((a, b) => (b.blockTime ?? 0) - (a.blockTime ?? 0))
}

export function addDemoFortune({ author, message, replyTo, sprinkleLamports, sprinkleRecipient }) {
  const trimmed = (message || '').trim().slice(0, MAX_FORTUNE_LENGTH)
  if (!trimmed) throw new Error('Write a fortune before cracking the cookie.')
  if (!author) throw new Error('Demo identity is not ready yet — try again.')

  const fortune = {
    signature: `${SIGNATURE_PREFIX}${randomToken(48)}`,
    author,
    message: trimmed,
    replyTo: replyTo || null,
    sprinkle:
      sprinkleLamports && sprinkleRecipient ? { lamports: sprinkleLamports, recipient: sprinkleRecipient } : null,
    blockTime: Math.floor(Date.now() / 1000),
  }

  const posted = loadPosted()
  posted.unshift(fortune)
  savePosted(posted)
  notify()
  return fortune
}

export function resetDemoFortunes() {
  try {
    localStorage.removeItem(FORTUNES_KEY)
  } catch {
    // no-op
  }
  notify()
}

/** Re-render subscribers when demo data changes, including from another tab. */
export function subscribeDemoFortunes(callback) {
  listeners.add(callback)
  const onStorage = (e) => {
    if (e.key === FORTUNES_KEY) notify()
  }
  window.addEventListener('storage', onStorage)
  return () => {
    listeners.delete(callback)
    window.removeEventListener('storage', onStorage)
  }
}
