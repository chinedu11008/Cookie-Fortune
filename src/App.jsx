import React, { useState } from 'react'
import WalletContextProvider from './context/WalletContextProvider'
import Header from './components/Header'
import CrackCookie from './components/CrackCookie'
import Wall from './components/Wall'
import Leaderboard from './components/Leaderboard'
import StatsBar from './components/StatsBar'
import { useWallFeed } from './hooks/useWallFeed'
import { useDemoWall } from './hooks/useDemoWall'
import { useAppMode } from './hooks/useAppMode'
import { resetDemoFortunes } from './lib/demoData'
import './App.css'

function AppShell() {
  const [mode, setMode] = useAppMode()
  const isDemo = mode === 'demo'

  // Both feeds are always loaded (rules of hooks); only the active
  // mode's data is actually rendered below.
  const liveFeed = useWallFeed()
  const demoFeed = useDemoWall()
  const feed = isDemo ? demoFeed : liveFeed

  const [replyTarget, setReplyTarget] = useState(null)

  return (
    <div className="page">
      <Header mode={mode} onModeChange={setMode} />

      {isDemo && (
        <div className="demo-banner">
          <span>🎭 Demo mode — everything below is simulated and saved only on this device. Nothing touches Cookie Chain.</span>
          <button type="button" className="demo-banner__reset" onClick={resetDemoFortunes}>
            Reset demo data
          </button>
        </div>
      )}

      <main className="layout">
        <div className="layout__side">
          <CrackCookie
            mode={mode}
            replyTarget={replyTarget}
            onClearReply={() => setReplyTarget(null)}
            onPosted={feed.refresh}
          />
          <StatsBar stats={feed.stats} loading={feed.loading} mode={mode} />
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
            mode={mode}
          />
        </div>
      </main>

      <footer className="site-footer">
        <p>
          Built for the Cookie Chain hackathon. No backend, no custody — every fortune and every
          sprinkle in Live mode is a transaction signed by your own wallet.
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
