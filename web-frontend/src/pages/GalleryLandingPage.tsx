import { useState, useEffect, useCallback } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import {
  CubeIcon, PhotoIcon, ArrowLeftIcon, SwatchIcon,
  ShareIcon, CheckIcon, VideoCameraIcon,
} from '@heroicons/react/24/outline'
import { useArtistGallery, useArtistArtworks } from '@/hooks/useGallery'
import { useArtistStats } from '@/hooks/useFollows'
import { useAuthStore } from '@/store/authStore'
import { ROUTES } from '@/utils/constants'
import { formatPrice, getInitials } from '@/utils/helpers'
import { SkeletonGrid } from '@/components/common/SkeletonGrid'
import Button from '@/components/common/Button'
import FollowButton from '@/components/follows/FollowButton'
import LikeButton from '@/components/likes/LikeButton'
import RatingStars from '@/components/reviews/RatingStars'
import ShareButton from '@/components/common/ShareButton'
import { reviewsApi } from '@/api/reviews.api'
import { liveApi } from '@/api/live.api'
import type { Artwork } from '@/types'

const ALL = 'All'

function StatChip({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="flex flex-col items-center px-5 py-3">
      <span className="text-2xl font-bold text-stone-800 tabular-nums">{value}</span>
      <span className="text-xs text-stone-400 mt-0.5 uppercase tracking-wider font-medium">{label}</span>
    </div>
  )
}

function ArtworkCard({ artwork }: { artwork: Artwork }) {
  const [imgError, setImgError] = useState(false)
  const [averageRating, setAverageRating] = useState(0)

  useEffect(() => {
    let isMounted = true
    const fetchRating = async () => {
      try {
        const reviews = await reviewsApi.getArtworkReviews(artwork.id)
        if (isMounted) {
          if (reviews && Array.isArray(reviews) && reviews.length > 0) {
            const total = reviews.reduce((sum: number, r: any) => sum + (r.rating || 0), 0)
            setAverageRating(total / reviews.length)
          } else {
            setAverageRating(0)
          }
        }
      } catch {
        if (isMounted) setAverageRating(0)
      }
    }
    fetchRating()
    return () => { isMounted = false }
  }, [artwork.id])

  return (
    <Link
      to={`/artwork/${artwork.id}`}
      className="group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md border border-stone-100 hover:border-gallery-200 transition-all duration-300"
    >
      <div className="aspect-square overflow-hidden bg-stone-100 relative">
        {!imgError ? (
          <img src={artwork.imageUrl} alt={artwork.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={() => setImgError(true)} />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <PhotoIcon className="h-10 w-10 text-stone-300" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        {artwork.price != null && (
          <div className="absolute top-3 left-3">
            <span className="bg-white/90 backdrop-blur-sm text-gallery-700 text-xs font-bold px-2.5 py-1 rounded-full shadow-sm">
              {formatPrice(artwork.price)}
            </span>
          </div>
        )}
        <div className="absolute top-3 right-3">
          <span className="bg-black/50 backdrop-blur-sm text-white/80 text-[10px] font-medium px-2 py-0.5 rounded-full">
            {artwork.artworkType}
          </span>
        </div>
      </div>
      <div className="p-3.5">
        <p className="font-semibold text-stone-800 text-sm leading-tight truncate group-hover:text-gallery-600 transition-colors">
          {artwork.title}
        </p>
        <div className="flex items-center justify-between mt-1.5">
          <span className="text-xs text-stone-400">{artwork.artworkType}</span>
          {artwork.year && <span className="text-xs text-stone-400">{artwork.year}</span>}
        </div>
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-stone-100">
          <LikeButton artworkId={artwork.id} size="sm" showCount />
          <div className="flex items-center gap-1">
            <RatingStars rating={Math.round(averageRating)} size="sm" readonly />
            {averageRating === 0 && <span className="text-[10px] text-gray-400">(0)</span>}
          </div>
        </div>
      </div>
    </Link>
  )
}

export default function GalleryLandingPage() {
  const { artistId } = useParams<{ artistId: string }>()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [filter, setFilter] = useState(ALL)
  const [copied, setCopied] = useState(false)
  const [heroError, setHeroError] = useState(false)

  const { data: gallery, isLoading: gLoad, error: galleryError } = useArtistGallery(artistId!)
  const { data: artworks, isLoading: aLoad, error: artworksError } = useArtistArtworks(artistId!)
  const { data: stats, isLoading: statsLoad, refetch: refetchStats } = useArtistStats(artistId!)

  const handleFollowChange = useCallback(() => refetchStats(), [refetchStats])
  const isLoading = gLoad || aLoad || statsLoad
  const isOwnGallery = user?.id === artistId

  // ── Check if artist has an active public live session ─────────────────────
  const [hasLiveSession, setHasLiveSession] = useState(false)
  useEffect(() => {
  if (!artistId) return
  const check = () => {
    liveApi.getActiveSession(artistId)
      .then(s => setHasLiveSession(!!s && !s.isPrivate))
      .catch(() => setHasLiveSession(false))
  }
  check()
  const interval = setInterval(check, 15000)
  return () => clearInterval(interval)
}, [artistId])

  const isNotFound = galleryError || artworksError || (!isLoading && !gallery)

  if (isNotFound) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center gap-4 text-center px-4 bg-stone-50">
        <div className="w-20 h-20 rounded-full bg-stone-100 flex items-center justify-center">
          <PhotoIcon className="h-10 w-10 text-stone-300" />
        </div>
        <h1 className="text-2xl font-bold text-stone-800 mb-2">Gallery not found</h1>
        <p className="text-stone-500 text-sm max-w-xs">The gallery you're looking for doesn't exist or has been removed.</p>
        <div className="flex gap-3 mt-4">
          <button onClick={() => navigate(-1)} className="px-4 py-2 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50 transition-colors">← Go Back</button>
          <Link to={ROUTES.BROWSE_GALLERIES}><Button variant="secondary" size="md">Browse Galleries</Button></Link>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-stone-50">
        <div className="h-72 bg-gradient-to-br from-stone-200 to-stone-300 animate-pulse" />
        <div className="max-w-6xl mx-auto px-4 -mt-16">
          <div className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden mb-8">
            <div className="p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row gap-6">
                <div className="w-28 h-28 rounded-full bg-stone-200 animate-pulse" />
                <div className="flex-1 space-y-3">
                  <div className="h-8 w-48 bg-stone-200 rounded animate-pulse" />
                  <div className="h-4 w-32 bg-stone-200 rounded animate-pulse" />
                  <div className="h-16 w-full bg-stone-200 rounded animate-pulse" />
                </div>
              </div>
            </div>
          </div>
          <SkeletonGrid count={8} variant="artwork" />
        </div>
      </div>
    )
  }

  if (!gallery) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center gap-4 text-center px-4 bg-stone-50">
        <div className="w-20 h-20 rounded-full bg-stone-100 flex items-center justify-center">
          <PhotoIcon className="h-10 w-10 text-stone-300" />
        </div>
        <h1 className="text-2xl font-bold text-stone-800 mb-2">Gallery not found</h1>
        <p className="text-stone-500 text-sm max-w-xs">This gallery doesn't exist or the artist hasn't published anything yet.</p>
        <Link to={ROUTES.BROWSE_GALLERIES}><Button variant="secondary" size="md">← Browse all galleries</Button></Link>
      </div>
    )
  }

  const artworkList = artworks ?? []
  const types = [ALL, ...Array.from(new Set(artworkList.map(a => a.artworkType)))]
  const filtered = filter === ALL ? artworkList : artworkList.filter(a => a.artworkType === filter)
  const heroImages = artworkList.slice(0, 8)

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Hero */}
      <section className="relative h-64 sm:h-80 lg:h-96 overflow-hidden">
        {heroImages.length > 0 && !heroError ? (
          <div className={`absolute inset-0 grid gap-0.5 ${heroImages.length >= 6 ? 'grid-cols-4 sm:grid-cols-8' : 'grid-cols-3'}`}>
            {heroImages.map(artwork => (
              <img key={artwork.id} src={artwork.imageUrl} alt="" className="object-cover w-full h-full" onError={() => setHeroError(true)} />
            ))}
          </div>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-gallery-100 via-purple-50 to-gallery-200" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-stone-50 via-stone-50/60 to-transparent" />
        <div className="absolute top-5 left-5 z-10">
          <Link to={ROUTES.BROWSE_GALLERIES} className="inline-flex items-center gap-2 text-sm text-stone-600 bg-white/80 backdrop-blur-sm hover:bg-white border border-stone-200 px-4 py-2 rounded-full shadow-sm transition-all">
            <ArrowLeftIcon className="h-4 w-4" /> All Galleries
          </Link>
        </div>
        <div className="absolute top-5 right-5 z-10">
          <button onClick={handleShare} className="inline-flex items-center gap-2 text-sm text-stone-600 bg-white/80 backdrop-blur-sm hover:bg-white border border-stone-200 px-4 py-2 rounded-full shadow-sm transition-all">
            {copied ? <><CheckIcon className="h-4 w-4 text-green-500" /> Copied!</> : <><ShareIcon className="h-4 w-4" /> Share</>}
          </button>
        </div>
      </section>

      {/* Profile Card */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative -mt-16 z-10">
          <div className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden">
            <div className="p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row gap-6 sm:items-end">
                <div className="shrink-0">
                  {gallery.profilePicUrl ? (
                    <img src={gallery.profilePicUrl} alt={gallery.displayName ?? 'Artist'}
                      className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover ring-4 ring-white shadow-md" />
                  ) : (
                    <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-br from-gallery-500 to-purple-600 ring-4 ring-white shadow-md flex items-center justify-center text-3xl font-bold text-white">
                      {getInitials(gallery.displayName)}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="inline-flex items-center gap-1.5 bg-gallery-50 text-gallery-700 text-xs font-semibold px-3 py-1 rounded-full border border-gallery-200 mb-3">
                    <SwatchIcon className="h-3.5 w-3.5" /> Virtual Art Gallery
                  </span>
                  <h1 className="font-display text-2xl sm:text-3xl font-bold text-stone-800 leading-tight mb-1">
                    {gallery.galleryName ?? 'Untitled Gallery'}
                  </h1>
                  <p className="text-gallery-600 font-medium text-sm mb-3">by {gallery.displayName ?? 'Unknown Artist'}</p>
                  {gallery.bio && <p className="text-stone-500 text-sm leading-relaxed max-w-2xl">{gallery.bio}</p>}
                </div>

                <div className="shrink-0 flex flex-col gap-2.5 sm:items-end">
                  {/* Artist: Go Live button */}
                  {isOwnGallery && (
                    <Link to="/dashboard/start-live">
                      <Button size="lg" variant="secondary"
                        leftIcon={<VideoCameraIcon className="h-5 w-5" />}
                        className="w-full sm:w-auto bg-gradient-to-r from-red-500 to-red-600 text-white border-none hover:from-red-600 hover:to-red-700">
                        <span className="relative flex h-2 w-2 mr-1">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
                        </span>
                        Go Live
                      </Button>
                    </Link>
                  )}

                  {/* Visitor: Watch Live — only when artist has active public session */}
{hasLiveSession && !isOwnGallery && (
                    <Link to={`/live/join?artistId=${artistId}`}>
                      <Button size="lg" variant="secondary"
                        leftIcon={<VideoCameraIcon className="h-5 w-5" />}
                        className="w-full sm:w-auto bg-red-50 text-red-600 border-red-200 hover:bg-red-100">
                        <span className="relative flex h-2 w-2 mr-1">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                        </span>
                        Watch Live
                      </Button>
                    </Link>
                  )}

                  <Link to={ROUTES.VIRTUAL_GALLERY(artistId!)}>
                    <Button size="lg" leftIcon={<CubeIcon className="h-5 w-5" />} className="w-full sm:w-auto">
                      Enter 3D Gallery
                    </Button>
                  </Link>

                  {!isOwnGallery && (
                    <FollowButton artistId={artistId!} size="md" variant="outline" onFollowChange={handleFollowChange} />
                  )}
                </div>
              </div>
            </div>

            <div className="border-t border-stone-100 bg-stone-10">
              <div className="flex divide-x divide-stone-100 overflow-x-auto">
                <StatChip value={stats?.totalArtworks ?? gallery.artworkCount} label="Artworks" />
                <StatChip value={stats?.totalLikes ?? 0} label="Likes" />
                <StatChip value={stats?.totalFollowers ?? 0} label="Followers" />
                <StatChip value={stats?.averageRating.toFixed(1) ?? '—'} label="Rating" />
              </div>
            </div>
          </div>
        </div>

        {/* Artworks */}
        <div className="mt-12 pb-20">
          {artworkList.length > 0 ? (
            <>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-stone-800">Collection</h2>
                  <p className="text-stone-400 text-sm mt-0.5">
                    {filtered.length} {filtered.length === 1 ? 'artwork' : 'artworks'}
                    {filter !== ALL && ` · ${filter}`}
                  </p>
                </div>
                {types.length > 2 && (
                  <div className="flex flex-wrap gap-2">
                    {types.map(type => (
                      <button key={type} onClick={() => setFilter(type)}
                        className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                          filter === type
                            ? 'bg-gallery-600 text-white shadow-sm'
                            : 'bg-white text-stone-500 border border-stone-200 hover:border-gallery-300 hover:text-gallery-600'
                        }`}>
                        {type}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {filtered.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {filtered.map((artwork, index) => (
                    <div key={artwork.id} className="animate-fade-in" style={{ animationDelay: `${Math.min(index * 40, 400)}ms` }}>
                      <ArtworkCard artwork={artwork} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <p className="text-stone-400">No {filter} artworks in this gallery.</p>
                  <button onClick={() => setFilter(ALL)} className="text-gallery-600 text-sm font-medium mt-2 hover:text-gallery-700">
                    Show all artworks
                  </button>
                </div>
              )}

              <div className="mt-14 rounded-2xl overflow-hidden relative">
                {artworkList[0] && <img src={artworkList[0].imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />}
                <div className="absolute inset-0 bg-gradient-to-r from-stone-900/80 to-stone-900/60" />
                <div className="relative z-10 p-8 sm:p-12 flex flex-col sm:flex-row items-center justify-between gap-6">
                  <div>
                    <h3 className="text-2xl sm:text-3xl font-bold text-white mb-2">Experience the full gallery</h3>
                    <p className="text-white/70 text-sm">Walk through a beautifully lit 3D space and view every artwork up close.</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <ShareButton
                      title={gallery.galleryName || 'Virtual Art Gallery'}
                      url={window.location.href}
                      description={gallery.bio || `Explore ${gallery.displayName}'s virtual art gallery`}
                      variant="button" size="md"
                    />
                    <Link to={ROUTES.VIRTUAL_GALLERY(artistId!)}>
                      <Button size="lg" leftIcon={<CubeIcon className="h-5 w-5" />} className="bg-white text-stone-800 hover:bg-stone-50">
                        Enter 3D Gallery
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-24">
              <div className="w-20 h-20 mx-auto mb-5 rounded-full bg-stone-100 flex items-center justify-center">
                <PhotoIcon className="h-10 w-10 text-stone-300" />
              </div>
              <h3 className="text-lg font-semibold text-stone-600 mb-1">No artworks yet</h3>
              <p className="text-stone-400 text-sm">This artist hasn't published any artworks yet. Check back soon!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}