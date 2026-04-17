import { TouchableOpacity, Text, Alert } from "react-native";
import { useRouter } from "expo-router";
import { useCartStore } from "@/store/cartStore";
import { useAuthStore } from "@/store/authStore";

export function CheckoutButton() {
  const { items } = useCartStore();
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();

  const handleCheckout = () => {
    if (!isAuthenticated) {
      Alert.alert("Login required", "Please sign in to checkout.");
      router.push("/login");
      return;
    }
    if (items.length === 0) {
      Alert.alert("Cart empty", "Add some artworks to your cart first.");
      return;
    }
    router.push("/checkout");
  };

  return (
    <TouchableOpacity onPress={handleCheckout} className="bg-gallery-600 py-4 rounded-xl">
      <Text className="text-white text-center font-bold text-lg">Proceed to Checkout</Text>
    </TouchableOpacity>
  );
}