import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { useState } from "react";
import { ActivityFeed } from "@/components/activity/ActivityFeed";
import { Ionicons } from "@expo/vector-icons";

const FILTERS = [
  { value: "all", label: "All", icon: "📋" },
  { value: "like", label: "Likes", icon: "❤️" },
  { value: "follow", label: "Follows", icon: "👥" },
  { value: "comment", label: "Comments", icon: "💬" },
  { value: "review", label: "Reviews", icon: "⭐" },
] as const;

type FilterValue = (typeof FILTERS)[number]["value"];

export default function ActivityPage() {
  const [filter, setFilter] = useState<FilterValue>("all");
  const [showFilters, setShowFilters] = useState(false);

  return (
    <View className="flex-1 bg-stone-50">
      <View className="bg-white border-b border-stone-200 px-4 py-3">
        <View className="flex-row justify-between items-center">
          <Text className="font-display text-xl font-bold text-stone-800">Activity</Text>
          <TouchableOpacity
            onPress={() => setShowFilters(!showFilters)}
            className="flex-row items-center gap-1 bg-stone-100 px-3 py-1.5 rounded-full"
          >
            <Text className="text-stone-600">{FILTERS.find((f) => f.value === filter)?.label}</Text>
            <Ionicons name="chevron-down" size={16} color="#78716c" />
          </TouchableOpacity>
        </View>
        {showFilters && (
          <View className="mt-3 flex-row flex-wrap gap-2">
            {FILTERS.map((f) => (
              <TouchableOpacity
                key={f.value}
                onPress={() => {
                  setFilter(f.value);
                  setShowFilters(false);
                }}
                className={`px-4 py-2 rounded-full ${
                  filter === f.value ? "bg-gallery-600" : "bg-stone-100"
                }`}
              >
                <Text className={filter === f.value ? "text-white" : "text-stone-600"}>
                  {f.icon} {f.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
      <ActivityFeed filter={filter === "all" ? undefined : filter} />
    </View>
  );
}