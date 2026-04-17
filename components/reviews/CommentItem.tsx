import { View, Text, Image, TouchableOpacity } from "react-native";
import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { useAuthStore } from "@/store/authStore";
import { useDeleteComment } from "@/hooks/useReviews";
import type { Comment } from "@/types";
import { Ionicons } from "@expo/vector-icons";

interface CommentItemProps {
  comment: Comment;
  depth?: number;
  onReply?: (commentId: string) => void;
}

export function CommentItem({ comment, depth = 0, onReply }: CommentItemProps) {
  const { user } = useAuthStore();
  const { mutate: deleteComment } = useDeleteComment();
  const [showReplies, setShowReplies] = useState(false);
  const canDelete = user?.id === comment.userId;

  return (
    <View className={`${depth > 0 ? "ml-8 pl-4 border-l border-stone-200" : ""} mb-3`}>
      <View className="flex-row gap-3">
        {comment.userAvatar ? (
          <Image source={{ uri: comment.userAvatar }} className="w-8 h-8 rounded-full" />
        ) : (
          <View className="w-8 h-8 rounded-full bg-gallery-200 items-center justify-center">
            <Text className="text-gallery-600 text-xs font-bold">
              {comment.userName?.charAt(0).toUpperCase() || "?"}
            </Text>
          </View>
        )}
        <View className="flex-1 bg-stone-50 rounded-xl p-3">
          <View className="flex-row justify-between items-center">
            <Text className="font-medium text-stone-800">{comment.userName}</Text>
            {canDelete && (
              <TouchableOpacity onPress={() => deleteComment(comment.id)}>
                <Ionicons name="trash-outline" size={14} color="#ef4444" />
              </TouchableOpacity>
            )}
          </View>
          <Text className="text-stone-600 text-sm mt-1">{comment.content}</Text>
          <View className="flex-row items-center gap-4 mt-2">
            <Text className="text-xs text-stone-400">
              {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
            </Text>
            {depth < 3 && onReply && (
              <TouchableOpacity onPress={() => onReply(comment.id)}>
                <Text className="text-xs text-gallery-600 font-medium">Reply</Text>
              </TouchableOpacity>
            )}
            {comment.repliesCount > 0 && (
              <TouchableOpacity onPress={() => setShowReplies(!showReplies)}>
                <Text className="text-xs text-stone-500">
                  {showReplies ? "Hide" : "View"} {comment.repliesCount} {comment.repliesCount === 1 ? "reply" : "replies"}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
      {showReplies && comment.replies && comment.replies.length > 0 && (
        <View className="mt-2">
          {comment.replies.map((reply) => (
            <CommentItem key={reply.id} comment={reply} depth={depth + 1} onReply={onReply} />
          ))}
        </View>
      )}
    </View>
  );
}