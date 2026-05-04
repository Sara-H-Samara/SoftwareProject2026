import { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Image, Alert } from "react-native";
import { useRouter } from "expo-router";
import { useCreateArtwork } from "@/hooks/useArtworks";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import type { ArtworkType } from "@/types";
import { ARTWORK_TYPES } from "@/utils/constants";

export default function UploadArtworkPage() {
  const router = useRouter();
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const { mutate: createArtwork, isPending } = useCreateArtwork();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [artworkType, setArtworkType] = useState<ArtworkType>("Painting");
  const [materials, setMaterials] = useState("");
  const [dimensions, setDimensions] = useState("");
  const [year, setYear] = useState("");
  const [price, setPrice] = useState("");
  const [image, setImage] = useState<any>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled) {
      const asset = result.assets[0];
      const file = {
        uri: asset.uri,
        name: asset.fileName ?? "artwork.jpg",
        type: asset.mimeType ?? "image/jpeg",
      };
      setImage(file);
      setImagePreview(asset.uri);
    }
  };

  const handleSubmit = () => {
    if (!title.trim()) return Alert.alert("Error", "Title is required.");
    if (!image) return Alert.alert("Error", "Please select an image.");
    const payload = {
      title: title.trim(),
      description: description.trim() || undefined,
      artworkType,
      materials: materials.trim() || undefined,
      dimensions: dimensions.trim() || undefined,
      year: year ? Number(year) : undefined,
      price: price ? Number(price) : undefined,
    };

    createArtwork(
      { data: payload, imageFile: image },
      {
        onSuccess: () => {
          router.replace("/dashboard/dashboard/artworks");
        },
        onError: (error) => {
          // إذا كانت الجلسة منتهية، قم بتوجيه المستخدم إلى تسجيل الدخول
          if (
            error instanceof Error &&
            error.message.includes("Session expired")
          ) {
            clearAuth();
            router.replace("/auth/login");
          }
          // الأخطاء الأخرى سيتم عرضها تلقائيًا عبر التوست من داخل useCreateArtwork
        },
      }
    );
  };

  return (
    <ScrollView className="flex-1 bg-stone-50 p-4" showsVerticalScrollIndicator={false}>
      <Text className="font-display text-2xl font-bold text-stone-800 mb-4">Upload Artwork</Text>

      <TouchableOpacity onPress={pickImage} className="mb-4">
        {imagePreview ? (
          <Image source={{ uri: imagePreview }} className="w-full h-48 rounded-xl" resizeMode="cover" />
        ) : (
          <View className="w-full h-48 rounded-xl border-2 border-dashed border-stone-300 items-center justify-center bg-stone-50">
            <Ionicons name="cloud-upload-outline" size={32} color="#a8a29e" />
            <Text className="text-stone-500 mt-2">Tap to select image</Text>
          </View>
        )}
      </TouchableOpacity>

      <Input label="Title" value={title} onChangeText={setTitle} placeholder="Artwork title" />

      <View className="mt-4">
        <Text className="text-sm font-medium text-stone-700 mb-1">Type</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-2">
          {ARTWORK_TYPES.map((type) => (
            <TouchableOpacity
              key={type}
              onPress={() => setArtworkType(type)}
              className={`px-4 py-2 rounded-full border ${
                artworkType === type ? "bg-gallery-600 border-gallery-600" : "bg-white border-stone-200"
              }`}
            >
              <Text className={artworkType === type ? "text-white" : "text-stone-600"}>{type}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View className="mt-4">
        <Input label="Description (optional)" value={description} onChangeText={setDescription} placeholder="Describe the artwork" />
      </View>
      <View className="mt-4 flex-row gap-4">
        <View className="flex-1"><Input label="Materials" value={materials} onChangeText={setMaterials} placeholder="Oil on canvas" /></View>
        <View className="flex-1"><Input label="Dimensions" value={dimensions} onChangeText={setDimensions} placeholder='24" x 36"' /></View>
      </View>
      <View className="mt-4 flex-row gap-4">
        <View className="flex-1"><Input label="Year" value={year} onChangeText={setYear} placeholder="2024" keyboardType="numeric" /></View>
        <View className="flex-1"><Input label="Price (USD)" value={price} onChangeText={setPrice} placeholder="0.00" keyboardType="decimal-pad" /></View>
      </View>

      <View className="flex-row gap-3 mt-6">
        <Button onPress={handleSubmit} isLoading={isPending} className="flex-1">Upload</Button>
        <Button variant="secondary" onPress={() => router.back()} className="flex-1">Cancel</Button>
      </View>
    </ScrollView>
  );
}