import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  MagnifyingGlassIcon,
  PhotoIcon,
  AdjustmentsHorizontalIcon,
  SparklesIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline'
import { useInfiniteGalleries } from '@/hooks/useGallery'
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll'
import { ROUTES, PAGE_SIZE } from '@/utils/constants'
import { getInitials } from '@/utils/helpers'
import { SkeletonGrid } from '@/components/common/SkeletonGrid'
import type { ArtistGalleryInfo } from '@/types'
import Badge from '@/components/common/Badge'
import { useUserBadges } from '@/hooks/useBadges'
import RecentlyViewed from '@/components/recently/RecentlyViewed'

type SortKey = 'newest' | 'most-artworks' | 'alphabetical'
const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'newest', label: 'Newest first' },
  { value: 'most-artworks', label: 'Most artworks' },
  { value: 'alphabetical', label: 'A → Z' },
]

function sortGalleries(galleries: ArtistGalleryInfo[], sort: SortKey): ArtistGalleryInfo[] {
  return [...galleries].sort((a, b) => {
    if (sort === 'most-artworks') return b.artworkCount - a.artworkCount
    if (sort === 'alphabetical') return (a.galleryName ?? '').localeCompare(b.galleryName ?? '')
    return 0
  })
}

function ScrollToTop() {
  const [show, setShow] = useState(false)
  
  useEffect(() => {
    const handleScroll = () => setShow(window.scrollY > 500)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])
  
  if (!show) return null
  
  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className="fixed bottom-6 right-6 p-3 bg-gallery-600 text-white rounded-full shadow-lg hover:bg-gallery-700 transition-all z-50"
    >
      ↑
    </button>
  )
}

function HeroSection({ totalCount }: { totalCount: number | undefined }) {
  const navigate = useNavigate()

  return (
    <div className="relative bg-gradient-to-br from-stone-100 via-white to-purple-50 border-b border-stone-100 overflow-hidden">
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-gallery-100/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-purple-100/20 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm border border-gallery-200 text-gallery-700 text-xs font-semibold px-3 py-1.5 rounded-full shadow-sm mb-4">
            <SparklesIcon className="h-3.5 w-3.5" />
            Virtual Art Gallery
          </div>
          <h1 className="font-display text-4xl sm:text-5xl font-bold text-stone-900 mb-3 leading-tight">
            Discover <span className="text-gradient">Amazing Galleries</span>
          </h1>
          <p className="text-stone-500 text-base sm:text-lg leading-relaxed">
            {totalCount != null
              ? `Explore ${totalCount.toLocaleString()} unique galleries from artists around the world.`
              : 'Explore unique galleries from artists around the world.'}
          </p>
        </div>

        <div className="max-w-xl mx-auto relative">
          <div 
            onClick={() => navigate('/search')}
            className="flex items-center gap-3 bg-white rounded-2xl border border-stone-200 shadow-lg hover:shadow-xl hover:border-gallery-300 hover:scale-[1.02] transition-all duration-300 px-4 py-3 cursor-pointer group"
          >
            <MagnifyingGlassIcon className="h-5 w-5 text-stone-400 shrink-0 group-hover:text-gallery-500 transition-colors" />
            <span className="flex-1 text-stone-400 text-sm group-hover:text-stone-600 transition-colors">
              Search by gallery name, artist, or artwork...
            </span>
            <div className="flex items-center gap-1 text-stone-400 group-hover:text-gallery-500 transition-colors">
              <span className="text-xs">Advanced</span>
              <ChevronRightIcon className="h-4 w-4" />
            </div>
          </div>
          <p className="text-xs text-stone-400 text-center mt-2">
            🔍 Click to open advanced search with filters
          </p>
        </div>
      </div>
    </div>
  )
}

function GalleryCard({ gallery, index }: { gallery: ArtistGalleryInfo; index: number }) {
  const previews = gallery.featuredArtworks.slice(0, 3)
  const [avatarError, setAvatarError] = useState(false)
  const { data: badges } = useUserBadges(gallery.artistId)

  return (
    <Link
      to={ROUTES.GALLERY(gallery.artistId)}
      className="group block bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md border border-stone-100 hover:border-gallery-300 transition-all duration-300"
      style={{ animationDelay: `${Math.min(index * 50, 500)}ms` }}
    >
      <div className="aspect-[4/3] overflow-hidden relative bg-stone-100">
        {previews.length > 0 ? (
          <div className={`grid h-full gap-0.5 ${previews.length === 1 ? 'grid-cols-1' : previews.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
            {previews.map((aw, i) => (
              <div key={aw.id} className={`overflow-hidden ${i === 0 && previews.length === 3 ? 'col-span-2' : ''}`}>
                <img
                  src={aw.imageUrl}
                  alt={aw.title}
                  className="w-full h-full object-cover transition-opacity duration-200 group-hover:opacity-90"
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-stone-50">
            <PhotoIcon className="h-8 w-8 text-stone-300" />
            <span className="text-xs text-stone-400">No artworks yet</span>
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

        <div className="absolute top-3 left-3">
          <span className="bg-black/60 backdrop-blur-sm text-white text-[11px] font-semibold px-2.5 py-1 rounded-full">
            {gallery.artworkCount} {gallery.artworkCount === 1 ? 'work' : 'works'}
          </span>
        </div>

        <div className="absolute bottom-3 left-0 right-0 flex justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <span className="text-white text-xs font-medium bg-black/50 backdrop-blur-sm px-3 py-1 rounded-full">
            View Gallery
          </span>
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-center gap-2 mb-2">
          {gallery.profilePicUrl && !avatarError ? (
            <img
              src={gallery.profilePicUrl}
              alt={gallery.displayName ?? 'Artist'}
              className="w-8 h-8 rounded-full object-cover ring-1 ring-stone-200"
              onError={() => setAvatarError(true)}
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gallery-400 to-purple-500 flex items-center justify-center text-[10px] font-bold text-white">
              {getInitials(gallery.displayName)}
            </div>
          )}
          <p className="text-xs text-stone-500 truncate">
            {gallery.displayName ?? 'Unknown Artist'}
          </p>
        </div>

        <h3 className="font-semibold text-stone-800 text-base leading-tight mb-1 group-hover:text-gallery-600 transition-colors line-clamp-1">
          {gallery.galleryName ?? 'Untitled Gallery'}
        </h3>

        {badges && badges.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2 mb-2">
            {[...new Set(badges)].map((badge, idx) => (
              <Badge key={`${badge}-${idx}`} type={badge as any} size="sm" />
            ))}
          </div>
        )}

        {gallery.bio && (
          <p className="text-xs text-stone-400 line-clamp-2 leading-relaxed">
            {gallery.bio}
          </p>
        )}
      </div>
    </Link>
  )
}

export default function BrowseGalleriesPage() {
  const [sort, setSort] = useState<SortKey>('newest')
  const [showSort, setShowSort] = useState(false)

  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteGalleries(PAGE_SIZE)

  const loadMoreRef = useInfiniteScroll({
    hasMore: !!hasNextPage,
    isLoading: isFetchingNextPage,
    onLoadMore: fetchNextPage,
    threshold: 200,
  })

  const allGalleries = data?.pages.flatMap((page) => page.galleries) || []
  const totalCount = data?.pages[0]?.totalCount || 0
  const sortedGalleries = sortGalleries(allGalleries, sort)

  if (isLoading && allGalleries.length === 0) {
    return (
      <div className="min-h-screen bg-stone-50">
        <HeroSection totalCount={totalCount} />
        <div className="max-w-7xl mx-auto px-4 py-10">
          <SkeletonGrid count={PAGE_SIZE} variant="gallery" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <HeroSection totalCount={totalCount} />
      <RecentlyViewed />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-center justify-between mb-7">
          <div>
            <p className="text-stone-500 text-sm">
              {isLoading
                ? 'Loading galleries…'
                : `Showing ${sortedGalleries.length} of ${totalCount} galleries`}
            </p>
          </div>

          <div className="relative">
            <button
              onClick={() => setShowSort(!showSort)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-stone-200 rounded-xl text-sm font-medium text-stone-600 shadow-sm hover:border-gallery-300 hover:text-gallery-700 transition-all"
            >
              <AdjustmentsHorizontalIcon className="h-4 w-4" />
              {SORT_OPTIONS.find(o => o.value === sort)?.label}
            </button>

            {showSort && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowSort(false)} />
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl border border-stone-200 shadow-xl z-20 py-1.5 overflow-hidden">
                  {SORT_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => { setSort(opt.value); setShowSort(false) }}
                      className={[
                        'w-full text-left px-4 py-2.5 text-sm transition-colors',
                        sort === opt.value
                          ? 'bg-gallery-50 text-gallery-700 font-semibold'
                          : 'text-stone-600 hover:bg-stone-50',
                      ].join(' ')}
                    >
                      {opt.value === sort && <span className="mr-2">✓</span>}
                      {opt.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {sortedGalleries.length === 0 ? (
          <div className="text-center py-28">
            <div className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-stone-100 flex items-center justify-center">
              <PhotoIcon className="h-12 w-12 text-stone-300" />
            </div>
            <h3 className="text-xl font-bold text-stone-700 mb-2">No galleries yet</h3>
            <p className="text-stone-400 text-sm max-w-xs mx-auto leading-relaxed">
              Be the first to create a gallery and share your art with the world!
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {sortedGalleries.map((gallery, i) => (
                <GalleryCard key={gallery.artistId} gallery={gallery} index={i} />
              ))}
            </div>

            {isFetchingNextPage && (
              <div className="flex justify-center py-8">
                <div className="w-8 h-8 border-2 border-gallery-500 border-t-transparent rounded-full animate-spin" />
              </div>
            )}

            <div ref={loadMoreRef} className="h-4" />

            {!hasNextPage && allGalleries.length > 0 && (
              <p className="text-center text-stone-500 text-sm py-8">
                You've reached the end
              </p>
            )}
          </>
        )}
      </div>

      <ScrollToTop />
    </div>
  )
}