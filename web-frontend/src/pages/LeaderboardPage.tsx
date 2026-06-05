import { Link } from 'react-router-dom';
import { TrophyIcon, FireIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import { useLeaderboard } from '@/hooks/useArtworkOfTheDay';
import { formatPrice } from '@/utils/helpers';

export default function LeaderboardPage() {
  const { data: artworks, isLoading } = useLeaderboard(20);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-stone-50 py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-48 bg-stone-200 rounded" />
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-20 bg-stone-200 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <Link to="/" className="inline-flex items-center gap-2 text-stone-500 hover:text-stone-700 mb-6">
          <ArrowLeftIcon className="w-4 h-4" />
          Back to Home
        </Link>

        <div className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden">
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-4">
            <div className="flex items-center gap-2">
              <TrophyIcon className="w-6 h-6 text-white" />
              <h1 className="text-xl font-bold text-white">Monthly Leaderboard</h1>
            </div>
            <p className="text-white/80 text-sm mt-1">Most voted artworks this month</p>
          </div>

          <div className="divide-y divide-stone-100">
            {!artworks || artworks.length === 0 ? (
              <div className="text-center py-12">
                <FireIcon className="w-12 h-12 text-stone-300 mx-auto mb-3" />
                <p className="text-stone-500">No votes yet this month. Be the first to vote!</p>
              </div>
            ) : (
              artworks.map((artwork, index) => (
                <Link
                  key={artwork.id}
                  to={`/artwork/${artwork.id}`}
                  className="flex items-center gap-4 p-4 hover:bg-stone-50 transition-colors group"
                >
                  <div className="w-12 text-center">
                    {index === 0 && <span className="text-3xl">🥇</span>}
                    {index === 1 && <span className="text-3xl">🥈</span>}
                    {index === 2 && <span className="text-3xl">🥉</span>}
                    {index > 2 && (
                      <span className="text-lg font-bold text-stone-400">#{index + 1}</span>
                    )}
                  </div>
                  
                  <img
                    src={artwork.imageUrl}
                    alt={artwork.title}
                    className="w-16 h-16 rounded-lg object-cover bg-stone-100"
                  />
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-stone-800 group-hover:text-gallery-600 truncate">
                      {artwork.title}
                    </h3>
                    <p className="text-sm text-stone-500 truncate">
                      by {artwork.artistName || 'Unknown Artist'}
                    </p>
                  </div>
                  
                  {artwork.price && artwork.price > 0 && (
                    <div className="text-right">
                      <p className="text-sm font-medium text-gallery-600">{formatPrice(artwork.price)}</p>
                    </div>
                  )}
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}