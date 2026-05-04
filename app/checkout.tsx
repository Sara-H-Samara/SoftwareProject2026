import { View, Text, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { useCartStore } from "@/store/cartStore";
import { formatPrice } from "@/utils/helpers";
import { Button } from "@/components/common/Button";

export default function CheckoutPage() {
  const { items, totalPrice, clearCart } = useCartStore();
  const router = useRouter();

  const handlePlaceOrder = () => {
    alert("Order placed successfully! (Demo)");
    clearCart();
    router.push("/checkout-success");
  };

  return (
    <ScrollView className="flex-1 bg-stone-50 p-4" contentContainerStyle={{ paddingBottom: 40 }}>
      <Text className="font-display text-2xl font-bold text-stone-800 mb-6">Checkout</Text>
      <View className="bg-white rounded-2xl p-5 border border-stone-100 mb-6">
        <Text className="font-semibold text-stone-800 mb-4">Order Summary</Text>
        {items.map(item => (
          <View key={item.artworkId} className="flex-row justify-between py-2 border-b border-stone-100">
            <Text className="text-stone-700">{item.title} x {item.quantity}</Text>
            <Text className="text-stone-700">{formatPrice(item.price * item.quantity)}</Text>
          </View>
        ))}
        <View className="flex-row justify-between mt-4 pt-2 border-t border-stone-200">
          <Text className="font-semibold text-stone-800">Total</Text>
          <Text className="font-bold text-gallery-600 text-lg">{formatPrice(totalPrice)}</Text>
        </View>
      </View>
      <Button onPress={handlePlaceOrder} size="lg">Place Order (Demo)</Button>
    </ScrollView>
  );
}