import { View, Text, ScrollView, Image, TouchableOpacity, Alert } from "react-native";
import { Link, useRouter } from "expo-router";
import { useCartStore } from "@/store/cartStore";
import { useAuthStore } from "@/store/authStore";
import { formatPrice } from "@/utils/helpers";
import { Button } from "@/components/common/Button";
import { Ionicons } from "@expo/vector-icons";

export default function CartPage() {
  const { isAuthenticated } = useAuthStore();
  const { items, totalItems, totalPrice, updateQuantity, removeItem, clearCart } = useCartStore();
  const router = useRouter();

  if (!isAuthenticated) {
    return (
      <View className="flex-1 bg-stone-50 justify-center items-center p-6">
        <Ionicons name="cart-outline" size={64} color="#d6d3d1" />
        <Text className="font-display text-2xl font-bold text-stone-800 mt-4">Shopping Cart</Text>
        <Text className="text-stone-500 text-center mt-2 mb-6">Please sign in to view your cart.</Text>
        <Link href="/auth/login" asChild>
          <Button>Sign In</Button>
        </Link>
      </View>
    );
  }

  if (items.length === 0) {
    return (
      <View className="flex-1 bg-stone-50 justify-center items-center p-6">
        <Ionicons name="cart-outline" size={64} color="#d6d3d1" />
        <Text className="font-display text-2xl font-bold text-stone-800 mt-4">Your cart is empty</Text>
        <Text className="text-stone-500 text-center mt-2 mb-6">Add some artworks to get started.</Text>
        <Link href="/galleries" asChild>
          <Button>Browse Galleries</Button>
        </Link>
      </View>
    );
  }

  const handleCheckout = () => router.push("/checkout");

  return (
    <View className="flex-1 bg-stone-50">
      <ScrollView className="flex-1 p-4">
        <View className="flex-row items-center gap-2 mb-4">
          <Text className="font-display text-2xl font-bold text-stone-800">Shopping Cart</Text>
          <View className="bg-stone-100 px-3 py-1 rounded-full">
            <Text className="text-sm text-stone-500">{totalItems} {totalItems === 1 ? 'item' : 'items'}</Text>
          </View>
        </View>
        {items.map(item => (
          <View key={item.artworkId} className="bg-white rounded-xl p-4 mb-3 flex-row">
            <Image source={{ uri: item.imageUrl }} className="w-20 h-20 rounded-lg" />
            <View className="flex-1 ml-3">
              <Text className="font-semibold text-stone-800">{item.title}</Text>
              <Text className="text-xs text-stone-500">{item.artistName}</Text>
              <Text className="font-medium text-stone-700 mt-1">{formatPrice(item.price)}</Text>
            </View>
            <View className="flex-row items-center gap-1">
              <TouchableOpacity onPress={() => updateQuantity(item.artworkId, item.quantity - 1)}>
                <Ionicons name="remove-outline" size={18} color="#78716c" />
              </TouchableOpacity>
              <Text className="w-6 text-center">{item.quantity}</Text>
              <TouchableOpacity onPress={() => updateQuantity(item.artworkId, item.quantity + 1)}>
                <Ionicons name="add-outline" size={18} color="#78716c" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => removeItem(item.artworkId)} className="ml-1">
                <Ionicons name="trash-outline" size={18} color="#ef4444" />
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>
      <View className="p-4 border-t border-stone-200 bg-white">
        <View className="flex-row justify-between mb-2">
          <Text className="text-stone-500">Subtotal</Text>
          <Text className="font-medium">{formatPrice(totalPrice)}</Text>
        </View>
        <View className="flex-row justify-between mb-4">
          <Text className="text-stone-500">Shipping</Text>
          <Text className="text-emerald-600">Free</Text>
        </View>
        <Button onPress={handleCheckout} size="lg">Proceed to Checkout</Button>
        <TouchableOpacity onPress={clearCart} className="mt-3 self-center">
          <Text className="text-stone-400 text-sm">Clear Cart</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}