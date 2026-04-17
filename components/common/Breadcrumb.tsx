import { View, Text, TouchableOpacity } from "react-native";
import { usePathname, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export function Breadcrumb() {
  const pathname = usePathname();
  const router = useRouter();
  if (pathname === "/") return null;

  const segments = pathname.split("/").filter(Boolean);
  const items = segments.map((seg, i) => {
    const path = "/" + segments.slice(0, i + 1).join("/");
    const label = seg.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
    return { label, path };
  });

  return (
    <View className="flex-row items-center py-2 px-4 bg-white border-b border-stone-100">
      <TouchableOpacity onPress={() => router.push("/")}>
        <Ionicons name="home-outline" size={18} color="#78716c" />
      </TouchableOpacity>
      {items.map((item, idx) => (
        <View key={item.path} className="flex-row items-center">
          <Text className="mx-2 text-stone-400">/</Text>
          <TouchableOpacity onPress={() => router.push(item.path)} disabled={idx === items.length - 1}>
            <Text
              className={`${idx === items.length - 1 ? "text-stone-800 font-medium" : "text-stone-500"}`}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );
}