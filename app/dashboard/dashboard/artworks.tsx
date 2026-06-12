import { View, Text, ScrollView, Image, TouchableOpacity } from "react-native";
import { Link } from "expo-router";
import { useMyArtworks } from "@/hooks/useArtworks";
import { PageLoader } from "@/components/common/Spinner";
import type { Artwork } from "@/types";

export default function DashboardArtworksPage() {
  const { data: artworks, isLoading } = useMyArtworks();

  const allArtworks = artworks ?? [];

  if (isLoading) {
    return <PageLoader message="Loading artworks..." />;
  }

  if (allArtworks.length === 0) {
    return (
      <View className="flex-1 bg-stone-50 justify-center items-center p-6">
        <Text className="text-xl font-semibold text-stone-800">No artworks yet</Text>
        <Text className="text-stone-500 text-center mt-2">
          Upload your first artwork to start building your gallery.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-stone-50 p-4">
      <Text className="font-display text-2xl font-bold text-stone-800 mb-4">
        My Artworks
      </Text>

      <View className="flex-row flex-wrap gap-3">
        {allArtworks.map((artwork: Artwork) => (
          <Link key={artwork.id} href={`/artwork/${artwork.id}`} asChild>
            <TouchableOpacity className="w-[48%] bg-white rounded-xl overflow-hidden border border-stone-100 mb-3">
              <Image
                source={{ uri: artwork.imageUrl }}
                className="w-full aspect-square"
                resizeMode="cover"
              />

              <View className="p-3">
                <Text className="font-semibold text-stone-800" numberOfLines={1}>
                  {artwork.title}
                </Text>

                <Text className="text-xs mt-1">
                  {artwork.isPublished ? "Published" : "Draft"}
                </Text>
              </View>
            </TouchableOpacity>
          </Link>
        ))}
      </View>
    </ScrollView>
  );
}