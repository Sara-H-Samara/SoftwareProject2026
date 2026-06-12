import { View, Text, ScrollView, Image, TouchableOpacity } from "react-native";
import { useLocalSearchParams, Link, useRouter } from "expo-router";
import { useArtistGallery, useArtistArtworks } from "@/hooks/useGallery";
import { useArtistStats } from "@/hooks/useFollows";
import { useArtworkReviews } from "@/hooks/useReviews";
import { PageLoader } from "@/components/common/Spinner";
import { LikeButton } from "@/components/likes/LikeButton";
import { FollowButton } from "@/components/follows/FollowButton";
import { RatingStars } from "@/components/reviews/RatingStars";
import { formatPrice, getInitials } from "@/utils/helpers";
import { Button } from "@/components/common/Button";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import type { Artwork } from "@/types";

// Component to display artwork card with its own rating fetch
function ArtworkCard({ artwork }: { artwork: Artwork }) {
  const { data: reviews, isLoading: ratingLoading } = useArtworkReviews(artwork.id, 1, 5);
  const averageRating = !ratingLoading && reviews && reviews.length > 0
    ? reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length
    : 0;

  return (
    <Link href={`/artwork/${artwork.id}`} asChild>
      <TouchableOpacity className="w-[48%] bg-white rounded-xl overflow-hidden border border-stone-100">
        <Image source={{ uri: artwork.imageUrl }} className="w-full aspect-square" />
        <View className="p-2">
          <Text className="font-medium text-stone-800 truncate">{artwork.title}</Text>
          <View className="flex-row justify-between items-center mt-1">
            <LikeButton artworkId={artwork.id} size="sm" showCount />
            {ratingLoading ? (
              <View className="w-16 h-4 bg-stone-100 rounded" />
            ) : (
              <RatingStars rating={Math.round(averageRating)} size="sm" readonly />
            )}
          </View>
          {artwork.price != null && (
            <Text className="text-gallery-600 font-bold mt-1">{formatPrice(artwork.price)}</Text>
          )}
        </View>
      </TouchableOpacity>
    </Link>
  );
}

export default function GalleryLandingPage() {
  const { artistId } = useLocalSearchParams<{ artistId: string }>();
  const router = useRouter();
  const [filter, setFilter] = useState("All");

  const { data: gallery, isLoading: gLoad } = useArtistGallery(artistId!);
  const { data: artworks, isLoading: aLoad } = useArtistArtworks(artistId!);
  const { data: stats } = useArtistStats(artistId!);

  if (gLoad || aLoad) return <PageLoader />;
  if (!gallery) return <Text className="p-4 text-center">Gallery not found</Text>;

  const artworkList = artworks || [];
  const types = ["All", ...Array.from(new Set(artworkList.map(a => a.artworkType)))];
  const filtered = filter === "All" ? artworkList : artworkList.filter(a => a.artworkType === filter);

  return (
    <ScrollView className="flex-1 bg-stone-50">
      {/* Hero Section */}
      <View className="h-56 bg-stone-200">
        {artworkList[0] && (
          <Image source={{ uri: artworkList[0].imageUrl }} className="w-full h-full" resizeMode="cover" />
        )}
        <View className="absolute inset-0 bg-gradient-to-t from-stone-50 to-transparent" />
        <TouchableOpacity onPress={() => router.back()} className="absolute top-12 left-4 bg-white/80 rounded-full p-2">
          <Ionicons name="arrow-back" size={24} color="#44403c" />
        </TouchableOpacity>
      </View>

      {/* Profile Card */}
      <View className="px-4 -mt-16">
        <View className="bg-white rounded-2xl p-5 border border-stone-100 shadow-card">
          <View className="flex-row items-end gap-4">
            {gallery.profilePicUrl ? (
              <Image source={{ uri: gallery.profilePicUrl }} className="w-24 h-24 rounded-full border-4 border-white" />
            ) : (
              <View className="w-24 h-24 rounded-full bg-gradient-to-br from-gallery-500 to-purple-600 items-center justify-center border-4 border-white">
                <Text className="text-white text-3xl font-bold">{getInitials(gallery.displayName)}</Text>
              </View>
            )}
            <View className="flex-1">
              <Text className="font-display text-2xl font-bold text-stone-800">{gallery.galleryName || 'Untitled Gallery'}</Text>
              <Text className="text-gallery-600">by {gallery.displayName || 'Unknown Artist'}</Text>
            </View>
          </View>
          {gallery.bio && <Text className="text-stone-600 mt-4">{gallery.bio}</Text>}
          <View className="flex-col gap-3 mt-4">
            <Link href={`/galleries/${artistId}/3d`} asChild>
              <Button leftIcon={<Ionicons name="cube-outline" size={18} color="white" />}>
                Enter 3D Gallery
              </Button>
            </Link>
            <Link href={`/avatar-customize?next=/galleries/${artistId}/3d`} asChild>
              <Button variant="secondary" leftIcon={<Ionicons name="person-outline" size={18} color="#78716c" />}>
                Customize Avatar
              </Button>
            </Link>
            <FollowButton artistId={artistId!} size="md" />
          </View>
        </View>
      </View>

      {/* Stats */}
      {stats && (
        <View className="flex-row justify-around mt-6 px-4">
          <StatItem value={stats.totalArtworks} label="Artworks" icon="images-outline" />
    
          <StatItem value={stats.totalFollowers} label="Followers" icon="people-outline" />
         
        </View>
      )}

      {/* Filter Tabs */}
      {types.length > 1 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-6 px-4">
          {types.map(type => (
            <TouchableOpacity
              key={type}
              onPress={() => setFilter(type)}
              className={`px-4 py-2 mr-2 rounded-full border ${
                filter === type ? "bg-gallery-600 border-gallery-600" : "bg-white border-stone-200"
              }`}
            >
              <Text className={filter === type ? "text-white" : "text-stone-600"}>{type}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Artworks Grid */}
      <View className="p-4">
        <Text className="font-semibold text-stone-800 mb-3">
          {filtered.length} {filtered.length === 1 ? 'artwork' : 'artworks'}
        </Text>
        <View className="flex-row flex-wrap gap-3">
          {filtered.map(aw => (
            <ArtworkCard key={aw.id} artwork={aw} />
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

function StatItem({ value, label, icon }: { value: string | number; label: string; icon: string }) {
  return (
    <View className="items-center">
      <Ionicons name={icon as any} size={20} color="#8b5cf6" />
      <Text className="text-xl font-bold text-stone-800 mt-1">{value}</Text>
      <Text className="text-xs text-stone-500">{label}</Text>
    </View>
  );
}