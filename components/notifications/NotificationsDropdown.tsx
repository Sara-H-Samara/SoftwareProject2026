import { View, Text, TouchableOpacity, Modal, FlatList } from 'react-native';
import { useState } from 'react';
import { Link } from 'expo-router';
import { useNotifications, useMarkAllAsRead } from '@/hooks/useNotifications';
import { Ionicons } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';

export function NotificationsDropdown() {
  const [visible, setVisible] = useState(false);
  const { data: notifications } = useNotifications();
  const markAllAsRead = useMarkAllAsRead();

  const unreadCount = notifications?.filter(n => !n.isRead).length ?? 0;

  return (
    <>
      <TouchableOpacity onPress={() => setVisible(true)} className="p-2 relative">
        <Ionicons name="notifications-outline" size={24} color="#78716c" />
        {unreadCount > 0 && (
          <View className="absolute top-0 right-0 bg-red-500 rounded-full w-4 h-4 items-center justify-center">
            <Text className="text-white text-xs">{unreadCount}</Text>
          </View>
        )}
      </TouchableOpacity>
      <Modal visible={visible} animationType="slide" transparent onRequestClose={() => setVisible(false)}>
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl h-[80%]">
            <View className="flex-row justify-between items-center p-4 border-b border-stone-100">
              <Text className="font-semibold text-stone-800 text-lg">Notifications</Text>
              <TouchableOpacity onPress={() => markAllAsRead.mutate()}>
                <Text className="text-gallery-600 text-sm">Mark all read</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setVisible(false)}>
                <Ionicons name="close" size={24} color="#78716c" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={notifications ?? []}
              keyExtractor={item => item.id}
              renderItem={({ item }) => (
                <Link href={`/artwork/${item.entityId}`} asChild onPress={() => setVisible(false)}>
                  <TouchableOpacity className={`p-3 rounded-lg mb-2 ${!item.isRead ? 'bg-gallery-50' : 'bg-white'}`}>
                    <Text className="text-stone-800">{item.message}</Text>
                    <Text className="text-xs text-stone-400 mt-1">
                      {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                    </Text>
                  </TouchableOpacity>
                </Link>
              )}
            />
          </View>
        </View>
      </Modal>
    </>
  );
}