import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useCreateComment, useDeleteComment } from '@/hooks/useReviews';
import type { Comment } from '@/types';
import { formatDistanceToNow } from 'date-fns';
interface CommentItemProps {
  comment: Comment;
  depth?: number;
}

export default function CommentItem({ comment, depth = 0 }: CommentItemProps) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const { user } = useAuthStore();
  const { mutate: createComment } = useCreateComment();
  const { mutate: deleteComment } = useDeleteComment();

  const canModify = user?.id === comment.userId;
  const maxDepth = 5;

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim()) return;

    createComment(
      {
        parentCommentId: comment.id,
        content: replyContent.trim(),
      },
      {
        onSuccess: () => {
          setReplyContent('');
          setShowReplyForm(false);
        },
      }
    );
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this comment?')) {
      deleteComment(comment.id);
    }
  };

  return (
    <div className={`${depth > 0 ? 'ml-8 pl-4 border-l border-gray-700' : ''}`}>
      <div className="flex gap-3">
        {comment.userAvatar ? (
          <img
            src={comment.userAvatar}
            alt={comment.userName}
            className="w-8 h-8 rounded-full object-cover"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-white text-xs font-medium">
            {comment.userName.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="flex-1">
          <div className="bg-gray-800/50 rounded-lg p-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm text-white">{comment.userName}</span>
                <span className="text-xs text-gray-500">
                  {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                </span>
              </div>
              {canModify && (
                <button
                  onClick={handleDelete}
                  className="text-xs text-red-400 hover:text-red-300 transition-colors"
                >
                  Delete
                </button>
              )}
            </div>
            <p className="text-sm text-gray-300 mt-1">{comment.content}</p>
          </div>
          <div className="mt-1 ml-2">
            {depth < maxDepth && (
              <button
                onClick={() => setShowReplyForm(!showReplyForm)}
                className="text-xs text-gray-500 hover:text-purple-400 transition-colors"
              >
                {showReplyForm ? 'Cancel' : 'Reply'}
              </button>
            )}
          </div>
          {showReplyForm && depth < maxDepth && (
            <form onSubmit={handleReply} className="mt-2 ml-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="Write a reply..."
                  className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
                <button
                  type="submit"
                  disabled={!replyContent.trim()}
                  className="px-3 py-1.5 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
                >
                  Reply
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Nested replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-3">
          {comment.replies.map((reply) => (
            <CommentItem key={reply.id} comment={reply} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}