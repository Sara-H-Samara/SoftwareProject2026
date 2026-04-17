import { View, Text } from "react-native";

const badgeConfig = {
  verified: { icon: "✓", color: "bg-blue-100 text-blue-700", label: "Verified" },
  top: { icon: "🏆", color: "bg-amber-100 text-amber-700", label: "Top Artist" },
  rising: { icon: "📈", color: "bg-emerald-100 text-emerald-700", label: "Rising Star" },
  popular: { icon: "🔥", color: "bg-orange-100 text-orange-700", label: "Popular" },
  master: { icon: "👑", color: "bg-purple-100 text-purple-700", label: "Master" },
};

interface BadgeProps {
  type: keyof typeof badgeConfig;
  size?: "sm" | "md" | "lg";
}

export function Badge({ type, size = "md" }: BadgeProps) {
  const config = badgeConfig[type];
  const sizeClasses = {
    sm: "text-[10px] px-1.5 py-0.5 gap-1",
    md: "text-xs px-2 py-1 gap-1.5",
    lg: "text-sm px-2.5 py-1.5 gap-2",
  };

  return (
    <View className={`${config.color} rounded-full flex-row items-center ${sizeClasses[size]}`}>
      <Text>{config.icon}</Text>
      <Text>{config.label}</Text>
    </View>
  );
}