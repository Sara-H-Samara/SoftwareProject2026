import { View, Text, ScrollView, TouchableOpacity, Image } from "react-native";
import { Link } from "expo-router";
import { useAuthStore } from "@/store/authStore";
import { useMyArtworks } from "@/hooks/useArtworks";
import { ROUTES } from "@/utils/constants";
import { Spinner } from "@/components/common/Spinner";
import { Button } from "@/components/common/Button";
import { Ionicons } from "@expo/vector-icons";
import type { Artwork } from "@/types";

export default function DashboardOverviewPage() {
  const { user } = useAuthStore();
  const { data: artworks, isLoading } = useMyArtworks();

  const publishedCount = artworks?.filter((a: Artwork) => a.isPublished).length ?? 0;
  const draftCount = (artworks?.length ?? 0) - publishedCount;

  const stats = [
    { label: "Total artworks", value: artworks?.length ?? 0, icon: "images-outline", color: "#9333ea" },
    { label: "Published", value: publishedCount, icon: "eye-outline", color: "#10b981" },
    { label: "Drafts", value: draftCount, icon: "cube-outline", color: "#f59e0b" },
  ];

  const quickActions = [
    {
      href: "/dashboard/dashboard/upload",
      label: "Upload artwork",
      description: "Add a new piece to your collection",
      icon: "cloud-upload-outline",
      primary: true,
    },
    {
      href: "/dashboard/dashboard/layout",
      label: "Edit gallery layout",
      description: "Arrange your artworks in 3D space",
      icon: "grid-outline",
      primary: false,
    },
    {
      href: `/galleries/${user?.id}/3d`,
      label: "Preview your gallery",
      description: "See it as visitors will",
      icon: "cube-outline",
      primary: false,
    },
  ];

  return (
    <ScrollView className="flex-1 bg-stone-50" contentContainerStyle={{ padding: 16 }}>
      {/* Welcome header */}
      <View className="bg-white rounded-2xl p-5 border border-stone-100 mb-5">
        <Text className="font-display text-2xl font-bold text-stone-800">
          Welcome back{user?.displayName ? `, ${user.displayName}` : ""}
        </Text>
        <Text className="text-stone-500 mt-1 text-sm">
          {user?.galleryName ? `Managing "${user.galleryName}"` : "Set your gallery name in Profile settings"}
        </Text>
      </View>

      {/* Stats row */}
      <View className="flex-row gap-3 mb-6">
        {stats.map((stat) => (
          <View key={stat.label} className="flex-1 bg-white rounded-xl p-4 border border-stone-100">
            <Ionicons name={stat.icon as any} size={22} color={stat.color} />
            {isLoading ? (
              <Spinner size="small" />
            ) : (
              <Text className="text-2xl font-bold text-stone-800 mt-2">{stat.value}</Text>
            )}
            <Text className="text-xs text-stone-500 mt-1">{stat.label}</Text>
          </View>
        ))}
      </View>

      {/* Quick actions */}
      <Text className="text-sm font-semibold text-stone-500 uppercase tracking-wider mb-3">Quick Actions</Text>
      <View className="gap-3 mb-6">
        {quickActions.map((action) => (
          <Link key={action.href} href={action.href} asChild>
            <TouchableOpacity
              className={`bg-white rounded-xl p-4 border flex-row items-center ${
                action.primary ? "border-gallery-200" : "border-stone-100"
              }`}
            >
              <View
                className={`w-10 h-10 rounded-xl items-center justify-center mr-4 ${
                  action.primary
                    ? "bg-gradient-to-br from-gallery-500 to-purple-600"
                    : "bg-stone-100"
                }`}
              >
                <Ionicons
                  name={action.icon as any}
                  size={22}
                  color={action.primary ? "white" : "#9333ea"}
                />
              </View>
              <View className="flex-1">
                <Text className="font-semibold text-stone-800">{action.label}</Text>
                <Text className="text-xs text-stone-500 mt-0.5">{action.description}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#a8a29e" />
            </TouchableOpacity>
          </Link>
        ))}
      </View>

      {/* Recent artworks preview */}
      {!isLoading && artworks && artworks.length > 0 && (
        <>
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-sm font-semibold text-stone-500 uppercase tracking-wider">
              Recent Artworks
            </Text>
            <Link href="/dashboard/dashboard/artworks" asChild>
              <TouchableOpacity className="flex-row items-center gap-1">
                <Text className="text-xs text-gallery-600 font-medium">View all</Text>
                <Ionicons name="arrow-forward" size={14} color="#9333ea" />
              </TouchableOpacity>
            </Link>
          </View>
          <View className="flex-row flex-wrap gap-3">
            {artworks.slice(0, 5).map((aw: Artwork) => (
              <Link key={aw.id} href={`/artwork/${aw.id}`} asChild>
                <TouchableOpacity className="w-[31%] aspect-square rounded-xl overflow-hidden bg-stone-100 border border-stone-100">
                  <Image source={{ uri: aw.imageUrl }} className="w-full h-full" resizeMode="cover" />
                  {!aw.isPublished && (
                    <View className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded-md bg-amber-100">
                      <Text className="text-[10px] text-amber-700 font-medium">Draft</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </Link>
            ))}
          </View>
        </>
      )}
    </ScrollView>
  );
}