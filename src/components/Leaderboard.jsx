import React from 'react'
import { shortenAddress } from '../lib/format'

export default function Leaderboard({ leaderboard }) {
  return (
    <section className="board">
      <h2>Top fortune tellers</h2>
      {leaderboard.length === 0 ? (
        <p className="board__empty">Nobody's cracked a cookie yet — that could be you.</p>
      ) : (
        <ol className="board__list">
          {leaderboard.map((entry, i) => (
            <li key={entry.author} className="board__row">
              <span className="board__rank">{String(i + 1).padStart(2, '0')}</span>
              <span className="board__addr">{shortenAddress(entry.author)}</span>
              <span className="board__count">
                {entry.count} {entry.count === 1 ? 'cookie' : 'cookies'}
              </span>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}
