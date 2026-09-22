import React from 'react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'

export default function Header() {
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
        <WalletMultiButton />
      </div>
    </header>
  )
}
