import { View, Text, TouchableOpacity } from "react-native";
import { Link } from "expo-router";
import { Button } from "@/components/common/Button";
import { Ionicons } from "@expo/vector-icons";

export default function CheckoutSuccessPage() {
  return (
    <View className="flex-1 bg-stone-50 justify-center items-center p-6">
      <View className="bg-green-100 w-20 h-20 rounded-full items-center justify-center mb-6">
        <Ionicons name="checkmark" size={40} color="#10b981" />
      </View>
      <Text className="font-display text-3xl font-bold text-stone-800 mb-2">Payment Successful!</Text>
      <Text className="text-stone-500 text-center mb-8">
        Thank you for your purchase. Your order has been confirmed.
      </Text>
      <Link href="/orders" asChild>
        <Button>View Order History</Button>
      </Link>
      <Link href="/galleries" asChild>
        <TouchableOpacity className="mt-4">
          <Text className="text-stone-500">Continue Shopping</Text>
        </TouchableOpacity>
      </Link>
    </View>
  );
}