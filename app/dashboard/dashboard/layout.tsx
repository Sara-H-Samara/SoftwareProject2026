import { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useMyArtworks, useBulkUpdatePositions } from "@/hooks/useArtworks";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/common/Button";
import { PageLoader } from "@/components/common/Spinner";
import { Ionicons } from "@expo/vector-icons";
import type { Artwork, UpdateArtworkPositionRequest } from "@/types";

// تعريف مواقع الجدران كما في الويب
const WALL_POSITIONS = [
  { id: "front-1", label: "Front Left", positionX: -3, positionY: 1.6, positionZ: 9.8, gridX: 30, gridY: 20 },
  { id: "front-2", label: "Front Center", positionX: 0, positionY: 1.6, positionZ: 9.8, gridX: 50, gridY: 20 },
  { id: "front-3", label: "Front Right", positionX: 3, positionY: 1.6, positionZ: 9.8, gridX: 70, gridY: 20 },
  { id: "back-1", label: "Back Left", positionX: -3, positionY: 1.6, positionZ: -9.8, gridX: 30, gridY: 80 },
  { id: "back-2", label: "Back Center", positionX: 0, positionY: 1.6, positionZ: -9.8, gridX: 50, gridY: 80 },
  { id: "back-3", label: "Back Right", positionX: 3, positionY: 1.6, positionZ: -9.8, gridX: 70, gridY: 80 },
  { id: "left-1", label: "Left Front", positionX: -9.8, positionY: 1.6, positionZ: 3, gridX: 15, gridY: 35 },
  { id: "left-2", label: "Left Center", positionX: -9.8, positionY: 1.6, positionZ: 0, gridX: 15, gridY: 50 },
  { id: "left-3", label: "Left Back", positionX: -9.8, positionY: 1.6, positionZ: -3, gridX: 15, gridY: 65 },
  { id: "right-1", label: "Right Front", positionX: 9.8, positionY: 1.6, positionZ: 3, gridX: 85, gridY: 35 },
  { id: "right-2", label: "Right Center", positionX: 9.8, positionY: 1.6, positionZ: 0, gridX: 85, gridY: 50 },
  { id: "right-3", label: "Right Back", positionX: 9.8, positionY: 1.6, positionZ: -3, gridX: 85, gridY: 65 },
];

export default function GalleryLayoutEditorPage() {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();
  const { data: artworks, isLoading } = useMyArtworks();
  const { mutate: savePositions, isPending: isSaving } = useBulkUpdatePositions();

  const [viewMode, setViewMode] = useState<"2d" | "3d">("2d");
  const [positions, setPositions] = useState<Map<string, UpdateArtworkPositionRequest>>(new Map());
  const [selectedArtworkId, setSelectedArtworkId] = useState<string | null>(null);

  // التوجيه إلى تسجيل الدخول إذا لم يكن مصادقاً
  useEffect(() => {
    if (!isAuthenticated) {
      router.replace("/auth/login");
    }
  }, [isAuthenticated]);

  const resolvedArtworks: Artwork[] = (artworks ?? []).map((aw: Artwork) => {
    const local = positions.get(aw.id);
    return local ? { ...aw, ...local } : aw;
  });

  // ✅ إصلاح النوع الضمني لـ 'any' عبر تحديد النوع صراحةً
  const publishedArtworks = resolvedArtworks.filter((a: Artwork) => a.isPublished);

  // معالج وضع عمل على حائط
  const handlePlaceOnWall = (wallPosition: typeof WALL_POSITIONS[0]) => {
    if (!selectedArtworkId) {
      Alert.alert("Select Artwork", "Please tap an artwork from the list first.");
      return;
    }
    const base = artworks?.find((a: Artwork) => a.id === selectedArtworkId);
    let rotationY = 0;
    if (wallPosition.positionX > 0) rotationY = -Math.PI / 2;
    else if (wallPosition.positionX < 0) rotationY = Math.PI / 2;
    else if (wallPosition.positionZ > 0) rotationY = Math.PI;

    const current = positions.get(selectedArtworkId) ?? {};
    const merged: UpdateArtworkPositionRequest = {
      artworkId: selectedArtworkId,
      positionX: wallPosition.positionX,
      positionY: wallPosition.positionY,
      positionZ: wallPosition.positionZ,
      rotationX: base?.rotationX ?? 0,
      rotationY: rotationY,
      rotationZ: base?.rotationZ ?? 0,
      scaleX: base?.scaleX ?? 1,
      scaleY: base?.scaleY ?? 1,
      scaleZ: base?.scaleZ ?? 1,
      ...current,
    };
    setPositions((prev) => new Map(prev).set(selectedArtworkId, merged));
    setSelectedArtworkId(null); // إلغاء التحديد بعد الوضع
  };

  // إزالة عمل من الحائط
  const removeFromWall = (artworkId: string) => {
    setPositions((prev) => {
      const newMap = new Map(prev);
      newMap.delete(artworkId);
      return newMap;
    });
  };

  // حفظ التخطيط
  const handleSave = () => {
    const updatedPositions = Array.from(positions.values());
    if (updatedPositions.length === 0) {
      Alert.alert("No changes", "Nothing to save.");
      return;
    }
    savePositions(updatedPositions, {
      onSuccess: () => {
        Alert.alert("Saved", "Layout saved successfully!");
        setPositions(new Map());
      },
      onError: () => {
        Alert.alert("Error", "Failed to save layout.");
      },
    });
  };

  // مسح كل المواقع
  const clearAll = () => {
    if (positions.size === 0) return;
    Alert.alert("Clear All", "Clear all positions?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Clear",
        style: "destructive",
        onPress: () => setPositions(new Map()),
      },
    ]);
  };

  // الانتقال إلى المعاينة الثلاثية الأبعاد
  const preview3D = () => {
    if (user?.id) {
      router.push(`/galleries/${user.id}/3d`);
    } else {
      Alert.alert("Error", "User ID not found.");
    }
  };

  if (isLoading) {
    return <PageLoader message="Loading artworks..." />;
  }

  return (
    <View className="flex-1 bg-stone-50">
      {/* Header */}
      <View className="px-4 pt-4 pb-2 bg-white border-b border-stone-200">
        <Text className="font-display text-xl font-bold text-stone-800">
          Gallery Layout Editor
        </Text>
        <Text className="text-xs text-stone-500 mt-1">
          {viewMode === "2d"
            ? "Tap an artwork, then tap a wall spot to place it."
            : "Preview your layout in 3D space."}
        </Text>
        <View className="flex-row gap-2 mt-3">
          <Button
            variant="secondary"
            size="sm"
            onPress={() => setViewMode(viewMode === "2d" ? "3d" : "2d")}
            leftIcon={<Ionicons name={viewMode === "2d" ? "cube-outline" : "grid-outline"} size={16} color="#44403c" />}
          >
            {viewMode === "2d" ? "Preview 3D" : "Back to 2D"}
          </Button>
          <Button variant="secondary" size="sm" onPress={clearAll}>
            Clear All
          </Button>
          <Button size="sm" onPress={handleSave} isLoading={isSaving}>
            Save Layout
          </Button>
        </View>
      </View>

      {viewMode === "2d" ? (
        <View className="flex-1 flex-row">
          {/* قائمة الأعمال (اللوحات الفنية) */}
          <View className="w-1/3 bg-white border-r border-stone-100 p-2">
            <Text className="text-xs font-semibold text-stone-500 mb-2 uppercase">Your Artworks</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              {publishedArtworks.length === 0 ? (
                <Text className="text-stone-400 text-xs text-center mt-4">
                  No published artworks.
                </Text>
              ) : (
                publishedArtworks.map((aw) => {
                  const isSelected = selectedArtworkId === aw.id;
                  const isPlaced = positions.has(aw.id);
                  return (
                    <TouchableOpacity
                      key={aw.id}
                      onPress={() => setSelectedArtworkId(isSelected ? null : aw.id)}
                      className={`p-2 rounded-lg mb-2 border ${
                        isSelected
                          ? "border-gallery-500 bg-gallery-50"
                          : "border-stone-200 bg-white"
                      }`}
                    >
                      {/* ✅ استخدام رابط الصورة مباشرة بدون دالة getImageUrl */}
                      <Image
                        source={{ uri: aw.imageUrl }}
                        className="w-full h-20 rounded-lg mb-1"
                        resizeMode="cover"
                      />
                      <Text className="text-[10px] font-medium text-stone-700 truncate">
                        {aw.title}
                      </Text>
                      {isPlaced && (
                        <View className="absolute top-1 right-1 w-3 h-3 rounded-full bg-gallery-500" />
                      )}
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>
          </View>

          {/* خريطة الغرفة ثنائية الأبعاد */}
          <View className="flex-1 p-2">
            <View className="flex-1 bg-stone-100 rounded-xl border border-stone-300 relative">
              {/* تسميات الجدران */}
              <View className="absolute top-2 left-1/2 -translate-x-1/2 bg-white/80 px-2 py-1 rounded-full">
                <Text className="text-[10px] font-medium text-stone-600">FRONT WALL</Text>
              </View>
              <View className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-white/80 px-2 py-1 rounded-full">
                <Text className="text-[10px] font-medium text-stone-600">BACK WALL</Text>
              </View>
              <View className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 px-2 py-1 rounded-full">
                <Text className="text-[10px] font-medium text-stone-600">LEFT</Text>
              </View>
              <View className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 px-2 py-1 rounded-full">
                <Text className="text-[10px] font-medium text-stone-600">RIGHT</Text>
              </View>

              {/* نقاط الجدران */}
              {WALL_POSITIONS.map((pos) => {
                const artwork = publishedArtworks.find(
                  (aw: Artwork) => aw.positionX === pos.positionX && aw.positionZ === pos.positionZ
                );
                return (
                  <TouchableOpacity
                    key={pos.id}
                    onPress={() => handlePlaceOnWall(pos)}
                    style={{
                      position: "absolute",
                      left: `${pos.gridX}%`,
                      top: `${pos.gridY}%`,
                      transform: [{ translateX: -28 }, { translateY: -28 }],
                    }}
                    className="w-14 h-14"
                  >
                    {artwork ? (
                      <View className="relative">
                        <Image
                          source={{ uri: artwork.imageUrl }}
                          className="w-14 h-14 rounded-lg border-2 border-gallery-500"
                          resizeMode="cover"
                        />
                        <TouchableOpacity
                          onPress={(e) => {
                            e.stopPropagation?.();
                            removeFromWall(artwork.id);
                          }}
                          className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full items-center justify-center"
                        >
                          <Ionicons name="close" size={12} color="white" />
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <View className="w-14 h-14 rounded-lg border-2 border-dashed border-stone-400 bg-stone-50 items-center justify-center">
                        <Ionicons name="add" size={24} color="#a8a29e" />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}

              {/* مركز الغرفة */}
              <View className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white/90 px-3 py-1 rounded-full border border-stone-200">
                <Text className="text-[10px] text-stone-400">Center</Text>
              </View>
            </View>
          </View>
        </View>
      ) : (
        // وضع 3D: نعرض رسالة مع زر للانتقال إلى المعرض الافتراضي
        <View className="flex-1 bg-white items-center justify-center p-6">
          <Ionicons name="cube-outline" size={64} color="#8b5cf6" />
          <Text className="text-lg font-semibold text-stone-800 mt-4">3D Preview</Text>
          <Text className="text-sm text-stone-500 text-center mt-2">
            The 3D preview is available in the virtual gallery. This will show exactly how your
            artworks appear.
          </Text>
          <Button
            onPress={preview3D}
            size="md"
            className="mt-6"
            leftIcon={<Ionicons name="eye-outline" size={18} color="white" />}
          >
            Open Full 3D Gallery
          </Button>
        </View>
      )}
    </View>
  );
}