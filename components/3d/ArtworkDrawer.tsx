import { View, Text, Image, TouchableOpacity, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { formatPrice } from "@/utils/helpers";
import type { Artwork } from "@/types";
import { useCartStore } from "@/store/cartStore";

interface ArtworkDrawerProps {
  artwork: Artwork;
  artworks: Artwork[];
  onClose: () => void;
  onNavigate: (artwork: Artwork) => void;
}

export default function ArtworkDrawer({ artwork, artworks, onClose, onNavigate }: ArtworkDrawerProps) {
  const addItem = useCartStore((s) => s.addItem);
  const idx = artworks.findIndex((a) => a.id === artwork.id);

  return (
    <View className="absolute inset-0 z-20">
      <TouchableOpacity className="absolute inset-0 bg-black/30" onPress={onClose} />
      <View className="absolute right-0 top-0 bottom-0 w-[85%] max-w-[360px] bg-white shadow-2xl">
        <ScrollView className="flex-1">
          <View className="p-5 border-b border-stone-100 flex-row justify-between items-start">
            <View className="flex-1">
              <Text className="text-xs text-stone-400 uppercase tracking-wider">
                {idx + 1} / {artworks.length}
              </Text>
              <Text className="font-display text-xl font-bold text-stone-900 mt-1">
                {artwork.title}
              </Text>
              <Text className="text-gallery-600 mt-1">by {artwork.artistName}</Text>
            </View>
            <TouchableOpacity onPress={onClose} className="p-2">
              <Ionicons name="close" size={24} color="#a8a29e" />
            </TouchableOpacity>
          </View>

          <View className="aspect-[4/3] bg-stone-100">
            <Image source={{ uri: artwork.imageUrl }} className="w-full h-full" resizeMode="contain" />
            {idx > 0 && (
              <TouchableOpacity
                onPress={() => onNavigate(artworks[idx - 1])}
                className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/80 p-2 rounded-full"
              >
                <Ionicons name="chevron-back" size={20} color="#44403c" />
              </TouchableOpacity>
            )}
            {idx < artworks.length - 1 && (
              <TouchableOpacity
                onPress={() => onNavigate(artworks[idx + 1])}
                className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/80 p-2 rounded-full"
              >
                <Ionicons name="chevron-forward" size={20} color="#44403c" />
              </TouchableOpacity>
            )}
          </View>

          <View className="p-5">
            {artwork.description && (
              <Text className="text-stone-600 leading-relaxed italic border-l-2 border-gallery-200 pl-3">
                "{artwork.description}"
              </Text>
            )}

            <View className="flex-row flex-wrap gap-2 mt-4">
              {artwork.dimensions && (
                <View className="bg-stone-50 p-3 rounded-xl flex-1 min-w-[45%]">
                  <Text className="text-xs text-stone-400">Dimensions</Text>
                  <Text className="font-semibold text-stone-800">{artwork.dimensions}</Text>
                </View>
              )}
              {artwork.materials && (
                <View className="bg-stone-50 p-3 rounded-xl flex-1 min-w-[45%]">
                  <Text className="text-xs text-stone-400">Materials</Text>
                  <Text className="font-semibold text-stone-800">{artwork.materials}</Text>
                </View>
              )}
              {artwork.year && (
                <View className="bg-stone-50 p-3 rounded-xl flex-1 min-w-[45%]">
                  <Text className="text-xs text-stone-400">Year</Text>
                  <Text className="font-semibold text-stone-800">{artwork.year}</Text>
                </View>
              )}
            </View>
          </View>
        </ScrollView>

        {artwork.price != null && artwork.price > 0 && (
          <View className="p-5 border-t border-stone-100 flex-row justify-between items-center">
            <View>
              <Text className="text-xs text-stone-400">Price</Text>
              <Text className="text-2xl font-bold text-gallery-600 font-display">
                {formatPrice(artwork.price)}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => {
                addItem({
                  artworkId: artwork.id,
                  title: artwork.title,
                  imageUrl: artwork.imageUrl,
                  artistName: artwork.artistName ?? "Unknown",
                  price: artwork.price ?? 0,
                });
                onClose();
              }}
              className="bg-gradient-to-r from-gallery-500 to-purple-600 px-5 py-3 rounded-2xl flex-row items-center gap-2"
            >
              <Ionicons name="cart-outline" size={18} color="white" />
              <Text className="text-white font-semibold">Add to Cart</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}