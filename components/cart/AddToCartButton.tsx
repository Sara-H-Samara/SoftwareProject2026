import { TouchableOpacity, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useCartStore } from "@/store/cartStore";
import { useAuthStore } from "@/store/authStore";
import { useState } from "react";

interface AddToCartButtonProps {
  artworkId: string;
  title: string;
  imageUrl: string;
  artistName: string;
  price: number;
  size?: "sm" | "md" | "lg";
}

export function AddToCartButton({
  artworkId,
  title,
  imageUrl,
  artistName,
  price,
  size = "md",
}: AddToCartButtonProps) {
  const { addItem } = useCartStore();
  const { isAuthenticated } = useAuthStore();
  const [showSuccess, setShowSuccess] = useState(false);

  const handleAdd = () => {
    if (!isAuthenticated) {
      alert("Please login to add items to cart");
      return;
    }
    addItem({ artworkId, title, imageUrl, artistName, price });
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);
  };

  const sizes = {
    sm: "px-3 py-1.5",
    md: "px-4 py-2.5",
    lg: "px-6 py-3",
  };

  return (
    <View>
      <TouchableOpacity
        onPress={handleAdd}
        className={`bg-gallery-600 rounded-xl flex-row items-center justify-center gap-2 ${sizes[size]}`}
      >
        <Ionicons name="cart-outline" size={18} color="white" />
        <Text className="text-white font-medium">Add to Cart</Text>
      </TouchableOpacity>
      {showSuccess && (
        <View className="absolute -top-10 left-0 right-0 bg-green-500 px-3 py-1.5 rounded-lg">
          <Text className="text-white text-xs text-center">Added to cart!</Text>
        </View>
      )}
    </View>
  );
}