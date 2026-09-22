export function shortenAddress(address, chars = 4) {
  if (!address) return ''
  const str = typeof address === 'string' ? address : address.toBase58()
  if (str.length <= chars * 2 + 3) return str
  return `${str.slice(0, chars)}…${str.slice(-chars)}`
}

export function formatCook(amount, maxDecimals = 4) {
  if (amount === null || amount === undefined || Number.isNaN(amount)) return '0'
  const rounded = Number(amount.toFixed(maxDecimals))
  return rounded.toLocaleString(undefined, { maximumFractionDigits: maxDecimals })
}

export function timeAgo(unixSeconds) {
  if (!unixSeconds) return 'just now'
  const seconds = Math.max(0, Math.floor(Date.now() / 1000 - unixSeconds))
  if (seconds < 5) return 'just now'
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(unixSeconds * 1000).toLocaleDateString()
}

// A short, deterministic "lucky numbers" strip per fortune, in the style
// of the ones printed on real fortune cookie slips — seeded from the
// transaction signature so it's the same every time the same fortune
// renders, without needing to store anything extra on-chain.
export function luckyNumbers(seedString, count = 6) {
  let seed = 0
  for (let i = 0; i < seedString.length; i++) {
    seed = (seed * 31 + seedString.charCodeAt(i)) >>> 0
  }
  const numbers = []
  const used = new Set()
  while (numbers.length < count) {
    seed = (seed * 1103515245 + 12345) >>> 0
    const n = (seed % 99) + 1
    if (!used.has(n)) {
      used.add(n)
      numbers.push(n)
    }
  }
  return numbers.sort((a, b) => a - b)
}
