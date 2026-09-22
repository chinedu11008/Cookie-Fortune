import React, { useMemo } from 'react'
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import { NightlyWalletAdapter } from '@solana/wallet-adapter-nightly'
import { RPC_URL, WS_URL } from '../lib/constants'

// Default wallet-adapter styles for the connect modal / buttons. We
// override the visual details in App.css so it matches CookieFortune.
import '@solana/wallet-adapter-react-ui/styles.css'

export default function WalletContextProvider({ children }) {
  // Any wallet that implements the Wallet Standard (Phantom, Solflare,
  // Backpack, Nightly, …) is auto-detected if it's installed. We still
  // list Nightly explicitly since the Cookie Chain cApp requirements
  // call it out by name.
  const wallets = useMemo(() => [new NightlyWalletAdapter()], [])

  const connectionConfig = useMemo(
    () => ({ commitment: 'confirmed', wsEndpoint: WS_URL }),
    [],
  )

  return (
    <ConnectionProvider endpoint={RPC_URL} config={connectionConfig}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  )
}
