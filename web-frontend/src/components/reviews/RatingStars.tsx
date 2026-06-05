import { StarIcon } from '@heroicons/react/24/solid';
import { StarIcon as StarOutlineIcon } from '@heroicons/react/24/outline';

interface RatingStarsProps {
  rating: number;
  maxRating?: number;
  size?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
  onRatingChange?: (rating: number) => void;
  readonly?: boolean;
  isLoading?: boolean;
}

const sizeClasses = {
  sm: 'w-3.5 h-3.5',
  md: 'w-4 h-4',
  lg: 'w-6 h-6',
};

export default function RatingStars({
  rating,
  maxRating = 5,
  size = 'md',
  interactive = false,
  onRatingChange,
  readonly = false,
  isLoading = false,
}: RatingStarsProps) {
  const handleClick = (selectedRating: number) => {
    if (!interactive || readonly || isLoading) return;
    const newRating = selectedRating === rating ? 0 : selectedRating;
    onRatingChange?.(newRating);
  };

  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: maxRating }, (_, i) => i + 1).map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => handleClick(star)}
          disabled={!interactive || readonly || isLoading}
          className={`
            ${interactive && !readonly && !isLoading ? 'cursor-pointer hover:scale-110 transition-transform' : 'cursor-default'}
            ${readonly ? 'cursor-default' : ''}
            ${isLoading ? 'opacity-50' : ''}
          `}
          aria-label={`Rate ${star} star${star !== 1 ? 's' : ''}`}
        >
          {star <= rating ? (
            <StarIcon className={`${sizeClasses[size]} text-yellow-400`} />
          ) : (
            <StarOutlineIcon className={`${sizeClasses[size]} text-gray-300`} />
          )}
        </button>
      ))}
    </div>
  );
}