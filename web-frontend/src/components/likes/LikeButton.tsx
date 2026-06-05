import { HeartIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import { useAuthStore } from '@/store/authStore';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/utils/constants';
import { useLikeStatus, useToggleLike } from '@/hooks/useLikes';
import toast from 'react-hot-toast';

interface LikeButtonProps {
  artworkId: string;
  size?: 'sm' | 'md' | 'lg';
  showCount?: boolean;
}

const sizeClasses = {
  sm: 'w-3.5 h-3.5',
  md: 'w-4 h-4',
  lg: 'w-5 h-5',
};

export default function LikeButton({ artworkId, size = 'md', showCount = true }: LikeButtonProps) {
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const { data: likeStatus, isLoading: isLoadingStatus } = useLikeStatus(artworkId);
  const { mutate: toggleLike, isPending: isToggling } = useToggleLike();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      // ✅ toast + redirect بدل alert()
      toast.error('Please sign in to like artworks');
      navigate(ROUTES.LOGIN);
      return;
    }
    toggleLike(artworkId);
  };

  const isLoading = isLoadingStatus || isToggling;
  const isLiked = likeStatus?.isLiked ?? false;
  const likesCount = likeStatus?.likesCount ?? 0;

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className={`
        flex items-center gap-1.5 px-2 py-1 rounded-lg transition-all
        ${isLiked
          ? 'text-red-500 hover:text-red-600'
          : 'text-gray-400 hover:text-red-400 hover:bg-gray-100'
        }
        ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
      aria-label={isLiked ? 'Unlike' : 'Like'}
    >
      {isLoading ? (
        <div className={`${sizeClasses[size]} animate-pulse bg-gray-300 rounded-full`} />
      ) : isLiked ? (
        <HeartSolidIcon className={sizeClasses[size]} />
      ) : (
        <HeartIcon className={sizeClasses[size]} />
      )}
      {showCount && likesCount > 0 && (
        <span className="text-xs font-medium">{likesCount}</span>
      )}
    </button>
  );
}