// src/hooks/useLiveSession.ts
import { useEffect, useRef, useState, useCallback } from 'react'
import * as signalR from '@microsoft/signalr'
import { useAuthStore } from '@/store/authStore'
import type { ChatMessage, FeaturedArtworkDto, AuctionWinnerDto } from '@/types/live'

interface UseLiveSessionOptions {
  sessionId: string
  displayName: string
  onFeaturedArtworkChanged?: (artwork: FeaturedArtworkDto) => void
  onBidUpdated?: (data: { artworkId: string; amount: number; bidderName: string }) => void
  onAuctionWinner?: (winner: AuctionWinnerDto) => void
  onBiddingClosed?: () => void
  onVisitorCountUpdated?: (count: number) => void
  onError?: (msg: string) => void
}

export function useLiveSession({
  sessionId,
  displayName,
  onFeaturedArtworkChanged,
  onBidUpdated,
  onAuctionWinner,
  onBiddingClosed,
  onVisitorCountUpdated,
  onError,
}: UseLiveSessionOptions) {
  const { accessToken: token } = useAuthStore()
  const connRef   = useRef<signalR.HubConnection | null>(null)
  const startedRef = useRef(false)  // prevents double-start in Strict Mode

  const [connected,    setConnected]    = useState(false)
  const [messages,     setMessages]     = useState<ChatMessage[]>([])
  const [visitorCount, setVisitorCount] = useState(0)

  // Keep latest callbacks in a ref — avoids re-running the effect on every render
  const cb = useRef({
    onFeaturedArtworkChanged, onBidUpdated, onAuctionWinner,
    onBiddingClosed, onVisitorCountUpdated, onError, displayName, sessionId,
  })
  useEffect(() => {
    cb.current = {
      onFeaturedArtworkChanged, onBidUpdated, onAuctionWinner,
      onBiddingClosed, onVisitorCountUpdated, onError, displayName, sessionId,
    }
  })

  useEffect(() => {
    if (!sessionId || !token) return
    if (startedRef.current) return   // skip second Strict Mode call
    startedRef.current = true

    const conn = new signalR.HubConnectionBuilder()
      .withUrl(
        `${import.meta.env.VITE_API_BASE_URL}/liveHub?access_token=${token}`,
        { skipNegotiation: true, transport: signalR.HttpTransportType.WebSockets }
      )
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Warning)
      .build()

    // ── Events — exact casing must match what the Hub sends ──────────────────
    conn.on('ChatHistory',            (h: ChatMessage[]) => setMessages(h))
    conn.on('NewChatMessage',         (m: ChatMessage)   => setMessages(p => [...p, m]))
    conn.on('VisitorCountUpdated',    (n: number) => {
      setVisitorCount(n); cb.current.onVisitorCountUpdated?.(n)
    })
    conn.on('UserJoined',             () => {})   // acknowledged — no UI needed
    conn.on('UserLeft',               () => {})
    conn.on('FeaturedArtworkChanged', (a: FeaturedArtworkDto) => cb.current.onFeaturedArtworkChanged?.(a))
    conn.on('BidUpdated',             (d: { artworkId: string; amount: number; bidderName: string }) =>
      cb.current.onBidUpdated?.(d))
    conn.on('AuctionWinner',          (w: AuctionWinnerDto) => cb.current.onAuctionWinner?.(w))
    conn.on('BiddingClosed',          () => cb.current.onBiddingClosed?.())
    conn.on('BidRejected',            (msg: string) => cb.current.onError?.(msg))
    conn.on('SessionError',                  (msg: string) => cb.current.onError?.(msg))
    conn.on('SessionEnded',           () => cb.current.onError?.('The artist has ended the session.'))

    connRef.current = conn

    conn.start()
      .then(() => {
        setConnected(true)
        conn.invoke('JoinSession', cb.current.sessionId, cb.current.displayName)
          .catch(e => console.error('JoinSession failed:', e))
      })
      .catch(e => console.error('SignalR connection failed:', e))

    return () => {
      startedRef.current = false
      setConnected(false)
      conn.invoke('LeaveSession', sessionId).catch(() => {}).finally(() => conn.stop())
      connRef.current = null
    }
  }, [sessionId, token]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Actions ───────────────────────────────────────────────────────────────
  const sendMessage = useCallback((message: string) =>
    connRef.current?.invoke('SendChatMessage', cb.current.sessionId, message), [])

  const placeBid = useCallback((artworkId: string, amount: number) =>
    connRef.current?.invoke('PlaceBid', cb.current.sessionId, artworkId, amount), [])

  const sendReaction = useCallback((artworkId: string, emoji: string) =>
    connRef.current?.invoke('SendReaction', cb.current.sessionId, artworkId, emoji), [])

  const setFeaturedArtwork = useCallback((artworkId: string, startingBid: number, bidDurationMin: number) =>
    connRef.current?.invoke('SetFeaturedArtwork', cb.current.sessionId, artworkId, startingBid, bidDurationMin), [])

  const closeBidding = useCallback(() =>
    connRef.current?.invoke('CloseBidding', cb.current.sessionId), [])

  const endSession = useCallback(() =>
    connRef.current?.invoke('EndSession', cb.current.sessionId), [])

  return { connected, messages, visitorCount, sendMessage, placeBid, sendReaction, setFeaturedArtwork, closeBidding, endSession }
}