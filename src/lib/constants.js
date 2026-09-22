import { PublicKey } from '@solana/web3.js'

// --- Cookie Chain network -------------------------------------------------
// Cookie Chain is a Solana-compatible SVM network. Standard Solana SDKs
// work unmodified — the only thing that changes is which RPC you point at.
// Source: https://docs.cookiechain.wtf/developer-guide and
// https://docs.cookiechain.wtf/wallets
export const RPC_URL = import.meta.env.VITE_RPC_URL || 'https://rpc.cookiescan.io'
export const WS_URL = import.meta.env.VITE_WS_URL || 'wss://wss.cookiescan.io'

// Cookiescan block explorer, for "view transaction" / "view wallet" links.
export const EXPLORER_TX_URL =
  import.meta.env.VITE_EXPLORER_TX_URL || 'https://cookiescan.io/tx/'
export const EXPLORER_ADDRESS_URL = 'https://cookiescan.io/address/'

// --- Genesis-embedded programs --------------------------------------------
// Cookie Chain ships the standard Solana native/SPL programs at genesis,
// at their canonical Solana addresses, so no custom program deploy is
// needed for this app. Confirmed against the live table at
// https://docs.cookiechain.wtf/ecosystem — double check there if Cookie
// Chain ever re-deploys these at different addresses.
export const MEMO_PROGRAM_ID = new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr')
export const SYSTEM_PROGRAM_ID = new PublicKey('11111111111111111111111111111111')

// Native asset. COOK is 9-decimal, same as SOL, so LAMPORTS_PER_SOL from
// @solana/web3.js is the correct divisor for COOK amounts too.
export const NATIVE_SYMBOL = 'COOK'

// --- App-level config -------------------------------------------------
// Every fortune this app posts is a memo starting with this tag, so the
// wall can pick its own posts out of all the other memo traffic on the
// chain (Memo is a shared program — anything can write to it).
export const APP_TAG = import.meta.env.VITE_APP_TAG || 'COOKIEFORTUNE_V1'
export const MEMO_DELIMITER = '|'

export const MAX_FORTUNE_LENGTH = 200
export const FEED_PAGE_SIZE = 40
