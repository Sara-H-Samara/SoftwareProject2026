import { View, Text, ScrollView, TouchableOpacity ,Image} from "react-native";
import { Link } from "expo-router";
import { useAuthStore } from "@/store/authStore";
import { useGalleries } from "@/hooks/useGallery";
import { ROUTES } from "@/utils/constants";
import { Button } from "@/components/common/Button";
import { SkeletonCard } from "@/components/common/Spinner";
import { FeaturedArtists } from "@/components/featured/FeaturedArtists";
import { RecentlyViewed } from "@/components/recently/RecentlyViewed";
import { Ionicons } from "@expo/vector-icons";

// Feature cards data (مطابقة للويب)
const features = [
  {
    icon: "cube-outline",
    title: "3D Virtual Galleries",
    description:
      "Walk through beautifully lit 3D gallery spaces. Every artist gets their own customisable room.",
  },
  {
    icon: "images-outline",
    title: "Showcase Your Work",
    description:
      "Upload paintings, sculptures, photography, and digital art. Arrange them exactly where you want.",
  },
  {
    icon: "sparkles-outline",
    title: "AI-Powered Descriptions",
    description:
      "Struggling to write about your art? Let AI suggest evocative descriptions based on your work.",
  },
];

export default function HomePage() {
  const { isAuthenticated, isArtist } = useAuthStore();
  const { data: galleriesData, isLoading } = useGalleries(1, 3);

  return (
    <ScrollView className="flex-1 bg-stone-50" showsVerticalScrollIndicator={false}>
      {/* ── Hero Section ───────────────────────────────────────────────────── */}
      <View className="relative min-h-[85vh] items-center justify-center px-4 py-12">
        {/* Decorative background orbs */}
        <View className="absolute top-1/4 left-1/4 w-96 h-96 bg-gallery-200/40 rounded-full blur-3xl" />
        <View className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-200/30 rounded-full blur-3xl" />

        <View className="items-center max-w-3xl">
          <View className="flex-row items-center gap-2 px-3 py-1.5 rounded-full bg-white/80 border border-gallery-200 mb-6">
            <View className="w-1.5 h-1.5 rounded-full bg-gallery-500" />
            <Text className="text-xs font-semibold text-gallery-700">
              Now in open beta — free for art students
            </Text>
          </View>

          <Text className="font-display text-5xl sm:text-6xl text-stone-900 text-center leading-tight">
            Your art deserves a{" "}
            <Text className="text-gallery-600">real gallery</Text>
          </Text>

          <Text className="text-lg text-stone-600 text-center mt-6 mb-10 max-w-xl leading-relaxed">
            Build your personal 3D virtual gallery in minutes. Share it with the world.
            No coding. No rent.
          </Text>

          <View className="flex-row gap-3 justify-center flex-wrap">
            {!isAuthenticated ? (
              <>
                <Link href="/auth/register" asChild>
                  <Button size="lg" rightIcon={<Ionicons name="arrow-forward" size={18} color="white" />}>
                    Create your gallery
                  </Button>
                </Link>
                <Link href={ROUTES.BROWSE_GALLERIES} asChild>
                  <Button size="lg" variant="secondary">
                    Browse galleries
                  </Button>
                </Link>
              </>
            ) : isArtist ? (
              <Link href={ROUTES.DASHBOARD} asChild>
                <Button size="lg" rightIcon={<Ionicons name="arrow-forward" size={18} color="white" />}>
                  Go to dashboard
                </Button>
              </Link>
            ) : (
              <Link href={ROUTES.BROWSE_GALLERIES} asChild>
                <Button size="lg" rightIcon={<Ionicons name="arrow-forward" size={18} color="white" />}>
                  Browse galleries
                </Button>
              </Link>
            )}
          </View>
        </View>
      </View>

      {/* ── Features Section ────────────────────────────────────────────────── */}
      <View className="bg-white py-16 px-4">
        <View className="max-w-7xl mx-auto">
          <Text className="font-display text-3xl text-stone-900 text-center mb-4">
            Everything you need to exhibit
          </Text>
          <Text className="text-stone-500 text-center mb-12 max-w-lg mx-auto">
            All the tools a modern artist needs, built into one beautiful platform.
          </Text>
          <View className="flex-col md:flex-row gap-6">
            {features.map((f) => (
              <View key={f.title} className="bg-white border border-stone-200 rounded-2xl p-6 mb-4 shadow-card">
                <View className="w-12 h-12 rounded-xl bg-gradient-to-br from-gallery-100 to-purple-100 border border-gallery-200 items-center justify-center mb-4">
                  <Ionicons name={f.icon as any} size={24} color="#8b5cf6" />
                </View>
                <Text className="font-semibold text-stone-800 text-lg mb-2">{f.title}</Text>
                <Text className="text-sm text-stone-500 leading-relaxed">{f.description}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* ── Recently Viewed Section ─────────────────────────────────────────── */}
      <RecentlyViewed />

      {/* ── Featured Galleries Section ──────────────────────────────────────── */}
      <View className="py-16 px-4 bg-stone-50">
        <View className="max-w-7xl mx-auto">
          <View className="flex-row justify-between items-end mb-8">
            <View>
              <Text className="font-display text-3xl text-stone-900">Featured galleries</Text>
              <Text className="text-stone-500 text-sm mt-1">Discover artists from around the world</Text>
            </View>
            <Link href={ROUTES.BROWSE_GALLERIES} asChild>
              <TouchableOpacity className="flex-row items-center gap-1">
                <Text className="text-gallery-600 font-medium">View all</Text>
                <Ionicons name="arrow-forward" size={16} color="#8b5cf6" />
              </TouchableOpacity>
            </Link>
          </View>

          {isLoading ? (
            <View className="flex-row gap-4">
              {[0, 1, 2].map((i) => (
                <View key={i} className="flex-1">
                  <SkeletonCard />
                </View>
              ))}
            </View>
          ) : (
            <View className="flex-row flex-wrap gap-4">
              {galleriesData?.galleries.slice(0, 3).map((gallery) => (
                <Link key={gallery.artistId} href={ROUTES.GALLERY(gallery.artistId)} asChild>
                  <TouchableOpacity className="bg-white rounded-2xl overflow-hidden border border-stone-100 shadow-card flex-1 min-w-[150px]">
                    <View className="aspect-[4/3] bg-stone-100">
                      {gallery.featuredArtworks[0] ? (
                        <Image
                          source={{ uri: gallery.featuredArtworks[0].imageUrl }}
                          className="w-full h-full"
                          resizeMode="cover"
                        />
                      ) : (
                        <View className="w-full h-full items-center justify-center">
                          <Ionicons name="images-outline" size={32} color="#d6d3d1" />
                        </View>
                      )}
                    </View>
                    <View className="p-4">
                      <Text className="font-semibold text-stone-800" numberOfLines={1}>
                        {gallery.galleryName || "Untitled Gallery"}
                      </Text>
                      <Text className="text-sm text-stone-500 mt-1">
                        {gallery.displayName} · {gallery.artworkCount} work{gallery.artworkCount !== 1 ? "s" : ""}
                      </Text>
                    </View>
                  </TouchableOpacity>
                </Link>
              ))}
            </View>
          )}
        </View>
      </View>

      {/* ── Featured Artists Section ─────────────────────────────────────────── */}
      <FeaturedArtists />

      {/* ── CTA Section (if not authenticated) ───────────────────────────────── */}
      {!isAuthenticated && (
        <View className="py-20 px-4 bg-gradient-to-br from-gallery-50 to-purple-50 items-center">
          <Text className="font-display text-3xl text-stone-900 text-center mb-4">
            Ready to open your gallery?
          </Text>
          <Text className="text-stone-500 text-center text-lg mb-8">
            Free for art students. No credit card required.
          </Text>
          <Link href={ROUTES.REGISTER} asChild>
            <Button size="lg">Start for free</Button>
          </Link>
        </View>
      )}

      {/* ── Footer ───────────────────────────────────────────────────────────── */}
      <View className="border-t border-stone-200 py-8 px-4 items-center bg-white">
        <Text className="text-sm text-stone-400">
          © {new Date().getFullYear()} Virtual Art Gallery. Built for art students everywhere.
        </Text>
      </View>
    </ScrollView>
  );
}