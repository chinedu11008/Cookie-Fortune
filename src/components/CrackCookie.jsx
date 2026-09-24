import React, { useEffect, useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { LAMPORTS_PER_SOL } from '@solana/web3.js'
import { useCrackCookie, CRACK_STATUS } from '../hooks/useCrackCookie'
import { useDemoCrackCookie } from '../hooks/useDemoCrackCookie'
import { useWalletBalance } from '../hooks/useWalletBalance'
import { BRIDGE_URL, MAX_FORTUNE_LENGTH, NATIVE_SYMBOL, TELEGRAM_URL } from '../lib/constants'
import { shortenAddress } from '../lib/format'

const DEFAULT_SPRINKLE = '0.01'
const BUSY_STATUSES = [CRACK_STATUS.BUILDING, CRACK_STATUS.AWAITING_APPROVAL, CRACK_STATUS.CONFIRMING]

const STATUS_LABEL = {
  [CRACK_STATUS.BUILDING]: 'Preparing your fortune…',
  [CRACK_STATUS.AWAITING_APPROVAL]: 'Approve in your wallet…',
  [CRACK_STATUS.CONFIRMING]: 'Confirming on Cookie Chain…',
}

const DEMO_STATUS_LABEL = {
  [CRACK_STATUS.BUILDING]: 'Preparing your fortune…',
  [CRACK_STATUS.AWAITING_APPROVAL]: 'Simulating approval…',
  [CRACK_STATUS.CONFIRMING]: 'Simulating confirmation…',
}

export default function CrackCookie({ mode, replyTarget, onClearReply, onPosted }) {
  const isDemo = mode === 'demo'

  // Both hooks are always called (rules of hooks) — only the active
  // mode's result is actually used below.
  const { connected: liveConnected } = useWallet()
  const live = useCrackCookie()
  const demo = useDemoCrackCookie()
  const { lamports: balanceLamports, refresh: refreshBalance } = useWalletBalance()

  const { status, error, explorerUrl, crackCookie, reset } = isDemo ? demo : live
  const connected = isDemo ? true : liveConnected
  const needsFunding = !isDemo && liveConnected && balanceLamports === 0

  const [message, setMessage] = useState('')
  const [sprinkleEnabled, setSprinkleEnabled] = useState(true)
  const [sprinkleAmount, setSprinkleAmount] = useState(DEFAULT_SPRINKLE)

  const isReplying = Boolean(replyTarget)
  const busy = BUSY_STATUSES.includes(status)
  const remaining = MAX_FORTUNE_LENGTH - message.length

  useEffect(() => {
    if (isReplying) setSprinkleEnabled(true)
  }, [isReplying])

  // A reply picked up in one mode doesn't make sense in the other (the
  // target's author/signature belong to a different feed entirely).
  useEffect(() => {
    if (replyTarget) onClearReply?.()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!message.trim() || busy) return

    const sprinkleLamports =
      isReplying && sprinkleEnabled && Number(sprinkleAmount) > 0
        ? Math.round(Number(sprinkleAmount) * LAMPORTS_PER_SOL)
        : undefined

    const signature = await crackCookie({
      message: message.trim(),
      replyTo: replyTarget?.signature,
      sprinkleLamports,
      sprinkleRecipient: sprinkleLamports ? replyTarget?.author : undefined,
    })

    if (signature) {
      setMessage('')
      onPosted?.()
      onClearReply?.()
      if (!isDemo) refreshBalance()
    }
  }

  return (
    <form className="composer" onSubmit={handleSubmit}>
      <div className="composer__slip">
        {isDemo && (
          <p className="composer__demo-note">
            Demo mode: this fortune stays on your device only — nothing is sent to Cookie Chain.
          </p>
        )}

        {needsFunding && (
          <p className="composer__funding-warning">
            This wallet has no {NATIVE_SYMBOL} on Cookie Chain yet, so it can't cover the network
            fee.{' '}
            <a href={BRIDGE_URL} target="_blank" rel="noreferrer">
              Bridge some over
            </a>{' '}
            or ask in the{' '}
            <a href={TELEGRAM_URL} target="_blank" rel="noreferrer">
              Cookie Chain Telegram
            </a>
            , or switch to Demo above to try the app without funds.
          </p>
        )}

        {isReplying && (
          <div className="composer__reply-chip">
            <span>
              Replying to <strong>{shortenAddress(replyTarget.author)}</strong>
            </span>
            <button
              type="button"
              className="composer__reply-clear"
              onClick={() => {
                onClearReply?.()
                reset()
              }}
            >
              cancel
            </button>
          </div>
        )}

        <textarea
          className="composer__textarea"
          placeholder={isReplying ? 'Write your reply fortune…' : "Crack open today's fortune…"}
          value={message}
          maxLength={MAX_FORTUNE_LENGTH}
          onChange={(e) => setMessage(e.target.value)}
          disabled={busy}
          rows={3}
        />

        <div className="composer__meta">
          <span className={remaining < 20 ? 'composer__count composer__count--low' : 'composer__count'}>
            {remaining} left
          </span>

          {isReplying && (
            <label className="composer__sprinkle">
              <input
                type="checkbox"
                checked={sprinkleEnabled}
                onChange={(e) => setSprinkleEnabled(e.target.checked)}
                disabled={busy}
              />
              Sprinkle
              <input
                type="number"
                className="composer__sprinkle-amount"
                value={sprinkleAmount}
                onChange={(e) => setSprinkleAmount(e.target.value)}
                disabled={!sprinkleEnabled || busy}
                min="0"
                step="0.01"
              />
              {NATIVE_SYMBOL}
            </label>
          )}
        </div>
      </div>

      <div className="composer__footer">
        <button type="submit" className="composer__submit" disabled={!connected || busy || !message.trim()}>
          {busy ? (isDemo ? DEMO_STATUS_LABEL[status] : STATUS_LABEL[status]) : 'Crack this cookie'}
        </button>

        {!connected && <p className="composer__hint">Connect a wallet above to post a fortune.</p>}

        {status === CRACK_STATUS.CONFIRMED && (
          <p className="composer__success">
            {isDemo ? (
              'Cracked! Saved to this device — switch to Live when you want it on-chain for real.'
            ) : explorerUrl ? (
              <>
                Cracked! Your fortune is on Cookie Chain —{' '}
                <a href={explorerUrl} target="_blank" rel="noreferrer">
                  view transaction
                </a>
                .
              </>
            ) : (
              'Cracked! Your fortune is on Cookie Chain.'
            )}
          </p>
        )}

        {status === CRACK_STATUS.ERROR && error && <p className="composer__error">{error}</p>}
      </div>
    </form>
  )
}
