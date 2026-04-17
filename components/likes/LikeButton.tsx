import { TouchableOpacity, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLikeStatus, useToggleLike } from "@/hooks/useLikes";
import { useAuthStore } from "@/store/authStore";

interface LikeButtonProps {
  artworkId: string;
  size?: "sm" | "md" | "lg";
  showCount?: boolean;
}

export function LikeButton({ artworkId, size = "md", showCount = true }: LikeButtonProps) {
  const { isAuthenticated } = useAuthStore();
  const { data: likeStatus } = useLikeStatus(artworkId);
  const { mutate: toggleLike } = useToggleLike();

  const handlePress = () => {
    console.log('❤️ LikeButton pressed, artworkId:', artworkId);
    if (!artworkId) {
      console.error('artworkId is undefined or empty');
      return;
    }
    if (!isAuthenticated) {
      alert("Please login to like artworks");
      return;
    }
    toggleLike(artworkId);
  };

  const isLiked = likeStatus?.isLiked ?? false;
  const likesCount = likeStatus?.likesCount ?? 0;
  const iconSizes = { sm: 18, md: 22, lg: 28 };
  const iconSize = iconSizes[size];

  return (
    <TouchableOpacity
      onPress={handlePress}
      className="flex-row items-center gap-1.5 px-2 py-1.5 rounded-lg"
    >
      <Ionicons
        name={isLiked ? "heart" : "heart-outline"}
        size={iconSize}
        color={isLiked ? "#ef4444" : "#a8a29e"}
      />
      {showCount && likesCount > 0 && (
        <Text className="text-sm text-stone-600">{likesCount}</Text>
      )}
    </TouchableOpacity>
  );
}