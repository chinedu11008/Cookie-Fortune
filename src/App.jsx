import React, { useState } from 'react'
import WalletContextProvider from './context/WalletContextProvider'
import Header from './components/Header'
import CrackCookie from './components/CrackCookie'
import Wall from './components/Wall'
import Leaderboard from './components/Leaderboard'
import StatsBar from './components/StatsBar'
import { useWallFeed } from './hooks/useWallFeed'
import './App.css'

function AppShell() {
  const feed = useWallFeed()
  const [replyTarget, setReplyTarget] = useState(null)

  return (
    <div className="page">
      <Header />

      <main className="layout">
        <div className="layout__side">
          <CrackCookie
            replyTarget={replyTarget}
            onClearReply={() => setReplyTarget(null)}
            onPosted={feed.refresh}
          />
          <StatsBar stats={feed.stats} loading={feed.loading} />
          <Leaderboard leaderboard={feed.stats.leaderboard} />
        </div>

        <div className="layout__main">
          <Wall
            fortunes={feed.fortunes}
            loading={feed.loading}
            loadingMore={feed.loadingMore}
            hasMore={feed.hasMore}
            error={feed.error}
            onLoadMore={feed.loadMore}
            onReply={setReplyTarget}
          />
        </div>
      </main>

      <footer className="site-footer">
        <p>
          Built for the Cookie Chain hackathon. No backend, no custody — every fortune and every
          sprinkle is a transaction signed by your own wallet.
        </p>
      </footer>
    </div>
  )
}

export default function App() {
  return (
    <WalletContextProvider>
      <AppShell />
    </WalletContextProvider>
  )
}
