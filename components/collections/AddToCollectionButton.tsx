import { TouchableOpacity, Text, Modal, View, FlatList } from "react-native";
import { useState } from "react";
import { useMyCollections, useAddToCollection } from "@/hooks/useCollections";
import { useAuthStore } from "@/store/authStore";
import { Ionicons } from "@expo/vector-icons";

interface AddToCollectionButtonProps {
  artworkId: string;
}

export function AddToCollectionButton({ artworkId }: AddToCollectionButtonProps) {
  const { isAuthenticated } = useAuthStore();
  const [modalVisible, setModalVisible] = useState(false);
  const { data: collections } = useMyCollections();
  const { mutate: addToCollection } = useAddToCollection();

  if (!isAuthenticated) return null;

  const handleSelect = (collectionId: string) => {
    addToCollection({ collectionId, data: { artworkId } });
    setModalVisible(false);
  };

  return (
    <>
      <TouchableOpacity onPress={() => setModalVisible(true)} className="p-2">
        <Ionicons name="bookmark-outline" size={22} color="#78716c" />
      </TouchableOpacity>

      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl h-96 p-4">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="font-semibold text-stone-800 text-lg">Save to Collection</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#78716c" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={collections}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => handleSelect(item.id)}
                  className="flex-row items-center py-3 border-b border-stone-100"
                >
                  <Ionicons name="folder-outline" size={20} color="#8b5cf6" />
                  <View className="ml-3 flex-1">
                    <Text className="text-stone-800">{item.name}</Text>
                    <Text className="text-xs text-stone-500">{item.itemCount} items</Text>
                  </View>
                </TouchableOpacity>
              )}
              ListEmptyComponent={<Text className="text-center text-stone-500 py-4">No collections yet</Text>}
            />
          </View>
        </View>
      </Modal>
    </>
  );
}