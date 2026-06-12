import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  Dimensions,
} from "react-native";
import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useFocusEffect } from "expo-router";
import { LineChart, BarChart, PieChart } from "react-native-chart-kit";

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
  const [months] = useState(6);

  const screenWidth = Dimensions.get("window").width - 32;

  const {
    data: summary,
    isLoading,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["analytics-summary"],
    queryFn: async () => {
      console.log("📊 Fetching analytics summary...");
      const response = await api.get<AnalyticsSummary>(
        "/api/artworks/analytics/summary"
      );
      console.log("📊 Analytics data:", response.data);
      return response.data;
    },
    staleTime: 0,
    refetchOnMount: true,
  });

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

  const totalArtworks = summary?.totalArtworks ?? 0;
  const totalLikes = summary?.totalLikes ?? 0;
  const totalReviews = summary?.totalReviews ?? 0;
  const totalFollowers = summary?.totalFollowers ?? 0;
  const averageRating = summary?.averageRating ?? 0;
  const totalSales = summary?.totalSales ?? 0;
  const totalOrders = summary?.totalOrders ?? 0;

  const chartConfig = {
    backgroundGradientFrom: "#ffffff",
    backgroundGradientTo: "#ffffff",
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(147, 51, 234, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(68, 64, 60, ${opacity})`,
    propsForDots: {
      r: "4",
      strokeWidth: "2",
      stroke: "#9333ea",
    },
    propsForBackgroundLines: {
      stroke: "#e7e5e4",
    },
  };

  const performanceData = {
    labels: ["Art", "Likes", "Reviews", "Followers"],
    datasets: [
      {
        data: [
          Math.max(totalArtworks, 0),
          Math.max(totalLikes, 0),
          Math.max(totalReviews, 0),
          Math.max(totalFollowers, 0),
        ],
      },
    ],
  };

  const ordersData = {
    labels: ["Orders", "Reviews", "Rating"],
    datasets: [
      {
        data: [
          Math.max(totalOrders, 0),
          Math.max(totalReviews, 0),
          Math.max(Math.round(averageRating), 0),
        ],
      },
    ],
  };

  const pieData = [
    {
      name: "Likes",
      population: totalLikes,
      color: "#ef4444",
      legendFontColor: "#44403c",
      legendFontSize: 12,
    },
    {
      name: "Reviews",
      population: totalReviews,
      color: "#f59e0b",
      legendFontColor: "#44403c",
      legendFontSize: 12,
    },
    {
      name: "Followers",
      population: totalFollowers,
      color: "#10b981",
      legendFontColor: "#44403c",
      legendFontSize: 12,
    },
    {
      name: "Orders",
      population: totalOrders,
      color: "#6366f1",
      legendFontColor: "#44403c",
      legendFontSize: 12,
    },
  ].filter((item) => item.population > 0);

  if (isLoading && !summary) {
    return <PageLoader message="Loading analytics..." />;
  }

  return (
    <ScrollView
      className="flex-1 bg-stone-50 p-4"
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View className="flex-row justify-between items-center mb-6">
        <View>
          <Text className="font-display text-2xl font-bold text-stone-800">
            Analytics
          </Text>
          <Text className="text-stone-500 text-sm mt-0.5">
            Track your gallery performance
          </Text>

          {isFetching && !refreshing && (
            <Text className="text-xs text-gallery-500 mt-1">
              Updating...
            </Text>
          )}
        </View>

        <ExportButtons months={months} />
      </View>

      {/* Stats Cards */}
      <View className="flex-row flex-wrap gap-4 mb-6">
        <StatCard title="Total Artworks" value={totalArtworks} icon="🎨" />
        <StatCard title="Total Likes" value={totalLikes} icon="❤️" />
        <StatCard title="Followers" value={totalFollowers} icon="👥" />
        <StatCard title="Total Sales" value={formatPrice(totalSales)} icon="💰" />
      </View>

      {/* Line Chart */}
      <View className="bg-white rounded-2xl p-4 mb-4 border border-stone-100">
        <Text className="font-semibold text-stone-800 mb-3">
          Gallery Performance
        </Text>

        <LineChart
          data={performanceData}
          width={screenWidth - 32}
          height={220}
          chartConfig={chartConfig}
          bezier
          fromZero
          style={{
            borderRadius: 16,
          }}
        />
      </View>

      {/* Bar Chart */}
      <View className="bg-white rounded-2xl p-4 mb-4 border border-stone-100">
        <Text className="font-semibold text-stone-800 mb-3">
          Orders / Reviews / Rating
        </Text>

        <BarChart
          data={ordersData}
          width={screenWidth - 32}
          height={220}
          chartConfig={chartConfig}
          yAxisLabel=""
          yAxisSuffix=""
          fromZero
          showValuesOnTopOfBars
          style={{
            borderRadius: 16,
          }}
        />
      </View>

      {/* Pie Chart */}
      <View className="bg-white rounded-2xl p-4 mb-4 border border-stone-100">
        <Text className="font-semibold text-stone-800 mb-3">
          Engagement Distribution
        </Text>

        {pieData.length > 0 ? (
          <PieChart
            data={pieData}
            width={screenWidth - 32}
            height={220}
            chartConfig={chartConfig}
            accessor="population"
            backgroundColor="transparent"
            paddingLeft="10"
            absolute
          />
        ) : (
          <Text className="text-stone-500 text-center py-8">
            No engagement data yet
          </Text>
        )}
      </View>

      {/* Average Rating */}
      <View className="bg-white rounded-2xl p-5 mb-4 border border-stone-100">
        <Text className="font-semibold text-stone-800 mb-3">
          Average Rating
        </Text>

        <View className="items-center py-4">
          <Text className="text-5xl font-bold text-amber-500">
            {averageRating.toFixed(1)}
          </Text>

          <Text className="text-stone-500 mt-2">
            Based on {totalReviews} reviews
          </Text>
        </View>
      </View>

      {/* Order Summary */}
      <View className="bg-white rounded-2xl p-5 mb-8 border border-stone-100">
        <Text className="font-semibold text-stone-800 mb-3">
          Order Summary
        </Text>

        <View className="flex-row justify-around">
          <View className="items-center">
            <Text className="text-2xl font-bold text-gallery-600">
              {totalOrders}
            </Text>
            <Text className="text-xs text-stone-500 mt-1">
              Total Orders
            </Text>
          </View>

          <View className="items-center">
            <Text className="text-2xl font-bold text-emerald-600">
              {formatPrice(totalSales)}
            </Text>
            <Text className="text-xs text-stone-500 mt-1">
              Total Revenue
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

function StatCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: string | number;
  icon: string;
}) {
  return (
    <View className="bg-white rounded-xl p-4 border border-stone-100 flex-1 min-w-[45%]">
      <Text className="text-2xl mb-1">{icon}</Text>
      <Text className="text-xl font-bold text-stone-800">{value}</Text>
      <Text className="text-xs text-stone-500">{title}</Text>
    </View>
  );
}