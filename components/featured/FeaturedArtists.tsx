import { View, Text, FlatList, Image, TouchableOpacity } from "react-native";
import { Link } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import api from "@/api/axiosInstance";
import { SkeletonCard } from "../common/SkeletonCard";

interface TopArtist {
  id: string;
  displayName: string | null;
  galleryName: string | null;
  profilePicUrl: string | null;
  artworkCount: number;
  followerCount: number;
  averageRating: number;
}

export function FeaturedArtists() {
  const { data: artists, isLoading } = useQuery({
    queryKey: ["top-artists"],
    queryFn: async () => {
      const res = await api.get<TopArtist[]>("/api/users/top-artists?limit=6");
      return res.data;
    },
  });

  if (isLoading) {
    return (
      <View className="px-4 py-6">
        <Text className="font-display text-xl font-bold text-stone-800 mb-4">Featured Artists</Text>
        <View className="flex-row flex-wrap gap-4">
          {[1, 2, 3].map((i) => (
            <View key={i} className="flex-1 min-w-[45%]">
              <SkeletonCard />
            </View>
          ))}
        </View>
      </View>
    );
  }

  if (!artists?.length) return null;

  return (
    <View className="px-4 py-6">
      <Text className="font-display text-xl font-bold text-stone-800 mb-4">Featured Artists</Text>
      <FlatList
        data={artists}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Link href={`/galleries/${item.id}`} asChild>
            <TouchableOpacity className="bg-white rounded-xl p-4 mr-4 w-64 border border-stone-100">
              <View className="flex-row items-center gap-3">
                {item.profilePicUrl ? (
                  <Image source={{ uri: item.profilePicUrl }} className="w-12 h-12 rounded-full" />
                ) : (
                  <View className="w-12 h-12 rounded-full bg-gallery-200 items-center justify-center">
                    <Text className="text-gallery-600 font-bold">
                      {item.displayName?.[0]?.toUpperCase() || "A"}
                    </Text>
                  </View>
                )}
                <View className="flex-1">
                  <Text className="font-semibold text-stone-800">{item.galleryName || item.displayName}</Text>
                  <Text className="text-xs text-stone-500">
                    {item.artworkCount} works · {item.followerCount} followers
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          </Link>
        )}
      />
    </View>
  );
}