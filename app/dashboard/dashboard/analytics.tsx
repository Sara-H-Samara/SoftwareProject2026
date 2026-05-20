import { View, Text, ScrollView, RefreshControl } from "react-native";
import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useFocusEffect } from "expo-router";
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
  const [refreshing, setRefreshing] = useState(false);
  const [months, setMonths] = useState(6);

  const { data: summary, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["analytics-summary"],
    queryFn: async () => {
      console.log("📊 Fetching analytics summary...");
      const response = await api.get<AnalyticsSummary>("/api/artworks/analytics/summary");
      console.log("📊 Analytics data:", response.data);
      return response.data;
    },
    staleTime: 0,           // البيانات تعتبر قديمة فوراً
    refetchOnMount: true,   // إعادة جلب عند تحميل المكون
    refetchOnWindowFocus: true,
  });

  // إعادة الجلب كلما ظهرت الشاشة (بعد العودة من الإعجاب أو التقييم)
  useFocusEffect(
    useCallback(() => {
      console.log("📊 Analytics screen focused, refetching...");
      refetch();
    }, [refetch])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  if (isLoading && !summary) return <PageLoader message="Loading analytics..." />;

  return (
    <ScrollView
      className="flex-1 bg-stone-50 p-4"
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View className="flex-row justify-between items-center mb-6">
        <View>
          <Text className="font-display text-2xl font-bold text-stone-800">Analytics</Text>
          <Text className="text-stone-500 text-sm mt-0.5">Track your gallery performance</Text>
          {isFetching && !refreshing && (
            <Text className="text-xs text-gallery-500 mt-1">Updating...</Text>
          )}
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