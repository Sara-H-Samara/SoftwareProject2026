import { View, Text, Image, TouchableOpacity } from "react-native";
import { Link } from "expo-router";
import { formatDate } from "@/utils/helpers";
import type { Collection } from "@/types";
import { Ionicons } from "@expo/vector-icons";

interface CollectionCardProps {
  collection: Collection;
  onDelete?: () => void;
}

export function CollectionCard({ collection, onDelete }: CollectionCardProps) {
  const coverImage = collection.coverImageUrl || collection.items[0]?.imageUrl;

  return (
    <Link href={`/collections/${collection.id}`} asChild>
      <TouchableOpacity className="bg-white rounded-xl overflow-hidden border border-stone-100 mb-3">
        {coverImage ? (
          <Image source={{ uri: coverImage }} className="w-full h-32" />
        ) : (
          <View className="w-full h-32 bg-stone-100 items-center justify-center">
            <Ionicons name="folder-open-outline" size={40} color="#d6d3d1" />
          </View>
        )}
        <View className="p-4">
          <View className="flex-row justify-between items-start">
            <View className="flex-1">
              <Text className="font-semibold text-stone-800">{collection.name}</Text>
              {collection.description && (
                <Text className="text-xs text-stone-500 mt-1" numberOfLines={2}>
                  {collection.description}
                </Text>
              )}
              <Text className="text-xs text-stone-400 mt-2">
                {collection.itemCount} items · {formatDate(collection.createdAt)}
              </Text>
            </View>
            {onDelete && (
              <TouchableOpacity onPress={onDelete} className="p-1">
                <Ionicons name="trash-outline" size={18} color="#ef4444" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </TouchableOpacity>
    </Link>
  );
}