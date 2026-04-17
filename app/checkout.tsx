import { View, Text, ScrollView , TouchableOpacity} from "react-native";
import { useCartStore } from "@/store/cartStore";
import { formatPrice } from "@/utils/helpers";
import { Button } from "@/components/common/Button";
import { Link } from "expo-router";

export default function CheckoutPage() {
  const { items, totalPrice, clearCart } = useCartStore();

  const handlePlaceOrder = () => {
    alert("Order placed successfully! (Demo)");
    clearCart();
  };

  return (
    <ScrollView className="flex-1 bg-stone-50 p-4">
      <Text className="font-display text-2xl font-bold text-stone-800 mb-6">Checkout</Text>

      <View className="bg-white rounded-xl p-4 mb-6">
        <Text className="font-semibold text-stone-800 mb-3">Order Summary</Text>
        {items.map((item) => (
          <View key={item.artworkId} className="flex-row justify-between py-2 border-b border-stone-100">
            <Text className="text-stone-700">
              {item.title} x {item.quantity}
            </Text>
            <Text className="text-stone-700">{formatPrice(item.price * item.quantity)}</Text>
          </View>
        ))}
        <View className="flex-row justify-between mt-4 pt-2">
          <Text className="font-semibold text-stone-800">Total</Text>
          <Text className="font-bold text-gallery-600">{formatPrice(totalPrice)}</Text>
        </View>
      </View>

      <Button onPress={handlePlaceOrder}>Place Order (Demo)</Button>

      <Link href="/cart" asChild>
        <TouchableOpacity className="mt-4 self-center">
          <Text className="text-stone-500">← Back to Cart</Text>
        </TouchableOpacity>
      </Link>
    </ScrollView>
  );
}