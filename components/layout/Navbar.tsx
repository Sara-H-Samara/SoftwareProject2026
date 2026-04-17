import { View, Text, TouchableOpacity } from "react-native";
import { Link, usePathname } from "expo-router";
import { useAuthStore } from "@/store/authStore";
import { useCartStore } from "@/store/cartStore";
import { Ionicons } from "@expo/vector-icons";

export function Navbar() {
  const { isAuthenticated, isArtist } = useAuthStore();
  const totalItems = useCartStore((s) => s.totalItems);
  const pathname = usePathname();

  const tabs = [
    { name: "Home", href: "/", icon: "home-outline", activeIcon: "home" },
    { name: "Galleries", href: "/galleries", icon: "images-outline", activeIcon: "images" },
    { name: "Search", href: "/search", icon: "search-outline", activeIcon: "search" },
    { name: "Activity", href: "/activity", icon: "pulse-outline", activeIcon: "pulse" },
    ...(isArtist ? [{ name: "Studio", href: "/dashboard/dashboard", icon: "brush-outline", activeIcon: "brush" }] : []),
  ];

  return (
    <View className="bg-white border-b border-stone-200 pt-10 pb-3 px-4 flex-row justify-between items-center">
      <Text className="font-display text-xl font-bold text-stone-800">Virtual Art Gallery</Text>
      <View className="flex-row items-center gap-4">
        <Link href="/notifications" asChild>
          <TouchableOpacity>
            <Ionicons name="notifications-outline" size={24} color="#78716c" />
          </TouchableOpacity>
        </Link>
        <Link href="/cart" asChild>
          <TouchableOpacity className="relative">
            <Ionicons name="cart-outline" size={24} color="#78716c" />
            {totalItems > 0 && (
              <View className="absolute -top-2 -right-2 bg-gallery-600 rounded-full w-5 h-5 items-center justify-center">
                <Text className="text-white text-xs font-bold">{totalItems}</Text>
              </View>
            )}
          </TouchableOpacity>
        </Link>
        {!isAuthenticated ? (
          <Link href="/auth/login" asChild>
            <TouchableOpacity>
              <Ionicons name="person-outline" size={24} color="#78716c" />
            </TouchableOpacity>
          </Link>
        ) : (
          <Link href={isArtist ? "/dashboard/dashboard/profile" : "/visitor/profile"} asChild>
            <TouchableOpacity>
              <Ionicons name="person-outline" size={24} color="#78716c" />
            </TouchableOpacity>
          </Link>
        )}
      </View>
    </View>
  );
}