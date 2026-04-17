import { View, Text, FlatList, TouchableOpacity } from "react-native";
import { Link } from "expo-router";
import { useMyCollections } from "@/hooks/useCollections";
import { PageLoader } from "@/components/common/Spinner";
import { Ionicons } from "@expo/vector-icons";
import { CollectionCard } from "@/components/collections/CollectionCard";
import { Button } from "@/components/common/Button";
import { useState } from "react";
import { CreateCollectionModal } from "@/components/collections/CreateCollectionModal";

export default function CollectionsPage() {
  const { data: collections, isLoading } = useMyCollections();
  const [modalVisible, setModalVisible] = useState(false);

  if (isLoading) return <PageLoader />;

  return (
    <View className="flex-1 bg-stone-50 p-4">
      <View className="flex-row justify-between items-center mb-4">
        <Text className="font-display text-2xl font-bold text-stone-800">My Collections</Text>
        <Button onPress={() => setModalVisible(true)} size="sm">
          <Ionicons name="add" size={18} color="white" /> New
        </Button>
      </View>

      {!collections?.length ? (
        <View className="flex-1 justify-center items-center">
          <Ionicons name="folder-open-outline" size={64} color="#d6d3d1" />
          <Text className="text-stone-500 mt-4 text-center">No collections yet</Text>
          <Button onPress={() => setModalVisible(true)} className="mt-4">
            Create your first collection
          </Button>
        </View>
      ) : (
        <FlatList
          data={collections}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <CollectionCard collection={item} />}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}

      <CreateCollectionModal visible={modalVisible} onClose={() => setModalVisible(false)} />
    </View>
  );
}