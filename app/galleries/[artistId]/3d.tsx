import { View, Text, TouchableOpacity } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

export default function VirtualGalleryPage() {
  const { artistId } = useLocalSearchParams<{ artistId: string }>();
  const router = useRouter();

  return (
    <View className="flex-1 bg-black justify-center items-center">
      <Text className="text-white text-2xl font-bold mb-4">3D Gallery</Text>
      <Text className="text-white/70 mb-2">Artist ID: {artistId}</Text>
      <Text className="text-white/50 text-center px-8 mb-8">
        The 3D scene will be loaded here.{"\n"}
        (Three.js integration coming soon)
      </Text>

      <TouchableOpacity
        onPress={() => router.back()}
        className="bg-gallery-600 px-6 py-3 rounded-xl"
      >
        <Text className="text-white font-medium">Go Back</Text>
      </TouchableOpacity>
    </View>
  );
}