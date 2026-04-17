import { View, Text, FlatList, TouchableOpacity } from "react-native";
import { Link } from "expo-router";
import { useOrders } from "@/hooks/useOrders";
import { formatPrice, formatDate } from "@/utils/helpers";
import { PageLoader } from "@/components/common/Spinner";
import { Ionicons } from "@expo/vector-icons";

export default function OrderHistoryPage() {
  const { data: orders, isLoading } = useOrders();

  if (isLoading) return <PageLoader />;

  if (!orders?.length) {
    return (
      <View className="flex-1 bg-stone-50 justify-center items-center p-6">
        <Ionicons name="receipt-outline" size={64} color="#d6d3d1" />
        <Text className="text-xl font-semibold text-stone-800 mt-4">No orders yet</Text>
        <Text className="text-stone-500 text-center mt-2">You haven't placed any orders.</Text>
        <Link href="/galleries" asChild>
          <TouchableOpacity className="mt-6 bg-gallery-600 px-6 py-3 rounded-xl">
            <Text className="text-white font-medium">Browse artworks</Text>
          </TouchableOpacity>
        </Link>
      </View>
    );
  }

  return (
    <FlatList
      data={orders}
      keyExtractor={(item) => item.id}
      contentContainerStyle={{ padding: 16 }}
      renderItem={({ item }) => (
        <Link href={`/orders/${item.id}`} asChild>
          <TouchableOpacity className="bg-white rounded-xl p-4 mb-3 border border-stone-100">
            <View className="flex-row justify-between items-center">
              <View>
                <Text className="text-xs text-stone-400">Order #{item.id.slice(0, 8).toUpperCase()}</Text>
                <Text className="text-stone-600 mt-1">{formatDate(item.createdAt)}</Text>
              </View>
              <View className="items-end">
                <Text className="font-bold text-gallery-600">{formatPrice(item.totalAmount)}</Text>
                <View
                  className={`px-2 py-0.5 rounded-full mt-1 ${
                    item.status === "completed" ? "bg-emerald-100" : "bg-amber-100"
                  }`}
                >
                  <Text
                    className={`text-xs ${
                      item.status === "completed" ? "text-emerald-700" : "text-amber-700"
                    }`}
                  >
                    {item.status}
                  </Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        </Link>
      )}
    />
  );
}