import { View, Text, FlatList, Image, TouchableOpacity, ActivityIndicator } from "react-native";
import { Link, useRouter } from "expo-router";
import { useInfiniteGalleries } from "@/hooks/useGallery";
import { PAGE_SIZE } from "@/utils/constants";
import { getInitials } from "@/utils/helpers";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";

export default function BrowseGalleriesPage() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
  } = useInfiniteGalleries(PAGE_SIZE);

  const allGalleries = data?.pages.flatMap((page) => page.galleries) || [];
  const totalCount = data?.pages[0]?.totalCount || 0;

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const renderItem = ({ item }: { item: any }) => {
    const previews = item.featuredArtworks?.slice(0, 3) || [];
    return (
      <Link href={`/galleries/${item.artistId}`} asChild>
        <TouchableOpacity className="bg-white rounded-2xl overflow-hidden mb-4 border border-stone-100 shadow-card">
          <View className="aspect-[4/3] bg-stone-100">
            {previews.length > 0 ? (
              <View className="flex-1 flex-row">
                {previews.map((aw: any, i: number) => (
                  <Image
                    key={aw.id}
                    source={{ uri: aw.imageUrl }}
                    className={`flex-1 ${i === 0 && previews.length === 3 ? 'flex-[2]' : ''}`}
                  />
                ))}
              </View>
            ) : (
              <View className="flex-1 items-center justify-center">
                <Ionicons name="images-outline" size={32} color="#d6d3d1" />
                <Text className="text-xs text-stone-400 mt-2">No artworks yet</Text>
              </View>
            )}
            <View className="absolute top-3 left-3 bg-black/60 px-2.5 py-1 rounded-full">
              <Text className="text-white text-xs font-semibold">
                {item.artworkCount} {item.artworkCount === 1 ? 'work' : 'works'}
              </Text>
            </View>
          </View>
          <View className="p-4">
            <View className="flex-row items-center gap-2 mb-2">
              {item.profilePicUrl ? (
                <Image source={{ uri: item.profilePicUrl }} className="w-8 h-8 rounded-full" />
              ) : (
                <View className="w-8 h-8 rounded-full bg-gradient-to-br from-gallery-400 to-purple-500 items-center justify-center">
                  <Text className="text-white text-xs font-bold">{getInitials(item.displayName)}</Text>
                </View>
              )}
              <Text className="text-xs text-stone-500" numberOfLines={1}>{item.displayName || 'Unknown Artist'}</Text>
            </View>
            <Text className="font-semibold text-stone-800 text-base" numberOfLines={1}>
              {item.galleryName || 'Untitled Gallery'}
            </Text>
            {item.bio && <Text className="text-xs text-stone-400 mt-1" numberOfLines={2}>{item.bio}</Text>}
          </View>
        </TouchableOpacity>
      </Link>
    );
  };

  if (isLoading && allGalleries.length === 0) {
    return (
      <View className="flex-1 bg-stone-50 p-4">
        {[...Array(6)].map((_, i) => (
          <View key={i} className="bg-white rounded-2xl p-4 mb-4">
            <View className="aspect-[4/3] bg-stone-200 rounded-lg mb-3" />
            <View className="h-4 bg-stone-200 rounded w-3/4 mb-2" />
            <View className="h-3 bg-stone-200 rounded w-1/2" />
          </View>
        ))}
      </View>
    );
  }

  return (
    <View className="flex-1 bg-stone-50">
      <View className="px-4 py-6 bg-gradient-to-br from-stone-100 to-purple-50">
        <Text className="font-display text-3xl text-stone-900">Discover Galleries</Text>
        <Text className="text-stone-500 text-sm mt-1">
          {totalCount.toLocaleString()} unique galleries from artists around the world.
        </Text>
        <TouchableOpacity
          onPress={() => router.push("/search")}
          className="mt-4 flex-row items-center bg-white rounded-xl border border-stone-200 px-4 py-3"
        >
          <Ionicons name="search-outline" size={20} color="#a8a29e" />
          <Text className="flex-1 ml-2 text-stone-400">Search by gallery, artist, or artwork...</Text>
          <Ionicons name="chevron-forward" size={16} color="#a8a29e" />
        </TouchableOpacity>
      </View>
      <FlatList
        data={allGalleries}
        keyExtractor={(item) => item.artistId}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 16 }}
        onEndReached={() => hasNextPage && fetchNextPage()}
        onEndReachedThreshold={0.5}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        ListFooterComponent={
          isFetchingNextPage ? (
            <View className="py-4 items-center">
              <ActivityIndicator size="small" color="#8b5cf6" />
            </View>
          ) : null
        }
        ListEmptyComponent={
          <View className="items-center py-12">
            <Ionicons name="images-outline" size={64} color="#d6d3d1" />
            <Text className="text-stone-500 mt-4">No galleries found</Text>
          </View>
        }
      />
    </View>
  );
}