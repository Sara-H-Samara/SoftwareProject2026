import { Link } from 'react-router-dom';
import { PhotoIcon } from '@heroicons/react/24/outline';
import { formatPrice } from '@/utils/helpers';
import type { Artwork } from '@/types';
import { useState } from 'react';

interface ArtworkCardProps {
  artwork: Artwork;
}

export default function ArtworkCard({ artwork }: ArtworkCardProps) {
  const [imgError, setImgError] = useState(false);

  return (
    <Link
      to={`/artwork/${artwork.id}`}
      className="group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg 
                 border border-stone-100 hover:border-gallery-200 
                 hover:-translate-y-0.5 transition-all duration-300 block"
    >
      <div className="aspect-square overflow-hidden bg-stone-50 relative">
        {!imgError ? (
          <img
            src={artwork.imageUrl}
            alt={artwork.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <PhotoIcon className="h-12 w-12 text-stone-300" />
          </div>
        )}
        
        {/* Price badge */}
        {artwork.price != null && (
          <div className="absolute top-3 left-3">
            <span className="bg-white/90 backdrop-blur-sm text-gallery-700 text-xs font-bold
                             px-2.5 py-1 rounded-full border border-gallery-200 shadow-sm">
              {formatPrice(artwork.price)}
            </span>
          </div>
        )}
        
        {/* Type badge */}
        <div className="absolute top-3 right-3">
          <span className="bg-black/50 backdrop-blur-sm text-white/80 text-[10px] font-medium
                           px-2 py-0.5 rounded-full">
            {artwork.artworkType}
          </span>
        </div>
      </div>
      
      <div className="p-3">
        <h3 className="font-medium text-stone-800 text-sm truncate group-hover:text-gallery-600">
          {artwork.title}
        </h3>
        <p className="text-xs text-stone-400 mt-1">
          by {artwork.artistName || 'Unknown Artist'}
        </p>
      </div>
    </Link>
  );
}