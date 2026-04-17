import { View, Text, FlatList, Image, TouchableOpacity } from "react-native";
import { Link } from "expo-router";
import { useRecentlyViewedStore } from "@/store/recentlyViewedStore";

export function RecentlyViewed() {
  const { getRecentItems, removeItem } = useRecentlyViewedStore();
  const items = getRecentItems(6);

  if (items.length === 0) return null;

  return (
    <View className="px-4 py-6">
      <View className="flex-row justify-between items-center mb-3">
        <Text className="font-display text-lg font-semibold text-stone-800">Recently Viewed</Text>
      </View>
      <FlatList
        data={items}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Link href={`/artwork/${item.id}`} asChild>
            <TouchableOpacity className="mr-3 w-28">
              <Image source={{ uri: item.imageUrl }} className="w-28 h-28 rounded-lg" />
              <Text className="text-xs font-medium text-stone-800 mt-1 truncate">{item.title}</Text>
              <Text className="text-[10px] text-stone-500 truncate">{item.artistName}</Text>
            </TouchableOpacity>
          </Link>
        )}
      />
    </View>
  );
}