import { ActivityIndicator, View, Text } from "react-native";

export function Spinner({ size = "small" }: { size?: "small" | "large" }) {
  return <ActivityIndicator size={size} color="#8b5cf6" />;
}

export function PageLoader({ message = "Loading..." }: { message?: string }) {
  return (
    <View className="flex-1 items-center justify-center gap-4 bg-stone-50">
      <Spinner size="large" />
      <Text className="text-stone-500">{message}</Text>
    </View>
  );
}

export function SkeletonCard({ variant = "gallery" }: { variant?: "gallery" | "profile" }) {
  if (variant === "profile") {
    return (
      <View className="bg-white rounded-2xl border border-stone-100 shadow-card p-4 animate-pulse">
        <View className="flex-row gap-3">
          <View className="w-12 h-12 rounded-full bg-stone-200" />
          <View className="flex-1 gap-2">
            <View className="h-4 w-3/4 bg-stone-200 rounded" />
            <View className="h-3 w-1/2 bg-stone-200 rounded" />
          </View>
        </View>
      </View>
    );
  }

  return (
    <View className="bg-white rounded-2xl overflow-hidden border border-stone-100 shadow-card animate-pulse">
      <View className="aspect-[4/3] bg-stone-200" />
      <View className="p-4 gap-2">
        <View className="h-4 w-3/4 bg-stone-200 rounded" />
        <View className="h-3 w-1/2 bg-stone-200 rounded" />
      </View>
    </View>
  );
}