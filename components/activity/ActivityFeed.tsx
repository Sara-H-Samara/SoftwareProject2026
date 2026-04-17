import { View, Text, FlatList, Image } from "react-native";
import { useActivityFeed } from "@/hooks/useActivity";
import { PageLoader } from "@/components/common/Spinner";
import { formatDistanceToNow } from "date-fns";
import { Ionicons } from "@expo/vector-icons";

interface ActivityFeedProps {
  filter?: "like" | "follow" | "comment" | "review";
}

export function ActivityFeed({ filter }: ActivityFeedProps) {
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useActivityFeed();

  const activities = data?.pages.flatMap((p) => p.activities) ?? [];
  const filtered = filter ? activities.filter((a) => a.type === filter) : activities;

  if (isLoading) return <PageLoader />;
  if (filtered.length === 0) {
    return (
      <View className="flex-1 justify-center items-center p-6">
        <Ionicons name="pulse-outline" size={64} color="#d6d3d1" />
        <Text className="text-stone-500 mt-4 text-center">No activity yet</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={filtered}
      keyExtractor={(item) => item.id}
      contentContainerStyle={{ padding: 16 }}
      onEndReached={() => hasNextPage && fetchNextPage()}
      ListFooterComponent={isFetchingNextPage ? <PageLoader /> : null}
      renderItem={({ item }) => (
        <View className="bg-white rounded-xl p-4 mb-3 border border-stone-100">
          <View className="flex-row items-center gap-3">
            {item.actorAvatar ? (
              <Image source={{ uri: item.actorAvatar }} className="w-10 h-10 rounded-full" />
            ) : (
              <View className="w-10 h-10 rounded-full bg-gallery-200 items-center justify-center">
                <Text className="text-gallery-600 font-bold">
                  {item.actorName?.[0]?.toUpperCase() || "?"}
                </Text>
              </View>
            )}
            <View className="flex-1">
              <Text className="text-stone-800">
                <Text className="font-medium">{item.actorName}</Text> {item.message}
              </Text>
              <Text className="text-xs text-stone-400 mt-1">
                {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
              </Text>
            </View>
          </View>
          {item.entityImage && (
            <View className="mt-3 flex-row items-center bg-stone-50 p-2 rounded-lg">
              <Image source={{ uri: item.entityImage }} className="w-12 h-12 rounded-lg" />
              <Text className="ml-3 text-sm text-stone-600">{item.entityTitle}</Text>
            </View>
          )}
        </View>
      )}
    />
  );
}