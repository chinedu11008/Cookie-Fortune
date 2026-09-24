import React from 'react'
import { EXPLORER_ADDRESS_URL, EXPLORER_TX_URL, NATIVE_SYMBOL } from '../lib/constants'
import { formatCook, luckyNumbers, shortenAddress, timeAgo } from '../lib/format'
import { isDemoSignature } from '../lib/demoData'
import { LAMPORTS_PER_SOL } from '@solana/web3.js'

export default function FortuneCard({ fortune, rotation, onReply }) {
  const numbers = luckyNumbers(fortune.signature)
  const isDemo = isDemoSignature(fortune.signature)

  return (
    <article className="slip" style={{ '--slip-tilt': `${rotation}deg` }}>
      {isDemo && <span className="slip__demo-tag">Demo</span>}
      <p className="slip__message">{fortune.message}</p>

      <div className="slip__numbers" aria-hidden="true">
        {numbers.map((n) => (
          <span key={n}>{String(n).padStart(2, '0')}</span>
        ))}
      </div>

      <div className="slip__footer">
        {isDemo ? (
          <span className="slip__author">{shortenAddress(fortune.author)}</span>
        ) : (
          <a
            className="slip__author"
            href={`${EXPLORER_ADDRESS_URL}${fortune.author}`}
            target="_blank"
            rel="noreferrer"
          >
            {shortenAddress(fortune.author)}
          </a>
        )}
        <span className="slip__time">{timeAgo(fortune.blockTime)}</span>
      </div>

      {fortune.sprinkle && (
        <p className="slip__sprinkle">
          🍬 sprinkled {formatCook(fortune.sprinkle.lamports / LAMPORTS_PER_SOL)} {NATIVE_SYMBOL}
        </p>
      )}

      <div className="slip__actions">
        <button type="button" className="slip__reply" onClick={() => onReply(fortune)}>
          Sprinkle &amp; reply
        </button>
        {isDemo ? (
          <span className="slip__view slip__view--demo">Simulated</span>
        ) : (
          <a
            className="slip__view"
            href={`${EXPLORER_TX_URL}${fortune.signature}`}
            target="_blank"
            rel="noreferrer"
          >
            View tx
          </a>
        )}
      </div>
    </article>
  )
}
