# 🥠 CookieFortune

Crack a cookie, leave your fortune on-chain, forever.

CookieFortune is a social cApp for [Cookie Chain](https://www.cookiechain.wtf) — a Solana-compatible
(SVM) network. Connect a wallet, write a short "fortune," and post it as a real, signed transaction.
Every fortune ever posted lives permanently on Cookie Chain and shows up on a live public wall, with a
leaderboard of the most active "fortune tellers."

There is **no backend and no database** — the chain *is* the data store. There is also **no pooled or
app-owned wallet**: every transaction is signed and paid for by the visitor's own connected wallet, and
the optional "sprinkle" tip goes directly, peer-to-peer, from one wallet to another.

## Table of contents

- [How it satisfies the cApp requirements](#how-it-satisfies-the-capp-requirements)
- [How it works](#how-it-works)
- [Setup](#setup)
- [Deploying](#deploying)
- [Project structure](#project-structure)
- [Configuration](#configuration)
- [Design notes](#design-notes)
- [Known limitations / next steps](#known-limitations--next-steps)
- [Submission checklist](#submission-checklist)

## How it satisfies the cApp requirements

| Requirement | Where |
| --- | --- |
| Connect a wallet, Nightly supported | `src/context/WalletContextProvider.jsx` — Solana wallet-adapter with `@solana/wallet-adapter-nightly` explicitly registered, plus auto-detection of any other Wallet Standard wallet (Phantom, Solflare, Backpack, …) |
| Display connected wallet address | The `WalletMultiButton` in the header (`src/components/Header.jsx`) |
| Execute on-chain transactions | "Crack this cookie" in `src/components/CrackCookie.jsx` builds and sends a real transaction via `src/lib/memo.js` |
| Transaction confirmation handling | `src/hooks/useCrackCookie.js` — a state machine (`building → awaiting-approval → confirming → confirmed/error`) that calls `connection.confirmTransaction` |
| Error handling & user feedback | Same hook surfaces wallet rejections, insufficient-balance, and expired-blockhash errors as plain-language messages in the composer |
| View app-specific data / analytics | The live wall, the stats strip (`StatsBar.jsx`), and the leaderboard (`Leaderboard.jsx`) — all read straight from Cookie Chain |
| Clear transaction status updates | Composer button label changes live through each stage, plus a "view transaction" link to Cookiescan once confirmed |

## How it works

**Posting a fortune** builds a transaction with a single [Memo program](https://docs.cookiechain.wtf/ecosystem)
instruction containing your text (prefixed with an app tag so the wall can tell CookieFortune posts
apart from unrelated memo traffic — Memo is a shared program anyone can write to). No token transfer is
required to post, so it costs only the network fee in COOK.

**Replying with a "sprinkle"** adds a second instruction — a direct System Program transfer of COOK from
your wallet straight to the original poster's wallet — in the *same* transaction as your reply memo.
Nobody but the two people involved ever holds those funds.

**The wall, leaderboard, and stats** are all read live from chain data (`src/lib/feed.js`): the app pages
through the Memo program's own transaction history (`getSignaturesForAddress`), decodes each
transaction's memo and any attached transfer, and keeps the ones tagged as CookieFortune posts. This is
a deliberately simple, fully client-side "indexer" — see
[Known limitations](#known-limitations--next-steps).

Cookie Chain embeds the standard Solana programs (Memo, SPL Token, Token-2022, Metaplex, Raydium, Orca,
Jupiter, and more) at genesis at their canonical addresses, so this app needs **no custom on-chain
program and no deployment** — see the live list at
[docs.cookiechain.wtf/ecosystem](https://docs.cookiechain.wtf/ecosystem).

## Setup

Requires Node 18+.

```bash
npm install
cp .env.example .env.local   # defaults already point at Cookie Chain mainnet — edit if you need to
npm run dev
```

Open the printed local URL, install [Nightly](https://nightly.app/) (or any Solana Wallet
Standard wallet) if you haven't, and connect.

**Fund the wallet before posting.** Cookie Chain isn't a free-faucet testnet — COOK is a real,
low-cost SPL token on Solana mainnet (bridged 1:1) that doubles as Cookie Chain's native gas token. A
wallet that has never held any COOK on Cookie Chain has no account entry in the chain's ledger yet, so
even the tiny network fee (~0.000005 COOK) can't be paid, and the app shows a "bridge some COOK" banner
until it detects a balance. Two ways to get some:
- Bridge existing COOK from Solana mainnet at [hyperlane.cookiescan.io](https://hyperlane.cookiescan.io).
- Ask in the [Cookie Chain Telegram](https://t.me/TheCookieNetChain) — hackathon organizers are
  typically happy to help participants get a small amount for testing.

```bash
npm run build      # production build → dist/
npm run preview    # serve the production build locally
```

## Deploying

`npm run build` produces a static `dist/` folder — deploy it anywhere that serves static files:

- **Vercel**: import the repo, framework preset "Vite," no extra config needed.
- **Netlify**: build command `npm run build`, publish directory `dist`.
- Any static host works equally well (Cloudflare Pages, GitHub Pages, etc.) since there is no backend.

## Project structure

```
src/
  lib/
    constants.js   Cookie Chain endpoints, genesis program IDs, app config
    memo.js         Encodes/decodes fortunes, builds the crack-cookie transaction
    feed.js         Reads and decodes the wall from chain history
    format.js       Address shortening, COOK formatting, relative time, lucky numbers
  context/
    WalletContextProvider.jsx   Connection + wallet-adapter setup (Nightly included)
  hooks/
    useCrackCookie.js   Transaction build → sign → send → confirm state machine
    useWallFeed.js      Loads, paginates, and lightly polls the wall
  components/
    Header.jsx, CrackCookie.jsx, Wall.jsx, FortuneCard.jsx, Leaderboard.jsx, StatsBar.jsx
```

## Configuration

Everything configurable lives in `.env.local` (see `.env.example`) — RPC/WebSocket endpoints, the
Cookiescan explorer URL template, and the memo tag prefix. Nothing in this app is a secret; it never
holds a private key.

## Design notes

The visual language leans into the actual subject — a fortune-cookie paper slip, not a generic crypto
dashboard: a warm dough/crust palette, a stamp-red accent for the one primary action, Fraunces for the
fortune text itself, and a "lucky numbers" strip on each card in the style of a real fortune-cookie
insert (seeded deterministically from that post's transaction signature).

## Known limitations / next steps

- **Wallet "sign and send" shortcuts**: `useCrackCookie` deliberately calls `signTransaction` and then
  broadcasts via Cookie Chain's own RPC (`connection.sendRawTransaction`) instead of the wallet
  adapter's combined `sendTransaction`. Several wallets' combined shortcut quietly routes the broadcast
  through their own hosted relay, which doesn't recognize less-common networks like Cookie Chain and
  fails with a 401. Signing only and sending ourselves avoids that.
- **Naming**: Cookie Chain already has an official, community-multisig-controlled
  ["Cookie Jar"](https://docs.cookiechain.wtf/cookie-jar) treasury vault. CookieFortune deliberately
  avoids that name and avoids any pooled address of its own — sprinkles are always direct wallet-to-wallet
  transfers — to not be confused with that vault or imply any relationship to it.
- **Feed indexing**: paging through the Memo program's global signature history and decoding each
  transaction client-side is simple and dependency-free, but doesn't scale forever. If Memo traffic on
  Cookie Chain grows, swap `src/lib/feed.js` for a real indexer or a memo-search API.
- **Explorer link format**: `VITE_EXPLORER_TX_URL` assumes Cookiescan's transaction pages are at
  `/tx/<signature>`. Double check that against a real transaction on
  [cookiescan.io](https://cookiescan.io) and adjust `.env.local` if it differs.
- **Bundle size**: the Solana web3.js + wallet-adapter stack is inherently large (~190 KB gzipped); this
  is normal for Solana dApps. Code-splitting with `React.lazy` would trim the initial load if needed.
- Nice-to-haves if you extend this: NFT "fortune" collectibles via the Metaplex programs already on
  Cookie Chain, richer analytics via the [Cookie DAS API](https://api.cookiescan.io) (Metaplex Digital
  Asset Standard — great for showing a wallet's Cookie Chain NFTs), or swap/liquidity features through
  [Cookiebox](https://cookiebox.app/) or [Cookieswap](https://cookieswap.fun/).

## Submission checklist

- [ ] Deploy `dist/` (Vercel/Netlify/etc.) and note the live URL
- [ ] Push this repo to GitHub (public, MIT/your license of choice)
- [ ] This app uses only genesis-embedded Cookie Chain programs (Memo: `MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr`,
      System Program) — no separate program address to report
- [ ] Post the X (Twitter) thread: what it does, how to use it, and a pointer to the
      [Cookie Chain bridge](https://hyperlane.cookiescan.io) for getting COOK
- [ ] Share the thread in the [Cookie Chain Telegram](https://t.me/TheCookieNetChain)

---

Built on [Cookie Chain](https://www.cookiechain.wtf) · [Docs](https://docs.cookiechain.wtf) ·
[Explorer](https://cookiescan.io) · [Discord](https://discord.gg/XqnStmWgNu) ·
[X](https://x.com/TheCookieChain)
