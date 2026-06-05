import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  SparklesIcon,
  HeartIcon,
  ArrowPathIcon,
  CalendarIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import { useArtworkOfTheDay, useVoteForArtwork, useArtworkVotes, useCanUserVote } from '@/hooks/useArtworkOfTheDay';
import { useAuthStore } from '@/store/authStore';
import { ROUTES } from '@/utils/constants';
import { formatPrice } from '@/utils/helpers';
import LikeButton from '@/components/likes/LikeButton';
import AddToCartButton from '@/components/cart/AddToCartButton';
import ShareButton from '@/components/common/ShareButton';
import toast from 'react-hot-toast';

export default function ArtworkOfTheDay() {
  const { data: artwork, isLoading, error, refetch } = useArtworkOfTheDay();
  const [isVoting, setIsVoting] = useState(false);
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const { data: canVoteData } = useCanUserVote();
  const { mutate: vote, isPending: isVotePending } = useVoteForArtwork(artwork?.id || '');
  const { data: votes, refetch: refetchVotes } = useArtworkVotes(artwork?.id || '');

  const canVote = canVoteData?.canVote ?? true;
  const isVoteLoading = isVoting || isVotePending;

  const handleVote = async () => {
    if (!isAuthenticated) {
      // ✅ toast + redirect بدل alert()
      toast.error('Please sign in to vote for your favorite artwork!');
      navigate(ROUTES.LOGIN);
      return;
    }

    if (!canVote) {
      // ✅ toast بدل alert()
      toast('You can only vote once per week. Come back next week! 🗓️', {
        icon: '⏰',
        duration: 4000,
      });
      return;
    }

    setIsVoting(true);
    vote(undefined, {
      onSuccess: () => {
        refetchVotes();
        refetch();
      },
      onSettled: () => setIsVoting(false),
    });
  };

  if (isLoading) return <ArtworkOfTheDaySkeleton />;

  if (error || !artwork) {
    return (
      <div className="bg-white rounded-2xl p-8 text-center border border-stone-100 shadow-sm">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-stone-100 flex items-center justify-center">
          <SparklesIcon className="w-8 h-8 text-stone-300" />
        </div>
        <h3 className="text-lg font-semibold text-stone-700 mb-2">No artwork featured yet</h3>
        <p className="text-stone-400 text-sm">Check back tomorrow for a new featured artwork!</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-card border border-stone-100 hover:shadow-card-hover transition-shadow">
      <div className="bg-gradient-to-r from-gallery-600 to-purple-600 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SparklesIcon className="w-5 h-5 text-white" />
          <span className="text-white font-semibold text-sm uppercase tracking-wider">Artwork of the Day</span>
        </div>
        <div className="flex items-center gap-1.5 text-white/80 text-xs">
          <CalendarIcon className="w-3.5 h-3.5" />
          <span>{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
        </div>
      </div>

      <div className="p-6">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Artwork Image */}
          <Link to={`/artwork/${artwork.id}`} className="md:w-48 shrink-0 group">
            <div className="aspect-square rounded-xl overflow-hidden bg-stone-100 shadow-sm group-hover:shadow-md transition-all">
              <img
                src={artwork.imageUrl}
                alt={artwork.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                onError={(e) => { (e.target as HTMLImageElement).src = '/default-artwork.jpg'; }}
              />
            </div>
          </Link>

          {/* Artwork Info */}
          <div className="flex-1">
            <Link to={`/artwork/${artwork.id}`} className="group">
              <h3 className="font-display text-xl font-bold text-stone-800 mb-1 group-hover:text-gallery-600 transition-colors">
                {artwork.title}
              </h3>
            </Link>

            <Link to={`/galleries/${artwork.artistId}`} className="text-gallery-500 text-sm hover:text-gallery-600 transition-colors font-medium">
              by {artwork.artistName || 'Unknown Artist'}
            </Link>

            {artwork.description && (
              <p className="text-stone-500 text-sm mt-3 line-clamp-2 leading-relaxed">
                {artwork.description}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-3 mt-3">
              {artwork.artworkType && (
                <span className="inline-flex items-center gap-1 text-xs text-stone-500 bg-stone-100 px-2.5 py-1 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-gallery-400" />
                  {artwork.artworkType}
                </span>
              )}
              {artwork.year && <span className="text-xs text-stone-400">📅 {artwork.year}</span>}
              {artwork.dimensions && <span className="text-xs text-stone-400">📐 {artwork.dimensions}</span>}
            </div>

            <div className="flex flex-wrap items-center gap-3 mt-4 pt-3 border-t border-stone-100">
              {artwork.price && artwork.price > 0 ? (
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-gallery-600">{formatPrice(artwork.price)}</span>
                  <span className="text-xs text-stone-400">USD</span>
                </div>
              ) : (
                <span className="text-sm text-stone-400">Not for sale</span>
              )}

              <div className="flex items-center gap-0.5">
                <LikeButton artworkId={artwork.id} size="sm" />
                <ShareButton
                  title={artwork.title}
                  url={`${window.location.origin}/artwork/${artwork.id}`}
                  description={artwork.description || undefined}
                  variant="icon"
                  size="sm"
                />
                {artwork.price && artwork.price > 0 && (
                  <AddToCartButton
                    artworkId={artwork.id}
                    title={artwork.title}
                    imageUrl={artwork.imageUrl}
                    artistName={artwork.artistName || 'Unknown Artist'}
                    price={artwork.price}
                    variant="icon"
                    size="sm"
                  />
                )}
              </div>
            </div>
          </div>

          {/* Vote Section */}
          <div className="md:w-48 shrink-0 bg-stone-50 rounded-xl p-4 text-center border border-stone-100">
            <div className="flex items-center justify-center gap-1 mb-2">
              <HeartSolidIcon className="w-5 h-5 text-red-400" />
              <span className="text-2xl font-bold text-stone-800">{votes ?? 0}</span>
              <span className="text-xs text-stone-400">votes</span>
            </div>

            <button
              onClick={handleVote}
              disabled={isVoteLoading || !canVote}
              className={`
                w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl
                font-medium text-sm transition-all
                ${canVote && !isVoteLoading
                  ? 'bg-gradient-to-r from-gallery-500 to-purple-600 text-white shadow-sm hover:shadow-md hover:from-gallery-600 hover:to-purple-700'
                  : 'bg-stone-200 text-stone-400 cursor-not-allowed'
                }
              `}
            >
              {isVoteLoading ? (
                <><ArrowPathIcon className="w-4 h-4 animate-spin" /> Voting...</>
              ) : canVote ? (
                <><HeartIcon className="w-4 h-4" /> Vote</>
              ) : (
                <><CheckIcon className="w-4 h-4" /> Voted</>
              )}
            </button>

            {!canVote && (
              <p className="text-xs text-stone-400 mt-2">Come back next week!</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ArtworkOfTheDaySkeleton() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-stone-100 shadow-sm animate-pulse">
      <div className="bg-gradient-to-r from-gallery-600 to-purple-600 px-6 py-3">
        <div className="h-4 w-32 bg-white/30 rounded" />
      </div>
      <div className="p-6">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="md:w-48 h-48 bg-stone-200 rounded-xl" />
          <div className="flex-1 space-y-3">
            <div className="h-6 w-48 bg-stone-200 rounded" />
            <div className="h-4 w-32 bg-stone-200 rounded" />
            <div className="h-16 w-full bg-stone-200 rounded" />
            <div className="h-12 w-32 bg-stone-200 rounded" />
          </div>
          <div className="md:w-48 h-24 bg-stone-200 rounded-xl" />
        </div>
      </div>
    </div>
  );
}