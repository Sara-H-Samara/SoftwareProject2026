import { View, Text, ScrollView, TouchableOpacity, Image } from "react-native";
import { Link } from "expo-router";
import { useAuthStore } from "@/store/authStore";
import { useMyArtworks } from "@/hooks/useArtworks";
import { Spinner } from "@/components/common/Spinner";
import { Ionicons } from "@expo/vector-icons";
import type { Artwork } from "@/types";

export default function DashboardOverviewPage() {
  const { user } = useAuthStore();
  const { data: artworks, isLoading } = useMyArtworks();

  const publishedCount = artworks?.filter((a: Artwork) => a.isPublished).length ?? 0;
  const draftCount = (artworks?.length ?? 0) - publishedCount;

  return (
    <ScrollView className="flex-1 bg-stone-50 p-4" showsVerticalScrollIndicator={false}>
      <View className="bg-white rounded-2xl p-5 border border-stone-100 mb-5">
        <Text className="font-display text-2xl font-bold text-stone-800">
          Welcome back{user?.displayName ? `, ${user.displayName}` : ""}
        </Text>
        <Text className="text-stone-500 mt-1 text-sm">
          {user?.galleryName ? `Managing "${user.galleryName}"` : "Set your gallery name in Profile"}
        </Text>
      </View>

      <View className="flex-row gap-4 mb-6">
        <View className="flex-1 bg-white rounded-xl p-4 border border-stone-100 items-center">
          <Ionicons name="images-outline" size={24} color="#9333ea" />
          {isLoading ? (
            <Spinner size="small" />
          ) : (
            <Text className="text-2xl font-bold text-stone-800 mt-2">{artworks?.length ?? 0}</Text>
          )}
          <Text className="text-xs text-stone-500">Total</Text>
        </View>
        <View className="flex-1 bg-white rounded-xl p-4 border border-stone-100 items-center">
          <Ionicons name="eye-outline" size={24} color="#10b981" />
          <Text className="text-2xl font-bold text-stone-800 mt-2">{publishedCount}</Text>
          <Text className="text-xs text-stone-500">Published</Text>
        </View>
        <View className="flex-1 bg-white rounded-xl p-4 border border-stone-100 items-center">
          <Ionicons name="cube-outline" size={24} color="#f59e0b" />
          <Text className="text-2xl font-bold text-stone-800 mt-2">{draftCount}</Text>
          <Text className="text-xs text-stone-500">Drafts</Text>
        </View>
      </View>

      <Text className="text-sm font-semibold text-stone-500 uppercase tracking-wider mb-3">Quick Actions</Text>
      <View className="gap-3 mb-6">
        <QuickAction href="/dashboard/dashboard/upload" icon="cloud-upload-outline" label="Upload artwork" desc="Add a new piece" primary />
        <QuickAction href="/dashboard/dashboard/layout" icon="grid-outline" label="Edit gallery layout" desc="Arrange in 3D" />
        <QuickAction href={`/galleries/${user?.id}/3d`} icon="cube-outline" label="Preview your gallery" desc="See it as visitors will" />
      </View>

      {!isLoading && artworks && artworks.length > 0 && (
        <>
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-sm font-semibold text-stone-500 uppercase">Recent Artworks</Text>
            <Link href="/dashboard/dashboard/artworks" asChild>
              <TouchableOpacity>
                <Text className="text-xs text-gallery-600">View all</Text>
              </TouchableOpacity>
            </Link>
          </View>
          <View className="flex-row flex-wrap gap-3 mb-8">
            {artworks.slice(0, 5).map((aw: Artwork) => (
              <Link key={aw.id} href={`/artwork/${aw.id}`} asChild>
                <TouchableOpacity className="w-[31%] aspect-square rounded-xl overflow-hidden bg-stone-100 border border-stone-100">
                  <Image source={{ uri: aw.imageUrl }} className="w-full h-full" resizeMode="cover" />
                  {!aw.isPublished && (
                    <View className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded-md bg-amber-100">
                      <Text className="text-[10px] text-amber-700">Draft</Text>
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

function QuickAction({ href, icon, label, desc, primary = false }: any) {
  return (
    <Link href={href} asChild>
      <TouchableOpacity className={`bg-white rounded-xl p-4 border flex-row items-center ${primary ? 'border-gallery-200' : 'border-stone-100'}`}>
        <View className={`w-10 h-10 rounded-xl items-center justify-center mr-4 ${primary ? 'bg-gradient-to-br from-gallery-500 to-purple-600' : 'bg-stone-100'}`}>
          <Ionicons name={icon as any} size={22} color={primary ? 'white' : '#9333ea'} />
        </View>
        <View className="flex-1">
          <Text className="font-semibold text-stone-800">{label}</Text>
          <Text className="text-xs text-stone-500">{desc}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#a8a29e" />
      </TouchableOpacity>
    </Link>
  );
}