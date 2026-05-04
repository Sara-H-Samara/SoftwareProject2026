import { View, Text, FlatList, Image, TouchableOpacity, Alert } from 'react-native';
import { useMyArtworks, useDeleteArtwork, useUpdateArtwork } from '../../../hooks/useArtworks';
import { formatPrice } from '../../../utils/helpers';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';

export default function MyArtworksPage() {
  const { data: artworks, isLoading, refetch } = useMyArtworks();
  const { mutate: deleteArtwork } = useDeleteArtwork();
  const { mutate: updateArtwork } = useUpdateArtwork();

  const handleTogglePublish = (artwork: any) => {
    updateArtwork({ id: artwork.id, data: { isPublished: !artwork.isPublished } });
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete Artwork', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteArtwork(id) },
    ]);
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-stone-50 justify-center items-center">
        <Text className="text-stone-500">Loading artworks...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-stone-50 px-4 pt-6">
      <View className="flex-row justify-between items-center mb-4">
        <Text className="text-2xl font-bold text-stone-800">My Artworks</Text>
        <TouchableOpacity
          onPress={() => router.push('/dashboard/dashboard/upload')}
          className="bg-gallery-600 px-4 py-2 rounded-xl"
        >
          <Text className="text-white font-semibold">Upload</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={artworks}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={{ justifyContent: 'space-between', marginBottom: 16 }}
        renderItem={({ item }) => (
          <View className="w-[48%] bg-white rounded-xl overflow-hidden border border-stone-100 shadow-sm">
            <Image source={{ uri: item.imageUrl }} className="w-full h-40" resizeMode="cover" />
            <View className="p-3">
              <Text className="font-semibold text-stone-800">{item.title}</Text>
              <Text className="text-xs text-stone-500 mt-1">{item.artworkType}</Text>
              {item.price != null && (
                <Text className="text-sm font-bold text-gallery-600 mt-1">{formatPrice(item.price)}</Text>
              )}
              <View className="flex-row justify-between mt-3">
                <TouchableOpacity onPress={() => handleTogglePublish(item)}>
                  <Feather name={item.isPublished ? 'eye' : 'eye-off'} size={20} color="#4B5563" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => router.push(`/dashboard/dashboard/upload?edit=${item.id}`)}>
                  <Feather name="edit-2" size={20} color="#4B5563" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(item.id)}>
                  <Feather name="trash-2" size={20} color="#EF4444" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
        ListEmptyComponent={<Text className="text-stone-500 text-center mt-10">No artworks yet.</Text>}
      />
    </View>
  );
}