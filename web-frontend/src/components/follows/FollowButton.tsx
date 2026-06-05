import { UserPlusIcon, UserMinusIcon } from '@heroicons/react/24/outline';
import { useFollowStatus, useToggleFollow } from '@/hooks/useFollows';
import { useAuthStore } from '@/store/authStore';

interface FollowButtonProps {
  artistId: string;
  size?: 'sm' | 'md' | 'lg';
  showCount?: boolean;
  variant?: 'default' | 'outline';
  onFollowChange?: () => void; 
}

const sizeClasses = {
  sm: 'text-xs px-2 py-1 gap-1',
  md: 'text-sm px-3 py-1.5 gap-1.5',
  lg: 'text-base px-4 py-2 gap-2',
};

const iconSizeClasses = {
  sm: 'w-3 h-3',
  md: 'w-4 h-4',
  lg: 'w-5 h-5',
};

export default function FollowButton({
  artistId,
  size = 'md',
  showCount = true,
  variant = 'default',
  onFollowChange 

}: FollowButtonProps) {
  const { user, isAuthenticated } = useAuthStore();
  const { data: followStatus, isLoading: isLoadingStatus } = useFollowStatus(artistId);
  const { mutate: toggleFollow, isPending: isToggling } = useToggleFollow();

  // Can't follow yourself
  const isSelf = user?.id === artistId;
  const handleClick = () => {
    if (!isAuthenticated || isSelf) return;
    toggleFollow(artistId, {
      onSuccess: () => {
        onFollowChange?.()  
      }
    });
  };

  const isLoading = isLoadingStatus || isToggling;
  const isFollowing = followStatus?.isFollowing ?? false;
  const followersCount = followStatus?.followersCount ?? 0;

  if (isSelf) return null;

  const baseClasses = `
    inline-flex items-center justify-center font-medium rounded-lg transition-all
    ${sizeClasses[size]}
    ${isFollowing 
      ? variant === 'default' 
        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
        : 'border border-gray-600 text-gray-400 hover:bg-gray-800'
      : variant === 'default'
        ? 'bg-purple-600 text-white hover:bg-purple-700'
        : 'border border-purple-500 text-purple-400 hover:bg-purple-950'
    }
    ${!isAuthenticated || isSelf ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
  `;

  return (
    <button
      onClick={handleClick}
      disabled={isLoading || !isAuthenticated || isSelf}
      className={baseClasses}
      aria-label={isFollowing ? 'Unfollow' : 'Follow'}
    >
      {isLoading ? (
        <div className={`${iconSizeClasses[size]} animate-spin rounded-full border-2 border-current border-t-transparent`} />
      ) : isFollowing ? (
        <UserMinusIcon className={iconSizeClasses[size]} />
      ) : (
        <UserPlusIcon className={iconSizeClasses[size]} />
      )}
      <span>{isFollowing ? 'Following' : 'Follow'}</span>
      {showCount && followersCount > 0 && (
        <span className="ml-1 text-xs opacity-75">{followersCount}</span>
      )}
    </button>
  );
}