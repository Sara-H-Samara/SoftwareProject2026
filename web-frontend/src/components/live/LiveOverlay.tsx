// src/components/live/LiveOverlay.tsx
import { useState } from 'react'
import { XMarkIcon, ChatBubbleLeftIcon, HeartIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline'
import { LiveChat } from './LiveChat'
import { LiveReactions } from './LiveReactions'
import { LiveAuction } from './LiveAuction'
import type { LiveSessionDto } from '@/api/live.api'
import type { LiveState } from '@/hooks/useLiveSession'

interface LiveOverlayProps {
  session: LiveSessionDto
  liveState: LiveState
  onSendReaction: (emoji: string) => void
  onSendMessage: (message: string) => void
  onPlaceBid: (artworkId: string, amount: number) => void
  onClose: () => void
  isArtist?: boolean
}

type TabType = 'chat' | 'reactions' | 'auction'

export function LiveOverlay({
  session,
  liveState,
  onSendReaction,
  onSendMessage,
  onPlaceBid,
  onClose,
  isArtist
}: LiveOverlayProps) {
  const [activeTab, setActiveTab] = useState<TabType>('chat')
  const [isMinimized, setIsMinimized] = useState(false)

  if (isMinimized) {
    return (
      <button
        onClick={() => setIsMinimized(false)}
        className="fixed bottom-4 right-4 z-50 flex items-center gap-2 px-4 py-2 rounded-full bg-red-500 text-white shadow-lg hover:bg-red-600 transition-all animate-pulse"
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
        </span>
        <span className="text-sm font-medium">LIVE · {liveState.visitorCount}</span>
        <ChatBubbleLeftIcon className="w-4 h-4" />
      </button>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-red-500 to-purple-600 text-white">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
          </span>
          <span className="text-sm font-semibold">LIVE · {session.title}</span>
          <span className="text-xs opacity-80">({liveState.visitorCount})</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMinimized(true)}
            className="text-white/80 hover:text-white transition"
          >
            <span className="text-sm">_</span>
          </button>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white transition"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex-1 py-2 text-xs font-medium flex items-center justify-center gap-1 transition ${
            activeTab === 'chat'
              ? 'text-purple-600 border-b-2 border-purple-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <ChatBubbleLeftIcon className="w-3.5 h-3.5" />
          Chat
        </button>
        <button
          onClick={() => setActiveTab('reactions')}
          className={`flex-1 py-2 text-xs font-medium flex items-center justify-center gap-1 transition ${
            activeTab === 'reactions'
              ? 'text-purple-600 border-b-2 border-purple-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <HeartIcon className="w-3.5 h-3.5" />
          Reactions
        </button>
        <button
          onClick={() => setActiveTab('auction')}
          className={`flex-1 py-2 text-xs font-medium flex items-center justify-center gap-1 transition ${
            activeTab === 'auction'
              ? 'text-purple-600 border-b-2 border-purple-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <CurrencyDollarIcon className="w-3.5 h-3.5" />
          Auction
        </button>
      </div>

      {/* Content */}
      <div className="h-96">
        {activeTab === 'chat' && (
          <LiveChat
            messages={liveState.messages}
            onSend={onSendMessage}
            currentUserId={session.artistId}
            disabled={false}
          />
        )}
        {activeTab === 'reactions' && (
          <div className="p-4">
            <LiveReactions
              artworkId="general"
              reactions={liveState.reactions}
              onReact={onSendReaction}
            />
            <div className="mt-4 max-h-48 overflow-y-auto">
              {liveState.reactions.slice().reverse().map((r, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 py-1">
                  <span>{r.emoji}</span>
                  <span>{r.userId}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {activeTab === 'auction' && (
          <div className="p-4">
            <LiveAuction
              artworkId="featured"
              artworkTitle="Featured Artwork"
              currentBid={liveState.bids['featured'] ?? null}
              onPlaceBid={onPlaceBid}
              isArtist={isArtist}
            />
          </div>
        )}
      </div>
    </div>
  )
}