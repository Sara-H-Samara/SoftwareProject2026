import { View, Text, TextInput, TouchableOpacity, FlatList } from "react-native";
import { useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { useCreateComment } from "@/hooks/useReviews";
import { CommentItem } from "./CommentItem";
import type { Comment } from "@/types";
import { Ionicons } from "@expo/vector-icons";

interface CommentSectionProps {
  artworkId?: string;
  reviewId?: string;
  comments: Comment[];
  canComment?: boolean;
}

export function CommentSection({ artworkId, reviewId, comments ,canComment = true}: CommentSectionProps) {
  const { isAuthenticated } = useAuthStore();
  const { mutate: createComment, isPending } = useCreateComment();
  const [newComment, setNewComment] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);

  const handleSubmit = () => {
    if (!newComment.trim()) return;
    createComment(
      {
        artworkId,
        reviewId,
        parentCommentId: replyTo || undefined,
        content: newComment.trim(),
      },
      {
        onSuccess: () => {
          setNewComment("");
          setReplyTo(null);
        },
      }
    );
  };

  return (
    <View>
      {isAuthenticated && canComment &&(
        <View className="mb-4">
          {replyTo && (
            <View className="flex-row items-center justify-between bg-stone-100 px-3 py-2 rounded-t-lg">
              <Text className="text-xs text-stone-500">Replying to comment</Text>
              <TouchableOpacity onPress={() => setReplyTo(null)}>
                <Ionicons name="close-circle" size={16} color="#a8a29e" />
              </TouchableOpacity>
            </View>
          )}
          <TextInput
            className="bg-white border border-stone-200 rounded-xl px-4 py-3 text-stone-800"
            placeholder={replyTo ? "Write a reply..." : "Write a comment..."}
            value={newComment}
            onChangeText={setNewComment}
            multiline
            numberOfLines={3}
          />
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={!newComment.trim() || isPending}
            className={`mt-2 self-end px-4 py-2 rounded-lg ${!newComment.trim() ? "bg-stone-200" : "bg-gallery-600"}`}
          >
            <Text className="text-white text-sm font-medium">
              {isPending ? "Posting..." : replyTo ? "Reply" : "Comment"}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {comments.length === 0 ? (
        <Text className="text-stone-500 text-center py-4">No comments yet</Text>
      ) : (
        <FlatList
          data={comments}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          renderItem={({ item }) => (
            <CommentItem
              comment={item}
              onReply={canComment ? setReplyTo : undefined}
            />
          )}
        />
      )}
    </View>
  );
}