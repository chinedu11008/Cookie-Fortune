import React, { useState } from 'react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import ModeToggle from './ModeToggle'
import { getDemoIdentity } from '../lib/demoData'
import { shortenAddress } from '../lib/format'

function DemoWalletBadge() {
  const [address] = useState(() => getDemoIdentity())
  return (
    <span className="demo-wallet-badge" title="A fake identity used only in demo mode">
      🎭 {shortenAddress(address)}
    </span>
  )
}

export default function Header({ mode, onModeChange }) {
  return (
    <header className="site-header">
      <div className="site-header__brand">
        <span className="site-header__mark" aria-hidden="true">
          🥠
        </span>
        <div>
          <p className="site-header__name">CookieFortune</p>
          <p className="site-header__tag">Crack a cookie, leave your fortune on-chain, forever.</p>
        </div>
      </div>
      <div className="site-header__actions">
        <a
          className="site-header__chain-badge"
          href="https://www.cookiechain.wtf"
          target="_blank"
          rel="noreferrer"
        >
          Built on Cookie Chain
        </a>
        <ModeToggle mode={mode} onChange={onModeChange} />
        {mode === 'demo' ? <DemoWalletBadge /> : <WalletMultiButton />}
      </div>
    </header>
  )
}
