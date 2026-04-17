import { View, Text, ScrollView, Image } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useOrder } from "@/hooks/useOrders";
import { formatPrice, formatDate } from "@/utils/helpers";
import { PageLoader } from "@/components/common/Spinner";

export default function OrderDetailsPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: order, isLoading } = useOrder(id!);

  if (isLoading) return <PageLoader />;
  if (!order) return <Text>Order not found</Text>;

  return (
    <ScrollView className="flex-1 bg-stone-50 p-4">
      <View className="bg-white rounded-xl p-4 mb-4">
        <Text className="font-display text-xl font-bold text-stone-800 mb-2">Order Details</Text>
        <Text className="text-stone-500">Order #{order.id.slice(0, 8).toUpperCase()}</Text>
        <Text className="text-stone-500">{formatDate(order.createdAt)}</Text>
        <View
          className={`self-start px-3 py-1 rounded-full mt-2 ${
            order.status === "completed" ? "bg-emerald-100" : "bg-amber-100"
          }`}
        >
          <Text className={order.status === "completed" ? "text-emerald-700" : "text-amber-700"}>
            {order.status}
          </Text>
        </View>
      </View>

      <View className="bg-white rounded-xl p-4 mb-4">
        <Text className="font-semibold text-stone-800 mb-3">Items</Text>
        {order.items.map((item, idx) => (
          <View
            key={item.id}
            className={`flex-row py-3 ${idx !== order.items.length - 1 ? "border-b border-stone-100" : ""}`}
          >
            <Image source={{ uri: item.imageUrl }} className="w-16 h-16 rounded-lg" />
            <View className="flex-1 ml-3">
              <Text className="font-medium text-stone-800">{item.title}</Text>
              <Text className="text-xs text-stone-500">{item.artistName}</Text>
              <Text className="text-sm text-stone-600 mt-1">
                {formatPrice(item.price)} x {item.quantity}
              </Text>
            </View>
            <Text className="font-semibold text-stone-800">{formatPrice(item.price * item.quantity)}</Text>
          </View>
        ))}
      </View>

      <View className="bg-white rounded-xl p-4">
        <View className="flex-row justify-between py-2">
          <Text className="text-stone-500">Subtotal</Text>
          <Text className="text-stone-700">{formatPrice(order.totalAmount)}</Text>
        </View>
        <View className="flex-row justify-between py-2">
          <Text className="text-stone-500">Shipping</Text>
          <Text className="text-emerald-600">Free</Text>
        </View>
        <View className="flex-row justify-between pt-3 mt-2 border-t border-stone-200">
          <Text className="font-bold text-stone-800">Total</Text>
          <Text className="font-bold text-gallery-600 text-lg">{formatPrice(order.totalAmount)}</Text>
        </View>
      </View>
    </ScrollView>
  );
}