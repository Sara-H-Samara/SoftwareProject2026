import { useLocalSearchParams, useRouter, Link } from "expo-router";
import { ScrollView, View, Text, Image, TouchableOpacity } from "react-native";
import { useArtwork } from "@/hooks/useArtworks";
import { PageLoader } from "@/components/common/Spinner";
import { formatPrice } from "@/utils/helpers";
import { Button } from "@/components/common/Button";
import { useCartStore } from "@/store/cartStore";
import { useRecentlyViewedStore } from "@/store/recentlyViewedStore";
import { useEffect } from "react";
import { Ionicons } from "@expo/vector-icons";

export default function ArtworkDetailsPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: artwork, isLoading } = useArtwork(id!);
  const addItem = useCartStore((s) => s.addItem);
  const addRecent = useRecentlyViewedStore((s) => s.addItem);

  useEffect(() => {
    if (artwork) {
      addRecent({
        id: artwork.id,
        title: artwork.title,
        imageUrl: artwork.imageUrl,
        artistName: artwork.artistName ?? "Unknown",
        artistId: artwork.artistId,
      });
    }
  }, [artwork]);

  if (isLoading) return <PageLoader />;
  if (!artwork) return <Text>Artwork not found</Text>;

  return (
    <ScrollView className="flex-1 bg-stone-50">
      <View className="relative">
        <Image
          source={{ uri: artwork.imageUrl }}
          className="w-full aspect-square"
        />
        <TouchableOpacity
          onPress={() => router.back()}
          className="absolute top-4 left-4 p-2 bg-white/80 rounded-full"
        >
          <Ionicons name="arrow-back" size={24} color="#44403c" />
        </TouchableOpacity>
      </View>

      <View className="p-4">
        <Text className="font-display text-2xl font-bold text-stone-800">
          {artwork.title}
        </Text>
        <Link href={`/galleries/${artwork.artistId}`}>
          <Text className="text-gallery-600 text-base mt-1">
            by {artwork.artistName}
          </Text>
        </Link>

        {artwork.description && (
          <Text className="text-stone-600 mt-4 leading-relaxed">
            {artwork.description}
          </Text>
        )}

        <View className="flex-row flex-wrap gap-3 mt-4">
          {artwork.dimensions && (
            <InfoChip icon="📏" label="Dimensions" value={artwork.dimensions} />
          )}
          {artwork.materials && (
            <InfoChip icon="🎨" label="Materials" value={artwork.materials} />
          )}
          {artwork.year && (
            <InfoChip icon="📅" label="Year" value={String(artwork.year)} />
          )}
        </View>

        {artwork.price != null && (
          <View className="mt-6 flex-row justify-between items-center">
            <View>
              <Text className="text-xs text-stone-500">Price</Text>
              <Text className="text-2xl font-bold text-gallery-600">
                {formatPrice(artwork.price)}
              </Text>
            </View>
            <Button
              onPress={() => {
                addItem({
                  artworkId: artwork.id,
                  title: artwork.title,
                  imageUrl: artwork.imageUrl,
                  artistName: artwork.artistName ?? "Unknown",
                  price: artwork.price ?? 0,
                });
              }}
            >
              Add to Cart
            </Button>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

function InfoChip({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View className="bg-stone-100 rounded-xl p-3 flex-1 min-w-[40%]">
      <Text className="text-xs text-stone-500">{icon} {label}</Text>
      <Text className="text-sm font-semibold text-stone-800">{value}</Text>
    </View>
  );
}