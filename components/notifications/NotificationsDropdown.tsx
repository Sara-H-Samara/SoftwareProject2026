import { View, Text, TouchableOpacity, Modal, FlatList } from "react-native";
import { useState } from "react";
import { Link } from "expo-router";
import { useNotifications, useUnreadCount, useMarkAllAsRead } from "@/hooks/useNotifications";
import { Ionicons } from "@expo/vector-icons";
import { formatDistanceToNow } from "date-fns";

export function NotificationsDropdown() {
  const [visible, setVisible] = useState(false);
  const { data: notifications } = useNotifications(1);
  const { data: unread } = useUnreadCount();
  const { mutate: markAllAsRead } = useMarkAllAsRead();

  const unreadCount = unread?.count ?? 0;

  return (
    <>
      <TouchableOpacity onPress={() => setVisible(true)} className="p-2 relative">
        <Ionicons name="notifications-outline" size={24} color="#78716c" />
        {unreadCount > 0 && (
          <View className="absolute top-0 right-0 bg-red-500 rounded-full w-5 h-5 items-center justify-center">
            <Text className="text-white text-xs font-bold">{unreadCount}</Text>
          </View>
        )}
      </TouchableOpacity>

      <Modal visible={visible} animationType="slide" transparent onRequestClose={() => setVisible(false)}>
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl h-[80%]">
            <View className="flex-row justify-between items-center p-4 border-b border-stone-100">
              <Text className="font-semibold text-stone-800 text-lg">Notifications</Text>
              <View className="flex-row gap-4">
                {unreadCount > 0 && (
                  <TouchableOpacity onPress={() => markAllAsRead()}>
                    <Text className="text-gallery-600 text-sm">Mark all read</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={() => setVisible(false)}>
                  <Ionicons name="close" size={24} color="#78716c" />
                </TouchableOpacity>
              </View>
            </View>
            <FlatList
              data={notifications}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ padding: 16 }}
              renderItem={({ item }) => (
                <Link href={`/artwork/${item.entityId}`} onPress={() => setVisible(false)} asChild>
                  <TouchableOpacity
                    className={`p-3 rounded-lg mb-2 ${!item.isRead ? "bg-gallery-50" : "bg-white"}`}
                  >
                    <Text className="text-stone-800">{item.message}</Text>
                    <Text className="text-xs text-stone-400 mt-1">
                      {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                    </Text>
                  </TouchableOpacity>
                </Link>
              )}
              ListEmptyComponent={<Text className="text-center text-stone-500 py-8">No notifications</Text>}
            />
            <Link href="/notifications" onPress={() => setVisible(false)} asChild>
              <TouchableOpacity className="p-4 border-t border-stone-100">
                <Text className="text-center text-gallery-600">View all notifications</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </Modal>
    </>
  );
}