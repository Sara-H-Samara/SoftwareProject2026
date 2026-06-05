// src/pages/ArtworkDetailsPage.tsx
import { useState, useEffect, useCallback, useMemo } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { 
  ArrowLeftIcon, 
  HeartIcon, 
  StarIcon, 
  CalendarIcon, 
  TagIcon, 
  ExclamationTriangleIcon,
  CubeIcon 
} from '@heroicons/react/24/outline'
import { HeartIcon as HeartSolidIcon, StarIcon as StarSolidIcon } from '@heroicons/react/24/solid'
import { useArtwork } from '@/hooks/useArtworks'
import { useAuthStore } from '@/store/authStore'
import { useArtworkReviews, useCreateReview, useDeleteReview } from '@/hooks/useReviews'
import { useToggleLike, useLikeStatus } from '@/hooks/useLikes'
import Button from '@/components/common/Button'
import { SkeletonArtworkDetails } from '@/components/common/SkeletonDetails'
import { formatPrice } from '@/utils/helpers'
import AddToCartButton from '@/components/cart/AddToCartButton'
import ShareButton from '@/components/common/ShareButton'
import AddToCollectionButton from '@/components/collections/AddToCollectionButton'
import { Simple3DViewer } from '@/components/3d/Simple3DViewer'
import toast from 'react-hot-toast'
import { memo } from 'react'

const RatingStars = memo(function RatingStars({ 
  rating, 
  onRatingChange, 
  readonly = false, 
  size = 'md' 
}: { 
  rating: number; 
  onRatingChange?: (rating: number) => void; 
  readonly?: boolean; 
  size?: 'sm' | 'md' | 'lg' 
}) {
  const sizeClass = size === 'lg' ? 'w-8 h-8' : size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'
  
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          onClick={() => !readonly && onRatingChange?.(star)}
          disabled={readonly}
          className={`${readonly ? 'cursor-default' : 'cursor-pointer'} transition-transform hover:scale-110 focus:outline-none`}
          aria-label={`Rate ${star} star${star !== 1 ? 's' : ''}`}
        >
          {star <= rating ? (
            <StarSolidIcon className={`${sizeClass} text-amber-400`} />
          ) : (
            <StarIcon className={`${sizeClass} text-stone-300`} />
          )}
        </button>
      ))}
    </div>
  )
})

const LikeButton = memo(function LikeButton({ artworkId, size = 'md' }: { artworkId: string; size?: 'sm' | 'md' | 'lg' }) {
  const { isAuthenticated } = useAuthStore()
  const { data: likeStatus, refetch: refetchLike } = useLikeStatus(artworkId)
  const { mutate: toggleLike } = useToggleLike()
  
  const handleLike = useCallback(() => {
    if (!isAuthenticated) {
      toast.error('Please login to like artworks')
      return
    }
    toggleLike(artworkId, {
      onSuccess: () => refetchLike()
    })
  }, [artworkId, isAuthenticated, toggleLike, refetchLike])
  
  const sizeClass = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'
  const isLiked = likeStatus?.isLiked || false
  const likesCount = likeStatus?.likesCount || 0
  
  return (
    <button
      onClick={handleLike}
      className={`flex items-center gap-1.5 px-2 py-1 rounded-lg transition-all ${
        isLiked ? 'text-red-500' : 'text-stone-400 hover:text-red-400'
      }`}
      aria-label={isLiked ? 'Unlike' : 'Like'}
    >
      {isLiked ? (
        <HeartSolidIcon className={sizeClass} />
      ) : (
        <HeartIcon className={sizeClass} />
      )}
      {likesCount > 0 && <span className="text-xs font-medium">{likesCount}</span>}
    </button>
  )
})

const ReviewItem = memo(function ReviewItem({ review }: { review: any }) {
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-stone-100">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-gallery-100 flex items-center justify-center shrink-0">
          <span className="text-sm font-semibold text-gallery-700">
            {review.userName?.charAt(0).toUpperCase() || 'U'}
          </span>
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-medium text-stone-800">{review.userName}</p>
            <RatingStars rating={review.rating} readonly size="sm" />
          </div>
          {review.comment && (
            <p className="text-stone-600 text-sm mt-1 leading-relaxed">{review.comment}</p>
          )}
          <p className="text-xs text-stone-400 mt-2">
            {new Date(review.createdAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
        </div>
      </div>
    </div>
  )
})

const MetadataChip = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
  <div className="bg-white rounded-lg p-3 shadow-sm border border-stone-100">
    <div className="flex items-center gap-1.5 text-stone-500 mb-1">
      {icon}
      <span className="text-xs font-medium">{label}</span>
    </div>
    <p className="text-stone-800 text-sm font-medium truncate">{value}</p>
  </div>
)

const ArtworkNotFound = ({ onGoBack }: { onGoBack: () => void }) => (
  <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-4 bg-gradient-to-b from-stone-50 to-white">
    <div className="w-28 h-28 rounded-full bg-amber-100 flex items-center justify-center animate-pulse">
      <ExclamationTriangleIcon className="w-12 h-12 text-amber-500" />
    </div>
    <div className="text-center">
      <h1 className="text-3xl font-bold text-stone-800 mb-2">Artwork Not Found</h1>
      <p className="text-stone-500 max-w-md mx-auto">
        The artwork you're looking for may have been deleted or is no longer available.
      </p>
    </div>
    <div className="flex flex-wrap gap-3 justify-center">
      <button
        onClick={onGoBack}
        className="px-6 py-2.5 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50 transition-all flex items-center gap-2"
      >
        <ArrowLeftIcon className="w-4 h-4" />
        Go Back
      </button>
      <Link
        to="/galleries"
        className="px-6 py-2.5 rounded-xl bg-gallery-600 text-white hover:bg-gallery-700 transition-all"
      >
        Browse Galleries
      </Link>
    </div>
  </div>
)

export default function ArtworkDetailsPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuthStore()
  const [userRating, setUserRating] = useState(0)
  const [userComment, setUserComment] = useState('')
  const [show3DViewer, setShow3DViewer] = useState(false)
  
  const { data: artwork, isLoading: artworkLoading, error, isError } = useArtwork(id!)
  const { data: reviews, refetch: refetchReviews } = useArtworkReviews(id!)
  const { mutate: createReview, isPending: isSubmitting } = useCreateReview()
  const { mutate: deleteReview } = useDeleteReview()
  
  const averageRating = useMemo(() => {
    if (!reviews?.length) return 0
    return reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length
  }, [reviews])
  
  const reviewsCount = reviews?.length || 0
  
  const existingReview = useMemo(() => {
    if (!reviews || !user) return null
    return reviews.find((r: any) => r.userId === user.id)
  }, [reviews, user])
  
  const hasReviewed = !!existingReview
  

  useEffect(() => {
    if (existingReview) {
      setUserRating(existingReview.rating)
      setUserComment(existingReview.comment || '')
    }
  }, [existingReview])
  
  const handleSubmitReview = useCallback(() => {
    if (userRating === 0) {
      toast.error('Please select a rating')
      return
    }
    
    createReview({
      artworkId: id!,
      rating: userRating,
      comment: userComment.trim() || undefined,
    }, {
      onSuccess: () => {
        toast.success('Review submitted successfully!')
        refetchReviews()
        setUserRating(0)
        setUserComment('')
      },
      onError: () => {
        toast.error('Failed to submit review')
      }
    })
  }, [id, userRating, userComment, createReview, refetchReviews])
  
  const handleDeleteReview = useCallback(() => {
    if (existingReview?.id && confirm('Are you sure you want to delete your review?')) {
      deleteReview(existingReview.id, {
        onSuccess: () => {
          toast.success('Review deleted')
          refetchReviews()
          setUserRating(0)
          setUserComment('')
        },
        onError: () => {
          toast.error('Failed to delete review')
        }
      })
    }
  }, [existingReview, deleteReview, refetchReviews])
  
  const handleGoBack = useCallback(() => {
    navigate(-1)
  }, [navigate])
  
  if (artworkLoading) {
    return <SkeletonArtworkDetails />
  }
  
  if (isError || !artwork) {
    const isNotFound = error?.message?.includes('not found') || 
                       error?.message?.includes('404') ||
                       (error as any)?.response?.status === 404
    
    if (isNotFound) {
      return <ArtworkNotFound onGoBack={handleGoBack} />
    }
    
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4 bg-stone-50">
        <div className="text-center">
          <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">⚠️</span>
          </div>
          <h1 className="text-2xl font-bold text-stone-800 mb-2">Something went wrong</h1>
          <p className="text-stone-500 mb-6">{error?.message || 'Failed to load artwork'}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-gallery-600 text-white rounded-lg hover:bg-gallery-700"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }
  
  return (
    <>
      <div className="min-h-screen bg-stone-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {/* Back button */}
          <button
            onClick={handleGoBack}
            className="flex items-center gap-2 text-stone-500 hover:text-stone-700 mb-6 transition-colors group"
            aria-label="Go back"
          >
            <ArrowLeftIcon className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
            <span>Back</span>
          </button>
          
          {/* Artwork Content */}
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Image Section */}
            <div className="space-y-4">
              <div className="rounded-2xl overflow-hidden bg-white shadow-md border border-stone-100 relative group">
                <img
                  src={artwork.imageUrl}
                  alt={artwork.title}
                  className="w-full h-auto object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/placeholder-image.jpg'
                  }}
                />             
              </div>
            </div>
            
            {/* Details Section */}
            <div className="space-y-5">
              {/* Title & Artist */}
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-stone-800 leading-tight">
                  {artwork.title}
                </h1>
                <Link 
                  to={`/galleries/${artwork.artistId}`} 
                  className="text-gallery-600 hover:text-gallery-700 mt-2 inline-block text-sm font-medium transition-colors"
                >
                  by {artwork.artistName || 'Unknown Artist'}
                </Link>
              </div>

              {/* Rating and Actions */}
              <div className="flex flex-wrap items-center justify-between gap-3 py-4 border-t border-b border-stone-100">
                <div className="flex items-center gap-3">
                  <RatingStars rating={Math.round(averageRating)} readonly size="md" />
                  <span className="text-sm text-stone-500">
                    ({reviewsCount} {reviewsCount === 1 ? 'review' : 'reviews'})
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <LikeButton artworkId={artwork.id} size="md" />
                  <AddToCollectionButton artworkId={artwork.id} variant="icon" size="md" />
                  <ShareButton
                    title={artwork.title}
                    url={window.location.href}
                    description={artwork.description || ''}
                    variant="icon"
                    size="md"
                  />
                </div>
              </div>
              
              {/* Description */}
              {artwork.description && (
                <div className="bg-stone-100 rounded-xl p-4">
                  <h3 className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2">
                    Description
                  </h3>
                  <p className="text-stone-700 text-sm leading-relaxed">{artwork.description}</p>
                </div>
              )}
              
              {/* Metadata Grid */}
              <div className="grid grid-cols-2 gap-3">
                {artwork.dimensions && (
                  <MetadataChip 
                    icon={<span className="text-sm">📏</span>}
                    label="Dimensions"
                    value={artwork.dimensions}
                  />
                )}
                {artwork.materials && (
                  <MetadataChip 
                    icon={<span className="text-sm">🎨</span>}
                    label="Materials"
                    value={artwork.materials}
                  />
                )}
                {artwork.year && (
                  <MetadataChip 
                    icon={<CalendarIcon className="w-3.5 h-3.5" />}
                    label="Year"
                    value={String(artwork.year)}
                  />
                )}
                {artwork.price != null && artwork.price > 0 && (
                  <MetadataChip 
                    icon={<TagIcon className="w-3.5 h-3.5" />}
                    label="Price"
                    value={formatPrice(artwork.price)}
                  />
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 pt-2">
                {/* 3D View Button */}
                <button
                  onClick={() => setShow3DViewer(true)}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-gallery-600 to-gallery-700 text-white font-medium shadow-md hover:shadow-lg hover:from-gallery-700 hover:to-gallery-800 transition-all duration-300 transform hover:scale-[1.02]"
                >
                  <CubeIcon className="w-5 h-5" />
                  <span>View in 3D</span>
                </button>
                
                <AddToCartButton
                  artworkId={artwork.id}
                  title={artwork.title}
                  imageUrl={artwork.imageUrl}
                  artistName={artwork.artistName || 'Unknown Artist'}
                  price={artwork.price || 0}
                  size="lg"
                />
              </div>
            </div>
          </div>
          
          {/* Review Section */}
          <div className="mt-12">
            <h2 className="text-xl font-bold text-stone-800 mb-6">Reviews</h2>
            
            {/* Review Form */}
            {isAuthenticated && !hasReviewed && (
              <div className="mb-8 p-6 bg-white rounded-2xl shadow-sm border border-stone-100">
                <h3 className="text-lg font-semibold text-stone-800 mb-4">Write a Review</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-2">Your Rating</label>
                    <RatingStars
                      rating={userRating}
                      size="lg"
                      onRatingChange={setUserRating}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-2">
                      Your Review <span className="text-stone-400 font-normal">(Optional)</span>
                    </label>
                    <textarea
                      value={userComment}
                      onChange={(e) => setUserComment(e.target.value)}
                      rows={4}
                      maxLength={1000}
                      className="w-full border border-stone-200 rounded-xl px-4 py-3 text-stone-700 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-gallery-500 focus:border-transparent resize-none"
                      placeholder="Share your thoughts about this artwork..."
                    />
                    <p className="text-xs text-stone-400 text-right mt-1">
                      {userComment.length}/1000
                    </p>
                  </div>
                  <Button onClick={handleSubmitReview} isLoading={isSubmitting}>
                    Submit Review
                  </Button>
                </div>
              </div>
            )}
            
            {/* Already Reviewed Message */}
            {isAuthenticated && hasReviewed && (
              <div className="mb-8 p-4 bg-stone-100 rounded-xl text-center">
                <p className="text-stone-600">You've already reviewed this artwork.</p>
                <button
                  onClick={handleDeleteReview}
                  className="text-red-500 text-sm mt-2 hover:text-red-600 transition-colors"
                >
                  Delete my review
                </button>
              </div>
            )}
            
            {/* Reviews List */}
            {reviews && reviews.length > 0 ? (
              <div className="space-y-4">
                {reviews.map((review: any) => (
                  <ReviewItem key={review.id} review={review} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-white rounded-2xl border border-stone-100">
                <p className="text-stone-400">No reviews yet. Be the first to review!</p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* 3D Viewer Modal */}
      <Simple3DViewer
        isOpen={show3DViewer}
        onClose={() => setShow3DViewer(false)}
        imageUrl={artwork.imageUrl}
        title={artwork.title}
      />
    </>
  )
}