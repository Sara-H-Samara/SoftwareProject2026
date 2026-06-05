import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useCreateComment } from '@/hooks/useReviews';
import CommentItem from './CommentItem';
import type { Comment } from '@/types';

interface CommentSectionProps {
  artworkId?: string;
  reviewId?: string;
  comments: Comment[];
  onCommentAdded?: () => void;
}

export default function CommentSection({
  artworkId,
  reviewId,
  comments,
  onCommentAdded,
}: CommentSectionProps) {
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { isAuthenticated, user } = useAuthStore();
  const { mutate: createComment } = useCreateComment();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setIsSubmitting(true);
    createComment(
      {
        artworkId,
        reviewId,
        content: newComment.trim(),
      },
      {
        onSuccess: () => {
          setNewComment('');
          onCommentAdded?.();
        },
        onSettled: () => setIsSubmitting(false),
      }
    );
  };

  return (
    <div className="space-y-4">
      {/* Comment form */}
      {isAuthenticated && (
        <form onSubmit={handleSubmit} className="flex gap-3">
          {user?.profilePicUrl ? (
            <img
              src={user.profilePicUrl}
              alt={user.displayName || 'User'}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white text-sm font-medium">
              {user?.displayName?.charAt(0).toUpperCase() || 'U'}
            </div>
          )}
          <div className="flex-1">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a comment..."
              rows={2}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
            />
            <div className="flex justify-end mt-2">
              <button
                type="submit"
                disabled={!newComment.trim() || isSubmitting}
                className="px-3 py-1.5 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? 'Posting...' : 'Post Comment'}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Comments list */}
      {comments.length === 0 ? (
        <div className="text-center py-8 text-gray-500 text-sm">
          No comments yet. Be the first to comment!
        </div>
      ) : (
        <div className="space-y-3">
          {comments.map((comment) => (
            <CommentItem key={comment.id} comment={comment} />
          ))}
        </div>
      )}
    </div>
  );
}