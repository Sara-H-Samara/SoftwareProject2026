import { useState } from 'react'
import { BidUpdate } from '@/hooks/useLiveSession'

interface Props {
  artworkId: string
  artworkTitle: string
  currentBid: BidUpdate | null
  onPlaceBid: (artworkId: string, amount: number) => void
  isArtist?: boolean
}

export function LiveAuction({ artworkId, artworkTitle, currentBid, onPlaceBid, isArtist }: Props) {
  const [amount, setAmount] = useState('')
  const [error, setError] = useState<string | null>(null)

  const minBid = currentBid ? currentBid.amount + 1 : 1

  const handleBid = () => {
    const val = parseFloat(amount)
    if (isNaN(val) || val < minBid) {
      setError(`Minimum bid is $${minBid}`)
      return
    }
    setError(null)
    onPlaceBid(artworkId, val)
    setAmount('')
  }

  return (
    <div className="bg-amber-50 dark:bg-amber-950/30 rounded-xl p-4 border border-amber-200 dark:border-amber-800">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-amber-500 text-lg">🔨</span>
        <span className="font-semibold text-gray-900 dark:text-white text-sm">
          Auction — {artworkTitle}
        </span>
      </div>

      {/* Current top bid */}
      {currentBid ? (
        <div className="mb-3 p-2.5 rounded-lg bg-white dark:bg-gray-900 border border-amber-200 dark:border-amber-800">
          <p className="text-xs text-gray-500 dark:text-gray-400">Current top bid</p>
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
            ${currentBid.amount.toLocaleString()}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            by {currentBid.bidderName}
          </p>
        </div>
      ) : (
        <div className="mb-3 p-2.5 rounded-lg bg-white dark:bg-gray-900 border border-amber-200 dark:border-amber-800">
          <p className="text-sm text-gray-500 dark:text-gray-400">No bids yet — be the first!</p>
        </div>
      )}

      {/* Bid input — hidden for artist */}
      {!isArtist && (
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
            <input
              type="number"
              min={minBid}
              step="1"
              placeholder={`Min $${minBid}`}
              value={amount}
              onChange={e => setAmount(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleBid()}
              className="w-full pl-7 pr-3 py-2 rounded-lg border border-amber-200 dark:border-amber-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>
          <button
            onClick={handleBid}
            className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium transition"
          >
            Bid
          </button>
        </div>
      )}

      {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
    </div>
  )
}