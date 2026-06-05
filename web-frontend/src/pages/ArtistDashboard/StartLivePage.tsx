// src/pages/ArtistDashboard/StartLivePage.tsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { useMyArtworks } from '@/hooks/useArtworks'
import { liveApi } from '@/api/live.api'
import { useLiveSession } from '@/hooks/useLiveSession'
import type { LiveSessionDto, FeaturedArtworkDto, AuctionWinnerDto } from '@/types/live'
import toast from 'react-hot-toast'
import {
  VideoCameraIcon, StopIcon, UserGroupIcon, ClipboardDocumentIcon,
  PhotoIcon, BanknotesIcon, TrophyIcon, LockClosedIcon, GlobeAltIcon,
  LinkIcon,
} from '@heroicons/react/24/outline'

// ── Chat ──────────────────────────────────────────────────────────────────────
function LiveChat({ messages, onSend }: {
  messages: { userId: string; name: string; message: string; isArtist: boolean; isSystem: boolean; sentAt: string }[]
  onSend: (msg: string) => void
}) {
  const [text, setText] = useState('')
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto space-y-2 p-3 bg-stone-50 rounded-xl">
        {messages.length === 0 && (
          <p className="text-xs text-stone-400 text-center py-4">Chat will appear here</p>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`text-xs ${m.isSystem ? 'text-center' : ''}`}>
            {m.isSystem ? (
              <span className="text-stone-400 italic">{m.message}</span>
            ) : (
              <span>
                <span className={`font-semibold ${m.isArtist ? 'text-gallery-600' : 'text-stone-700'}`}>
                  {m.name}{m.isArtist ? ' 🎨' : ''}:
                </span>{' '}
                <span className="text-stone-600">{m.message}</span>
              </span>
            )}
          </div>
        ))}
      </div>
      <div className="flex gap-2 mt-2">
        <input
          value={text} onChange={e => setText(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && text.trim()) { onSend(text.trim()); setText('') } }}
          placeholder="Send a message…"
          className="flex-1 text-sm border border-stone-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-gallery-500"
        />
        <button
          onClick={() => { if (text.trim()) { onSend(text.trim()); setText('') } }}
          className="px-3 py-1.5 bg-gallery-600 text-white text-sm rounded-lg hover:bg-gallery-700"
        >Send</button>
      </div>
    </div>
  )
}

// ── Setup screen ──────────────────────────────────────────────────────────────
function SetupScreen({ onStart }: { onStart: (session: LiveSessionDto) => void }) {
  const [title,     setTitle]     = useState('')
  const [desc,      setDesc]      = useState('')
  const [maxV,      setMaxV]      = useState(50)
  const [duration,  setDuration]  = useState(60)
  const [isPrivate, setIsPrivate] = useState(false)
  const [starting,  setStarting]  = useState(false)

  const handleStart = async () => {
    if (!title.trim()) { toast.error('Add a title'); return }
    setStarting(true)
    try {
      const s = await liveApi.startSession({
        title, description: desc,
        maxVisitors: maxV, durationMinutes: duration, isPrivate,
      })
      toast.success('Live session started!')
      onStart(s)
    } catch { toast.error('Failed to start session') }
    finally { setStarting(false) }
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-10">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
          <VideoCameraIcon className="w-5 h-5 text-red-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-stone-800">Start Live Auction</h1>
          <p className="text-sm text-stone-500">Invite collectors to your private auction event</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-6 space-y-5">
        <div>
          <label className="text-sm font-medium text-stone-700 block mb-1.5">Session title *</label>
          <input value={title} onChange={e => setTitle(e.target.value)}
            placeholder="e.g. Limited Edition Summer Collection"
            className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gallery-500" />
        </div>

        <div>
          <label className="text-sm font-medium text-stone-700 block mb-1.5">Description</label>
          <textarea value={desc} onChange={e => setDesc(e.target.value)}
            rows={3} placeholder="What makes this auction special?"
            className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-gallery-500" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-stone-700 block mb-1.5">Max visitors</label>
            <input type="number" value={maxV} onChange={e => setMaxV(+e.target.value)}
              min={1} max={500}
              className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gallery-500" />
          </div>
          <div>
            <label className="text-sm font-medium text-stone-700 block mb-1.5">Duration (min)</label>
            <input type="number" value={duration} onChange={e => setDuration(+e.target.value)}
              min={5} max={480}
              className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gallery-500" />
          </div>
        </div>

        {/* Public / Private toggle */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setIsPrivate(false)}
            className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
              !isPrivate ? 'border-gallery-500 bg-gallery-50' : 'border-stone-200 bg-white'
            }`}
          >
            <GlobeAltIcon className={`w-5 h-5 ${!isPrivate ? 'text-gallery-600' : 'text-stone-400'}`} />
            <div className="text-left">
              <p className="text-sm font-medium text-stone-800">Public</p>
              <p className="text-xs text-stone-400">Anyone can join with link</p>
            </div>
          </button>
          <button
            onClick={() => setIsPrivate(true)}
            className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
              isPrivate ? 'border-gallery-500 bg-gallery-50' : 'border-stone-200 bg-white'
            }`}
          >
            <LockClosedIcon className={`w-5 h-5 ${isPrivate ? 'text-gallery-600' : 'text-stone-400'}`} />
            <div className="text-left">
              <p className="text-sm font-medium text-stone-800">Private</p>
              <p className="text-xs text-stone-400">Invite code required</p>
            </div>
          </button>
        </div>

        <button
          onClick={handleStart} disabled={starting || !title.trim()}
          className="w-full py-3 rounded-xl bg-red-500 text-white font-semibold hover:bg-red-600 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
        >
          <VideoCameraIcon className="w-5 h-5" />
          {starting ? 'Starting…' : 'Go Live'}
        </button>
      </div>
    </div>
  )
}

// ── Live control panel ────────────────────────────────────────────────────────
function LivePanel({ session, onEnd }: { session: LiveSessionDto; onEnd: () => void }) {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { data: artworks } = useMyArtworks()

  const [selectedArtworkId, setSelectedArtworkId] = useState('')
  const [startingBid,       setStartingBid]        = useState(0)
  const [bidDuration,       setBidDuration]         = useState(5)
  const [featured,          setFeatured]            = useState<FeaturedArtworkDto | null>(
    session.featuredArtwork ?? null
  )
  const [winner, setWinner] = useState<AuctionWinnerDto | null>(null)

  const live = useLiveSession({
    sessionId:   session.id,
    displayName: user?.displayName ?? 'Artist',
    onFeaturedArtworkChanged: setFeatured,
    onBidUpdated: (data) => {
      setFeatured(prev => prev ? { ...prev, topBid: data.amount, topBidder: data.bidderName } : prev)
    },
    onAuctionWinner: (w) => {
      setWinner(w)
      toast.success(`🏆 ${w.winnerName} won for $${w.winningBid.toLocaleString()}!`)
    },
    onBiddingClosed: () => toast('Bidding closed — no bids placed.'),
    onError: (msg) => toast.error(msg),
  })

  const handleSetFeatured = () => {
    if (!selectedArtworkId) { toast.error('Select an artwork'); return }
    live.setFeaturedArtwork(selectedArtworkId, startingBid, bidDuration)
    setWinner(null)
  }

  const handleEnd = () => {
    if (!confirm('End the live session?')) return
    live.endSession()
    onEnd()
    toast.success('Session ended')
    navigate('/dashboard')
  }

  // Public: copy direct link (no code needed)
  // Private: copy invite code link
  const copyShareLink = () => {
    const link = session.isPrivate
      ? `${window.location.origin}/live/join/${session.inviteCode}`
      : `${window.location.origin}/live/join?artistId=${session.artistId}`
    navigator.clipboard.writeText(link)
    toast.success('Link copied!')
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-100 text-red-600 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /> LIVE
          </span>
          <h1 className="text-lg font-bold text-stone-800">{session.title}</h1>
          {session.isPrivate
            ? <span className="flex items-center gap-1 text-xs text-stone-500 bg-stone-100 px-2 py-0.5 rounded-full"><LockClosedIcon className="w-3 h-3" /> Private</span>
            : <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full"><GlobeAltIcon className="w-3 h-3" /> Public</span>}
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-sm text-stone-500">
            <UserGroupIcon className="w-4 h-4" /> {live.visitorCount} viewers
          </span>
          <button onClick={handleEnd}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-colors">
            <StopIcon className="w-4 h-4" /> End Session
          </button>
        </div>
      </div>

      {/* Share section — different UI for public vs private */}
      {session.isPrivate ? (
        /* Private: show invite code prominently */
        <div className="bg-stone-800 text-white rounded-2xl p-4 mb-6 flex items-center justify-between">
          <div>
            <p className="text-xs text-stone-400 mb-1">Invite code — share with selected collectors</p>
            <p className="text-2xl font-bold tracking-widest font-mono">{session.inviteCode}</p>
          </div>
          <button onClick={copyShareLink}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-stone-700 hover:bg-stone-600 text-sm transition-colors">
            <ClipboardDocumentIcon className="w-4 h-4" /> Copy Link
          </button>
        </div>
      ) : (
        /* Public: show direct join link */
        <div className="bg-gallery-50 border border-gallery-200 rounded-2xl p-4 mb-6 flex items-center justify-between">
          <div>
            <p className="text-xs text-gallery-600 mb-1">Public session — anyone with this link can join</p>
            <p className="text-sm font-mono text-gallery-800 truncate max-w-md">
              {window.location.origin}/live/join?artistId={session.artistId}
            </p>
          </div>
          <button onClick={copyShareLink}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gallery-600 hover:bg-gallery-700 text-white text-sm transition-colors flex-shrink-0 ml-4">
            <LinkIcon className="w-4 h-4" /> Copy Link
          </button>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">

        {/* Auction control */}
        <div className="lg:col-span-2 space-y-5">

          {/* Featured artwork */}
          {featured && (
            <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
              <div className="flex gap-4 p-5">
                <img src={featured.imageUrl} alt={featured.title}
                  className="w-28 h-28 rounded-xl object-cover flex-shrink-0" />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-stone-800">{featured.title}</h3>
                    {featured.biddingOpen
                      ? <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">Bidding Open</span>
                      : <span className="text-xs px-2 py-0.5 rounded-full bg-stone-100 text-stone-500">Closed</span>}
                  </div>
                  <p className="text-xs text-stone-500 mb-3">Starting bid: ${featured.startingBid.toLocaleString()}</p>
                  <div className="flex items-end gap-4">
                    <div>
                      <p className="text-xs text-stone-400">Top bid</p>
                      <p className="text-xl font-bold text-gallery-600">${featured.topBid.toLocaleString()}</p>
                    </div>
                    {featured.topBidder && (
                      <div>
                        <p className="text-xs text-stone-400">By</p>
                        <p className="text-sm font-medium text-stone-700">{featured.topBidder}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-xs text-stone-400">Bids</p>
                      <p className="text-sm font-medium text-stone-700">{featured.totalBids}</p>
                    </div>
                  </div>
                </div>
              </div>
              {featured.biddingOpen && (
                <div className="border-t border-stone-100 px-5 py-3 flex justify-end">
                  <button onClick={() => live.closeBidding()}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 text-white text-sm font-medium hover:bg-amber-600 transition-colors">
                    <TrophyIcon className="w-4 h-4" /> Close Bidding & Declare Winner
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Winner */}
          {winner && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-center gap-4">
              <TrophyIcon className="w-8 h-8 text-amber-500 flex-shrink-0" />
              <div>
                <p className="font-semibold text-stone-800">🏆 Auction Winner!</p>
                <p className="text-sm text-stone-600">
                  <span className="font-medium">{winner.winnerName}</span> won{' '}
                  <span className="font-medium">"{winner.artworkTitle}"</span> for{' '}
                  <span className="font-bold text-gallery-600">${winner.winningBid.toLocaleString()}</span>
                </p>
              </div>
            </div>
          )}

          {/* Put artwork on auction */}
          <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5">
            <h3 className="font-semibold text-stone-800 mb-4 flex items-center gap-2">
              <PhotoIcon className="w-5 h-5 text-stone-400" /> Put Artwork on Auction
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-stone-700 block mb-1.5">Select artwork</label>
                <select value={selectedArtworkId} onChange={e => setSelectedArtworkId(e.target.value)}
                  className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gallery-500">
                  <option value="">— Choose artwork —</option>
                  {artworks?.map(a => (
                    <option key={a.id} value={a.id}>{a.title}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-stone-700 block mb-1.5">
                    <BanknotesIcon className="w-4 h-4 inline mr-1" /> Starting bid ($)
                  </label>
                  <input type="number" value={startingBid} onChange={e => setStartingBid(+e.target.value)}
                    min={0}
                    className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gallery-500" />
                </div>
                <div>
                  <label className="text-sm font-medium text-stone-700 block mb-1.5">Bid window (min)</label>
                  <input type="number" value={bidDuration} onChange={e => setBidDuration(+e.target.value)}
                    min={0} placeholder="0 = open-ended"
                    className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gallery-500" />
                </div>
              </div>
              <button onClick={handleSetFeatured} disabled={!selectedArtworkId}
                className="w-full py-2.5 rounded-xl bg-gallery-600 text-white text-sm font-medium hover:bg-gallery-700 disabled:opacity-50 transition-colors">
                Start Auction for This Artwork
              </button>
            </div>
          </div>
        </div>

        {/* Chat */}
        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-4 flex flex-col" style={{ height: 520 }}>
          <h3 className="font-semibold text-stone-800 mb-3 text-sm">Live Chat</h3>
          <div className="flex-1 overflow-hidden">
            <LiveChat messages={live.messages} onSend={live.sendMessage} />
          </div>
        </div>

      </div>
    </div>
  )
}

// ── Root ──────────────────────────────────────────────────────────────────────
export default function StartLivePage() {
  const { user } = useAuthStore()
  const [session,  setSession]  = useState<LiveSessionDto | null>(null)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    if (!user?.id) { setChecking(false); return }
    liveApi.getActiveSession(user.id)
      .then(s => { setSession(s); setChecking(false) })
      .catch(() => setChecking(false))
  }, [user?.id])

  if (checking) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 border-2 border-gallery-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!session) return <SetupScreen onStart={setSession} />
  return <LivePanel session={session} onEnd={() => setSession(null)} />
}