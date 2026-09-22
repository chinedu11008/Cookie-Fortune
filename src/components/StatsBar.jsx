import React from 'react'
import { LAMPORTS_PER_SOL } from '@solana/web3.js'
import { formatCook } from '../lib/format'
import { NATIVE_SYMBOL } from '../lib/constants'

export default function StatsBar({ stats, loading }) {
  const items = [
    { label: 'Fortunes cracked', value: loading ? '—' : stats.totalFortunes },
    { label: 'Unique bakers', value: loading ? '—' : stats.uniqueBakers },
    {
      label: 'Sprinkled',
      value: loading ? '—' : `${formatCook(stats.totalSprinkled / LAMPORTS_PER_SOL)} ${NATIVE_SYMBOL}`,
    },
  ]

  return (
    <section className="stats" aria-label="Wall statistics">
      {items.map((item) => (
        <div className="stats__item" key={item.label}>
          <span className="stats__value">{item.value}</span>
          <span className="stats__label">{item.label}</span>
        </div>
      ))}
      <p className="stats__note">Counted from the fortunes currently loaded on this page.</p>
    </section>
  )
}
