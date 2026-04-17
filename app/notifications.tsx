import { View, Text, FlatList, TouchableOpacity } from "react-native";
import { useNotifications, useMarkAsRead, useDeleteNotification } from "@/hooks/useNotifications";
import { PageLoader } from "@/components/common/Spinner";
import { Ionicons } from "@expo/vector-icons";
import { formatDistanceToNow } from "date-fns";

export default function NotificationsPage() {
  const { data: notifications, isLoading } = useNotifications();
  const { mutate: markAsRead } = useMarkAsRead();
  const { mutate: deleteNotification } = useDeleteNotification();

  if (isLoading) return <PageLoader />;

  if (!notifications?.length) {
    return (
      <View className="flex-1 bg-stone-50 justify-center items-center p-6">
        <Ionicons name="notifications-outline" size={64} color="#d6d3d1" />
        <Text className="text-xl font-semibold text-stone-800 mt-4">No notifications</Text>
        <Text className="text-stone-500 text-center mt-2">
          When someone likes, follows, or comments, you'll see it here.
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={notifications}
      keyExtractor={(item) => item.id}
      contentContainerStyle={{ padding: 16 }}
      renderItem={({ item }) => (
        <TouchableOpacity
          onPress={() => markAsRead(item.id)}
          className={`bg-white rounded-xl p-4 mb-3 border ${
            !item.isRead ? "border-gallery-200 bg-gallery-50" : "border-stone-100"
          }`}
        >
          <View className="flex-row justify-between">
            <Text className="font-medium text-stone-800 flex-1">{item.message}</Text>
            <TouchableOpacity onPress={() => deleteNotification(item.id)}>
              <Ionicons name="trash-outline" size={18} color="#a8a29e" />
            </TouchableOpacity>
          </View>
          <Text className="text-xs text-stone-400 mt-2">
            {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
          </Text>
          {!item.isRead && <View className="absolute top-4 right-10 w-2 h-2 bg-gallery-500 rounded-full" />}
        </TouchableOpacity>
      )}
    />
  );
}