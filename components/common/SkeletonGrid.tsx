import { View } from "react-native";
import { SkeletonCard } from "./SkeletonCard";

export function SkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <View className="flex-row flex-wrap gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} className="flex-1 min-w-[45%]">
          <SkeletonCard />
        </View>
      ))}
    </View>
  );
}