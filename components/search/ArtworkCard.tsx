import { View, Text, Image, TouchableOpacity } from "react-native";
import { Link } from "expo-router";
import { formatPrice } from "@/utils/helpers";
import type { Artwork } from "@/types";

interface ArtworkCardProps {
  artwork: Artwork;
}

export function ArtworkCard({ artwork }: ArtworkCardProps) {
  return (
    <Link href={`/artwork/${artwork.id}`} asChild>
      <TouchableOpacity
        className="bg-white rounded-xl overflow-hidden border border-stone-100 shadow-card mb-3"
        activeOpacity={0.8}
      >
        <Image source={{ uri: artwork.imageUrl }} className="w-full aspect-square bg-stone-100" />
        <View className="p-3">
          <Text className="font-semibold text-stone-800 text-sm truncate" numberOfLines={1}>
            {artwork.title}
          </Text>
          <Text className="text-xs text-stone-500 mt-0.5" numberOfLines={1}>
            by {artwork.artistName || "Unknown Artist"}
          </Text>
          {artwork.price != null && (
            <Text className="text-sm font-bold text-gallery-600 mt-2">
              {formatPrice(artwork.price)}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    </Link>
  );
}