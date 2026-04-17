import { View, Text, Image, TouchableOpacity } from "react-native";
import { Link } from "expo-router";
import type { ArtistGalleryInfo } from "@/types";
import { Ionicons } from "@expo/vector-icons";

interface GalleryCardProps {
  gallery: ArtistGalleryInfo;
}

export function GalleryCard({ gallery }: GalleryCardProps) {
  const coverImage = gallery.featuredArtworks?.[0]?.imageUrl;

  return (
    <Link href={`/galleries/${gallery.artistId}`} asChild>
      <TouchableOpacity className="bg-white rounded-xl overflow-hidden border border-stone-100 shadow-card mb-3">
        <View className="aspect-[4/3] bg-stone-100">
          {coverImage ? (
            <Image source={{ uri: coverImage }} className="w-full h-full" />
          ) : (
            <View className="w-full h-full items-center justify-center">
              <Ionicons name="images-outline" size={40} color="#d6d3d1" />
            </View>
          )}
        </View>
        <View className="p-4">
          <Text className="font-semibold text-stone-800" numberOfLines={1}>
            {gallery.galleryName || "Untitled Gallery"}
          </Text>
          <Text className="text-sm text-stone-500 mt-1" numberOfLines={1}>
            by {gallery.displayName || "Unknown Artist"}
          </Text>
          <Text className="text-xs text-stone-400 mt-2">
            {gallery.artworkCount} {gallery.artworkCount === 1 ? "artwork" : "artworks"}
          </Text>
        </View>
      </TouchableOpacity>
    </Link>
  );
}