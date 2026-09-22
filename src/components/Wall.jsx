import React from 'react'
import FortuneCard from './FortuneCard'

function tiltFor(signature) {
  let hash = 0
  for (let i = 0; i < signature.length; i++) hash = (hash * 31 + signature.charCodeAt(i)) >>> 0
  return (hash % 60) / 10 - 3 // -3deg .. 3deg
}

export default function Wall({ fortunes, loading, loadingMore, hasMore, error, onLoadMore, onReply }) {
  return (
    <section className="wall">
      <div className="wall__heading">
        <h2>The wall</h2>
        <p>Every fortune here is a real, signed transaction on Cookie Chain.</p>
      </div>

      {error && <p className="wall__error">{error}</p>}

      {loading ? (
        <div className="wall__grid" aria-busy="true">
          {Array.from({ length: 6 }).map((_, i) => (
            <div className="slip slip--skeleton" key={i} />
          ))}
        </div>
      ) : fortunes.length === 0 ? (
        <div className="wall__empty">
          <p>No fortunes yet. Be the first to crack one open.</p>
        </div>
      ) : (
        <>
          <div className="wall__grid">
            {fortunes.map((fortune) => (
              <FortuneCard
                key={fortune.signature}
                fortune={fortune}
                rotation={tiltFor(fortune.signature)}
                onReply={onReply}
              />
            ))}
          </div>

          {hasMore && (
            <button type="button" className="wall__load-more" onClick={onLoadMore} disabled={loadingMore}>
              {loadingMore ? 'Loading…' : 'Load older fortunes'}
            </button>
          )}
        </>
      )}
    </section>
  )
}
