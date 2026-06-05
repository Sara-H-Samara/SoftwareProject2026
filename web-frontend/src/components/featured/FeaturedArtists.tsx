import { Link } from 'react-router-dom';
import { UserIcon, HeartIcon, StarIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import { useQuery } from '@tanstack/react-query';
import api from '@/api/axiosInstance';
import { formatNumber } from '@/utils/helpers';

interface TopArtist {
  id: string;
  displayName: string | null;
  galleryName: string | null;
  profilePicUrl: string | null;
  bio: string | null;
  artworkCount: number;
  followerCount: number;
  averageRating: number;
}

export default function FeaturedArtists() {
  const { data: artists, isLoading, error } = useQuery({
    queryKey: ['top-artists'],
    queryFn: async () => {
      const response = await api.get<TopArtist[]>('/api/users/top-artists?limit=6');
      return response.data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  if (isLoading) {
    return (
      <div className="mb-16">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-64 bg-gray-200 rounded mt-2 animate-pulse" />
          </div>
          <div className="h-8 w-24 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-6 animate-pulse shadow-card">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-full bg-gray-200" />
                <div className="flex-1">
                  <div className="h-5 w-32 bg-gray-200 rounded mb-2" />
                  <div className="h-4 w-24 bg-gray-200 rounded mb-2" />
                  <div className="flex gap-3 mt-2">
                    <div className="h-3 w-12 bg-gray-200 rounded" />
                    <div className="h-3 w-12 bg-gray-200 rounded" />
                    <div className="h-3 w-12 bg-gray-200 rounded" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error || !artists || artists.length === 0) {
    return null;
  }

  return (
    <div className="mb-16">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-stone-900">Featured Artists</h2>
          <p className="text-stone-500 text-sm mt-1">Discover the most talented creators</p>
        </div>
        <Link
          to="/browse"
          className="flex items-center gap-1 text-gallery-600 hover:text-gallery-700 text-sm font-medium transition-colors group"
        >
          View all
          <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {artists.map((artist) => (
          <Link
            key={artist.id}
            to={`/galleries/${artist.id}`}
            className="group bg-white rounded-2xl overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1"
          >
            <div className="p-6">
              <div className="flex items-start gap-4">
                {/* Avatar */}
                <div className="shrink-0">
                  {artist.profilePicUrl ? (
                    <img
                      src={artist.profilePicUrl}
                      alt={artist.displayName || 'Artist'}
                      className="w-16 h-16 rounded-full object-cover ring-2 ring-gallery-200 group-hover:ring-gallery-300 transition-all"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gallery-400 to-purple-500 flex items-center justify-center text-xl font-bold text-white shadow-md">
                      {artist.displayName?.charAt(0).toUpperCase() || 'A'}
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-stone-900 text-lg leading-tight group-hover:text-gallery-600 transition-colors truncate">
                    {artist.galleryName || artist.displayName || 'Untitled Gallery'}
                  </h3>
                  <p className="text-sm text-stone-500 mt-0.5 truncate">
                    by {artist.displayName || 'Unknown Artist'}
                  </p>

                  {/* Stats */}
                  <div className="flex items-center gap-3 mt-3">
                    <div className="flex items-center gap-1 text-xs text-stone-500">
                      <UserIcon className="w-3 h-3" />
                      <span>{formatNumber(artist.followerCount)}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-stone-500">
                      <HeartIcon className="w-3 h-3" />
                      <span>{formatNumber(artist.artworkCount)}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-stone-500">
                      <StarIcon className="w-3 h-3" />
                      <span>{artist.averageRating.toFixed(1)}</span>
                    </div>
                  </div>

                  {/* Bio */}
                  {artist.bio && (
                    <p className="text-xs text-stone-400 mt-2 line-clamp-2">
                      {artist.bio}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}