import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/api/axiosInstance";
import { PageLoader } from "@/components/common/Spinner";
import { formatPrice } from "@/utils/helpers";
import { ExportButtons } from "@/components/analytics/ExportButtons";

interface AnalyticsSummary {
  totalArtworks: number;
  totalLikes: number;
  totalReviews: number;
  totalFollowers: number;
  averageRating: number;
  totalSales: number;
  totalOrders: number;
}

export default function AnalyticsPage() {
  const [months, setMonths] = useState(6);

  const { data: summary, isLoading } = useQuery({
    queryKey: ["analytics-summary"],
    queryFn: async () => (await api.get<AnalyticsSummary>("/api/artworks/analytics/summary")).data,
  });

  if (isLoading) return <PageLoader message="Loading analytics..." />;

  return (
    <ScrollView className="flex-1 bg-stone-50 p-4" showsVerticalScrollIndicator={false}>
      <View className="flex-row justify-between items-center mb-6">
        <View>
          <Text className="font-display text-2xl font-bold text-stone-800">Analytics</Text>
          <Text className="text-stone-500 text-sm mt-0.5">Track your gallery performance</Text>
        </View>
        <ExportButtons months={months} />
      </View>

      <View className="flex-row flex-wrap gap-4 mb-6">
        <StatCard title="Total Artworks" value={summary?.totalArtworks ?? 0} icon="🎨" />
        <StatCard title="Total Likes" value={summary?.totalLikes ?? 0} icon="❤️" />
        <StatCard title="Followers" value={summary?.totalFollowers ?? 0} icon="👥" />
        <StatCard title="Total Sales" value={formatPrice(summary?.totalSales ?? 0)} icon="💰" />
      </View>

      <View className="bg-white rounded-2xl p-5 mb-4 border border-stone-100">
        <Text className="font-semibold text-stone-800 mb-3">Average Rating</Text>
        <View className="items-center py-4">
          <Text className="text-5xl font-bold text-amber-500">
            {(summary?.averageRating ?? 0).toFixed(1)}
          </Text>
          <Text className="text-stone-500 mt-2">Based on {summary?.totalReviews ?? 0} reviews</Text>
        </View>
      </View>

      <View className="bg-white rounded-2xl p-5 border border-stone-100">
        <Text className="font-semibold text-stone-800 mb-3">Order Summary</Text>
        <View className="flex-row justify-around">
          <View className="items-center">
            <Text className="text-2xl font-bold text-gallery-600">{summary?.totalOrders ?? 0}</Text>
            <Text className="text-xs text-stone-500 mt-1">Total Orders</Text>
          </View>
          <View className="items-center">
            <Text className="text-2xl font-bold text-emerald-600">{formatPrice(summary?.totalSales ?? 0)}</Text>
            <Text className="text-xs text-stone-500 mt-1">Total Revenue</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

function StatCard({ title, value, icon }: { title: string; value: string | number; icon: string }) {
  return (
    <View className="bg-white rounded-xl p-4 border border-stone-100 flex-1 min-w-[45%]">
      <Text className="text-2xl mb-1">{icon}</Text>
      <Text className="text-xl font-bold text-stone-800">{value}</Text>
      <Text className="text-xs text-stone-500">{title}</Text>
    </View>
  );
}