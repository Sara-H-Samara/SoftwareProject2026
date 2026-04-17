import { View } from "react-native";

export function SkeletonCard() {
  return (
    <View className="bg-white rounded-xl overflow-hidden border border-stone-100">
      <View className="aspect-[4/3] bg-stone-200 animate-pulse" />
      <View className="p-4 space-y-2">
        <View className="h-4 w-3/4 bg-stone-200 rounded animate-pulse" />
        <View className="h-3 w-1/2 bg-stone-200 rounded animate-pulse" />
      </View>
    </View>
  );
}