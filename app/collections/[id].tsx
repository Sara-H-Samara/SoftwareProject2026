import { View, Text, ScrollView, TouchableOpacity, Image } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCollection, useDeleteCollection, useRemoveFromCollection } from "@/hooks/useCollections";
import { PageLoader } from "@/components/common/Spinner";
import { Ionicons } from "@expo/vector-icons";
import { formatDate } from "@/utils/helpers";
import { Button } from "@/components/common/Button";

export default function CollectionDetailsPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: collection, isLoading } = useCollection(id!);
  const { mutate: deleteCollection } = useDeleteCollection();
  const { mutate: removeItem } = useRemoveFromCollection();

  const handleDelete = () => {
    deleteCollection(id!, { onSuccess: () => router.back() });
  };

  if (isLoading) return <PageLoader />;
  if (!collection) return <Text>Collection not found</Text>;

  return (
    <ScrollView className="flex-1 bg-stone-50 p-4">
      <View className="bg-white rounded-xl p-4 mb-4">
        <View className="flex-row justify-between items-start">
          <View className="flex-1">
            <Text className="font-display text-xl font-bold text-stone-800">{collection.name}</Text>
            {collection.description && (
              <Text className="text-stone-500 mt-1">{collection.description}</Text>
            )}
            <Text className="text-xs text-stone-400 mt-2">
              Created {formatDate(collection.createdAt)} · {collection.itemCount} items
            </Text>
          </View>
          <TouchableOpacity onPress={handleDelete}>
            <Ionicons name="trash-outline" size={22} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>

      <Text className="font-semibold text-stone-800 mb-3">Artworks</Text>
      {collection.items.length === 0 ? (
        <Text className="text-stone-500 text-center py-8">No artworks in this collection</Text>
      ) : (
        collection.items.map((item) => (
          <View key={item.id} className="bg-white rounded-xl p-3 mb-3 flex-row items-center">
            <Image source={{ uri: item.imageUrl }} className="w-16 h-16 rounded-lg" />
            <View className="flex-1 ml-3">
              <Text className="font-medium text-stone-800">{item.title}</Text>
              <Text className="text-xs text-stone-500">{item.artistName}</Text>
            </View>
            <TouchableOpacity onPress={() => removeItem({ collectionId: id!, artworkId: item.artworkId })}>
              <Ionicons name="close-circle-outline" size={22} color="#a8a29e" />
            </TouchableOpacity>
          </View>
        ))
      )}
    </ScrollView>
  );
}