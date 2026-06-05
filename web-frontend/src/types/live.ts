// src/types/live.ts

export interface FeaturedArtworkDto {
  artworkId:   string
  title:       string
  imageUrl:    string
  startingBid: number
  topBid:      number
  topBidder:   string | null
  totalBids:   number
  biddingOpen: boolean
  bidEndsAt:   string | null
}

export interface LiveSessionDto {
  id:                  string
  artistId:            string
  artistName:          string
  title:               string
  description:         string | null
  maxVisitors:         number
  currentVisitorCount: number
  inviteCode:          string
  isPrivate:           boolean
  startedAt:           string
  endsAt:              string | null
  isActive:            boolean
  featuredArtwork:     FeaturedArtworkDto | null
}

export interface StartSessionRequest {
  title:           string
  description?:    string
  maxVisitors:     number
  durationMinutes: number
  isPrivate:       boolean
}

export interface SetFeaturedArtworkRequest {
  artworkId:      string
  startingBid:    number
  bidDurationMin: number
}

export interface AuctionStateDto {
  artworkId:     string
  topBidAmount:  number
  topBidderName: string
  totalBids:     number
}

export interface AuctionWinnerDto {
  artworkId:    string
  artworkTitle: string
  winnerId:     string
  winnerName:   string
  winningBid:   number
}

export interface ChatMessage {
  userId:   string
  name:     string
  message:  string
  sentAt:   string
  isArtist: boolean
  isSystem: boolean
}