// src/pages/LiveGalleryPage.tsx
import { useState, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { liveApi } from '@/api/live.api'
import { useLiveSession } from '@/hooks/useLiveSession'
import type { LiveSessionDto, FeaturedArtworkDto, AuctionWinnerDto } from '@/types/live'
import toast from 'react-hot-toast'
import { UserGroupIcon, TrophyIcon, BanknotesIcon } from '@heroicons/react/24/outline'

// ── Join screen ───────────────────────────────────────────────────────────────
function JoinScreen({ onJoin, loading }: { onJoin: (code: string) => void; loading: boolean }) {
  const [code, setCode] = useState('')
  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-8 w-full max-w-sm text-center">
        <div className="w-14 h-14 rounded-2xl bg-red-100 flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">🎨</span>
        </div>
        <h1 className="text-xl font-bold text-stone-800 mb-1">Join Live Auction</h1>
        <p className="text-sm text-stone-500 mb-6">Enter the invite code from the artist</p>
        <input
          value={code} onChange={e => setCode(e.target.value.toUpperCase())}
          onKeyDown={e => e.key === 'Enter' && code.length >= 4 && onJoin(code)}
          placeholder="e.g. ART42X" maxLength={6}
          className="w-full border border-stone-200 rounded-xl px-4 py-3 text-center text-xl font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-gallery-500 mb-4"
        />
        <button
          onClick={() => onJoin(code)} disabled={code.length < 4 || loading}
          className="w-full py-3 rounded-xl bg-gallery-600 text-white font-semibold hover:bg-gallery-700 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Joining…' : 'Join Session'}
        </button>
      </div>
    </div>
  )
}

// ── Chat ──────────────────────────────────────────────────────────────────────
function LiveChat({ messages, onSend }: {
  messages: { userId: string; name: string; message: string; isArtist: boolean; isSystem: boolean }[]
  onSend: (msg: string) => void
}) {
  const [text, setText] = useState('')
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto space-y-2 p-3">
        {messages.map((m, i) => (
          <div key={i} className={`text-xs ${m.isSystem ? 'text-center' : ''}`}>
            {m.isSystem ? (
              <span className="text-stone-400 italic">{m.message}</span>
            ) : (
              <span>
                <span className={`font-semibold ${m.isArtist ? 'text-gallery-600' : 'text-stone-300'}`}>
                  {m.name}{m.isArtist ? ' 🎨' : ''}:
                </span>{' '}
                <span className="text-stone-400">{m.message}</span>
              </span>
            )}
          </div>
        ))}
      </div>
      <div className="flex gap-2 p-2 border-t border-stone-700">
        <input
          value={text} onChange={e => setText(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && text.trim()) { onSend(text.trim()); setText('') } }}
          placeholder="Type a message…"
          className="flex-1 text-sm bg-stone-700 border border-stone-600 text-white rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-gallery-500 placeholder:text-stone-500"
        />
        <button
          onClick={() => { if (text.trim()) { onSend(text.trim()); setText('') } }}
          className="px-3 py-1.5 bg-gallery-600 text-white text-sm rounded-lg hover:bg-gallery-700"
        >→</button>
      </div>
    </div>
  )
}

// ── Viewer panel (only when session is loaded) ────────────────────────────────
function ViewerPanel({ session }: { session: LiveSessionDto }) {
  const navigate    = useNavigate()
  const { user }    = useAuthStore()
  const [featured,  setFeatured]  = useState<FeaturedArtworkDto | null>(session.featuredArtwork ?? null)
  const [winner,    setWinner]    = useState<AuctionWinnerDto | null>(null)
  const [bidAmount, setBidAmount] = useState('')
  const [reactions, setReactions] = useState<string[]>([])

  // ✅ sessionId is always a real Guid here
  const live = useLiveSession({
    sessionId:   session.id,
    displayName: user?.displayName ?? 'Visitor',
    onFeaturedArtworkChanged: (artwork) => { setFeatured(artwork); setWinner(null); setBidAmount('') },
    onBidUpdated: (data) => {
      setFeatured(prev => prev ? { ...prev, topBid: data.amount, topBidder: data.bidderName } : prev)
    },
    onAuctionWinner: (w) => {
      setWinner(w)
      toast.success(`🏆 ${w.winnerName} won for $${w.winningBid.toLocaleString()}!`)
    },
    onBiddingClosed: () => toast('Bidding closed.'),
    onError: (msg) => toast.error(msg),
  })

  const handleBid = () => {
    const amount = parseFloat(bidAmount)
    if (!featured || isNaN(amount) || amount <= 0) { toast.error('Enter a valid bid amount'); return }
    live.placeBid(featured.artworkId, amount)
    setBidAmount('')
  }

  const handleReaction = (emoji: string) => {
    if (!featured) return
    live.sendReaction(featured.artworkId, emoji)
    setReactions(p => [...p.slice(-10), emoji])
    setTimeout(() => setReactions(p => p.slice(1)), 2000)
  }

  return (
    <div className="min-h-screen bg-stone-900 text-white">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-stone-800 border-b border-stone-700">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-900/50 text-red-400 text-xs font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" /> LIVE
          </span>
          <div>
            <p className="text-sm font-semibold">{session.title}</p>
            <p className="text-xs text-stone-400">by {session.artistName}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 text-xs text-stone-400">
          <span className="flex items-center gap-1"><UserGroupIcon className="w-3.5 h-3.5" /> {live.visitorCount}</span>
          <button onClick={() => navigate('/')} className="text-stone-400 hover:text-white">Leave</button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 h-[calc(100vh-52px)]">
        {/* Artwork area */}
        <div className="lg:col-span-2 flex flex-col items-center justify-center p-6 relative">
          {!featured ? (
            <div className="text-center text-stone-500">
              <p className="text-4xl mb-4">🎨</p>
              <p className="text-lg font-medium">Waiting for artist to start the auction…</p>
            </div>
          ) : (
            <div className="w-full max-w-lg">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl mb-5">
                <img src={featured.imageUrl} alt={featured.title} className="w-full aspect-square object-cover" />
                {featured.biddingOpen && (
                  <div className="absolute top-3 right-3 px-3 py-1 bg-green-500 rounded-full text-xs font-semibold animate-pulse">
                    Bidding Open
                  </div>
                )}
                <div className="absolute bottom-4 left-4 flex gap-2">
                  {reactions.map((r, i) => <span key={i} className="text-2xl animate-bounce">{r}</span>)}
                </div>
              </div>

              <h2 className="text-xl font-bold mb-1">{featured.title}</h2>

              <div className="flex items-end gap-6 mb-5">
                <div><p className="text-xs text-stone-400">Starting bid</p><p className="text-lg font-semibold text-stone-300">${featured.startingBid.toLocaleString()}</p></div>
                <div><p className="text-xs text-stone-400">Top bid</p><p className="text-2xl font-bold text-gallery-400">${featured.topBid.toLocaleString()}</p></div>
                {featured.topBidder && <div><p className="text-xs text-stone-400">Leading</p><p className="text-sm font-medium">{featured.topBidder}</p></div>}
                <div><p className="text-xs text-stone-400">Bids</p><p className="text-sm font-medium">{featured.totalBids}</p></div>
              </div>

              {winner && winner.artworkId === featured.artworkId && (
                <div className="bg-amber-500/20 border border-amber-500/30 rounded-xl p-4 mb-4 flex items-center gap-3">
                  <TrophyIcon className="w-6 h-6 text-amber-400 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-amber-300">Auction Closed!</p>
                    <p className="text-sm text-stone-300">
                      <span className="font-medium text-white">{winner.winnerName}</span> won for{' '}
                      <span className="font-bold text-amber-400">${winner.winningBid.toLocaleString()}</span>
                    </p>
                  </div>
                </div>
              )}

              {featured.biddingOpen && !winner && (
                <div className="flex gap-3">
                  <div className="relative flex-1">
                    <BanknotesIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                    <input
                      type="number" value={bidAmount} onChange={e => setBidAmount(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleBid()}
                      placeholder={`Min $${Math.max(featured.startingBid, featured.topBid + 1).toLocaleString()}`}
                      className="w-full bg-stone-800 border border-stone-600 rounded-xl pl-9 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gallery-500"
                    />
                  </div>
                  <button onClick={handleBid}
                    className="px-6 py-3 rounded-xl bg-gallery-600 text-white font-semibold hover:bg-gallery-700 transition-colors">
                    Place Bid
                  </button>
                </div>
              )}

              <div className="flex gap-3 mt-4 justify-center">
                {['❤️','😮','🔥','👏'].map(e => (
                  <button key={e} onClick={() => handleReaction(e)}
                    className="text-2xl hover:scale-125 transition-transform active:scale-90">{e}</button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Chat */}
        <div className="bg-stone-800 border-l border-stone-700 flex flex-col">
          <div className="p-3 border-b border-stone-700 text-sm font-medium text-stone-300">Live Chat</div>
          <div className="flex-1 overflow-hidden">
            <LiveChat messages={live.messages} onSend={live.sendMessage} />
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Root ──────────────────────────────────────────────────────────────────────
export default function LiveGalleryPage() {
  const { inviteCode }  = useParams<{ inviteCode?: string }>()
  const [searchParams]  = useSearchParams()
  const artistIdParam   = searchParams.get('artistId')

  const [session,  setSession]  = useState<LiveSessionDto | null>(null)
  const [joining,  setJoining]  = useState(false)

  const handleJoin = async (code: string) => {
    setJoining(true)
    try {
      const info = await liveApi.getSessionByCode(code)
      const full = await liveApi.getActiveSession(info.artistId)
      if (!full) { toast.error('Session not found'); return }
      setSession(full)
    } catch { toast.error('Invalid or expired invite code') }
    finally { setJoining(false) }
  }

  const handleJoinPublic = async (artistId: string) => {
    setJoining(true)
    try {
      const full = await liveApi.getActiveSession(artistId)
      if (!full) { toast.error('No active session'); return }
      if (full.isPrivate) { toast.error('This session is private — invite code required'); return }
      setSession(full)
    } catch { toast.error('Could not join session') }
    finally { setJoining(false) }
  }

  // Auto-join from URL params
  useEffect(() => {
    if (inviteCode) handleJoin(inviteCode)
    else if (artistIdParam) handleJoinPublic(artistIdParam)
  }, [inviteCode, artistIdParam]) // eslint-disable-line react-hooks/exhaustive-deps

  // ✅ ViewerPanel (with useLiveSession) only mounts after session is set
  if (session) return <ViewerPanel session={session} />

  return <JoinScreen onJoin={handleJoin} loading={joining} />
}