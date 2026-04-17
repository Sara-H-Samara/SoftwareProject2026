import { TouchableOpacity, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFollowStatus, useToggleFollow } from "@/hooks/useFollows";
import { useAuthStore } from "@/store/authStore";

interface FollowButtonProps {
  artistId: string;
  size?: "sm" | "md" | "lg";
  showCount?: boolean;
}

export function FollowButton({ artistId, size = "md", showCount = true }: FollowButtonProps) {
  const { user } = useAuthStore();
  const { data: followStatus } = useFollowStatus(artistId);
  const { mutate: toggleFollow } = useToggleFollow();

  if (user?.id === artistId) return null;

  const handlePress = () => {
    if (!user) {
      alert("Please login to follow artists");
      return;
    }
    toggleFollow(artistId);
  };

  const isFollowing = followStatus?.isFollowing ?? false;
  const followersCount = followStatus?.followersCount ?? 0;

  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-5 py-2.5 text-base",
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      className={`rounded-xl flex-row items-center gap-1.5 ${
        isFollowing ? "bg-stone-200" : "bg-gallery-600"
      } ${sizes[size]}`}
    >
      <Ionicons
        name={isFollowing ? "person-remove-outline" : "person-add-outline"}
        size={size === "sm" ? 16 : 18}
        color={isFollowing ? "#44403c" : "white"}
      />
      <Text className={`font-medium ${isFollowing ? "text-stone-700" : "text-white"}`}>
        {isFollowing ? "Following" : "Follow"}
      </Text>
      {showCount && followersCount > 0 && (
        <Text className={`text-xs ${isFollowing ? "text-stone-500" : "text-white/80"}`}>
          {followersCount}
        </Text>
      )}
    </TouchableOpacity>
  );
}