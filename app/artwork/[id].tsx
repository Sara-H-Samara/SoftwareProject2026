import { useLocalSearchParams, useRouter, Link } from "expo-router";
import {
  ScrollView,
  View,
  Text,
  Image,
  TouchableOpacity,
  Alert,
  TextInput,
} from "react-native";
import { useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";

import { useArtwork } from "@/hooks/useArtworks";
import { useArtworkReviews, useCreateReview } from "@/hooks/useReviews";
import { useAuthStore } from "@/store/authStore";
import { PageLoader } from "@/components/common/Spinner";
import { formatPrice } from "@/utils/helpers";
import { Button } from "@/components/common/Button";
import { RatingStars } from "@/components/reviews/RatingStars";
import { useCartStore } from "@/store/cartStore";
import { useRecentlyViewedStore } from "@/store/recentlyViewedStore";
import { CommentSection } from "@/components/reviews/CommentSection";
import { ARView } from "@/components/ar/ARView";
import { ModelViewer3D } from "@/components/3d/ModelViewer3d";

export default function ArtworkDetailsPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const { user, isAuthenticated } = useAuthStore();
  const { data: artwork, isLoading: artworkLoading } = useArtwork(id!);
  const { data: reviews, refetch: refetchReviews } = useArtworkReviews(id!);

  const { mutate: createReview, isPending: isSubmittingReview } =
    useCreateReview();

  const addItem = useCartStore((s) => s.addItem);
  const addRecent = useRecentlyViewedStore((s) => s.addItem);

  const [showAR, setShowAR] = useState(false);
  const [show3D, setShow3D] = useState(false);

  const [userRating, setUserRating] = useState(0);
  const [userComment, setUserComment] = useState("");
  const [hasReviewed, setHasReviewed] = useState(false);

  useEffect(() => {
    if (artwork) {
      addRecent({
        id: artwork.id,
        title: artwork.title,
        imageUrl: artwork.imageUrl,
        artistName: artwork.artistName ?? "Unknown",
        artistId: artwork.artistId,
      });
    }
  }, [artwork, addRecent]);

  useEffect(() => {
    if (reviews && user) {
      const existing = reviews.find((r: any) => r.userId === user.id);

      if (existing) {
        setHasReviewed(true);
        setUserRating(existing.rating);
        setUserComment(existing.comment || "");
      } else {
        setHasReviewed(false);
        setUserRating(0);
        setUserComment("");
      }
    }
  }, [reviews, user]);

  if (artworkLoading) return <PageLoader />;
  if (!artwork) return <Text>Artwork not found</Text>;

  const isOwner = user?.id === artwork.artistId;
  const canInteract = isAuthenticated && !isOwner;

  const averageRating =
    reviews && reviews.length > 0
      ? reviews.reduce((sum: number, r: any) => sum + r.rating, 0) /
        reviews.length
      : 0;

  const reviewsCount = reviews?.length || 0;

  const handleSubmitReview = () => {
    if (!isAuthenticated) {
      Alert.alert("Login Required", "Please login to rate this artwork.");
      return;
    }

    if (isOwner) {
      Alert.alert("Not allowed", "You cannot review your own artwork.");
      return;
    }

    if (userRating === 0) {
      Alert.alert("Error", "Please select a rating (1-5 stars).");
      return;
    }

    createReview(
      {
        artworkId: id!,
        rating: userRating,
        comment: userComment.trim() || undefined,
      },
      {
        onSuccess: () => {
          refetchReviews();
          setHasReviewed(true);
        },
      }
    );
  };

  return (
    <>
      <ScrollView className="flex-1 bg-stone-50">
        {/* Artwork Image */}
        <View className="relative">
          <Image
            source={{ uri: artwork.imageUrl }}
            className="w-full aspect-square"
            resizeMode="cover"
          />

          <TouchableOpacity
            onPress={() => router.back()}
            className="absolute top-4 left-4 p-2 bg-white/80 rounded-full"
          >
            <Ionicons name="arrow-back" size={24} color="#44403c" />
          </TouchableOpacity>
        </View>

        <View className="p-4">
          {/* Title & Artist */}
          <Text className="font-display text-2xl font-bold text-stone-800">
            {artwork.title}
          </Text>

          <Link href={`/galleries/${artwork.artistId}`}>
            <Text className="text-gallery-600 text-base mt-1">
              by {artwork.artistName}
            </Text>
          </Link>

          {/* Average Rating */}
          <View className="flex-row items-center gap-2 mt-2">
            <RatingStars rating={Math.round(averageRating)} readonly size="sm" />
            <Text className="text-stone-500 text-sm">
              ({reviewsCount} {reviewsCount === 1 ? "review" : "reviews"})
            </Text>
          </View>

          {/* Description */}
          {artwork.description && (
            <Text className="text-stone-600 mt-4 leading-relaxed">
              {artwork.description}
            </Text>
          )}

          {/* Details Chips */}
          <View className="flex-row flex-wrap gap-3 mt-4">
            {artwork.dimensions && (
              <InfoChip
                icon="📏"
                label="Dimensions"
                value={artwork.dimensions}
              />
            )}

            {artwork.materials && (
              <InfoChip
                icon="🎨"
                label="Materials"
                value={artwork.materials}
              />
            )}

            {artwork.year && (
              <InfoChip icon="📅" label="Year" value={String(artwork.year)} />
            )}
          </View>

          {/* Price & Cart */}
          {artwork.price != null && (
            <View className="mt-6 flex-row justify-between items-center">
              <View>
                <Text className="text-xs text-stone-500">Price</Text>
                <Text className="text-2xl font-bold text-gallery-600">
                  {formatPrice(artwork.price)}
                </Text>
              </View>

              {!isOwner && (
                <Button
                  onPress={() =>
                    addItem({
                      artworkId: artwork.id,
                      title: artwork.title,
                      imageUrl: artwork.imageUrl,
                      artistName: artwork.artistName ?? "Unknown",
                      price: artwork.price ?? 0,
                    })
                  }
                >
                  Add to Cart
                </Button>
              )}
            </View>
          )}

          {/* Preview Buttons */}
          <View className="mt-5 gap-3">
            <TouchableOpacity
              onPress={() => setShowAR(true)}
              className="bg-gallery-600 py-3 rounded-xl items-center flex-row justify-center"
            >
              <Ionicons name="camera-outline" size={20} color="white" />
              <Text className="text-white font-semibold ml-2">
                Preview in Your Home AR
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setShow3D(true)}
              className="bg-stone-800 py-3 rounded-xl items-center flex-row justify-center"
            >
              <Ionicons name="cube-outline" size={20} color="white" />
              <Text className="text-white font-semibold ml-2">
                View in 3D
              </Text>
            </TouchableOpacity>
          </View>

          {/* Rating Form */}
          <View className="mt-8 pt-4 border-t border-stone-200">
            <Text className="text-lg font-semibold text-stone-800 mb-3">
              Rate this artwork
            </Text>

            {!isAuthenticated ? (
              <Text className="text-stone-500 text-sm">
                Please login to leave a review.
              </Text>
            ) : isOwner ? (
              <View className="bg-stone-100 p-4 rounded-xl">
                <Text className="text-stone-500 text-sm">
                  This is your artwork. You cannot review your own artwork.
                </Text>
              </View>
            ) : hasReviewed ? (
              <View className="bg-stone-100 p-4 rounded-xl">
                <View className="flex-row items-center gap-2">
                  <RatingStars rating={userRating} readonly size="md" />
                  <Text className="text-stone-600 text-sm">
                    You rated this {userRating} stars
                  </Text>
                </View>

                {userComment ? (
                  <Text className="text-stone-500 text-sm mt-2">
                    "{userComment}"
                  </Text>
                ) : null}
              </View>
            ) : (
              <View>
                <Text className="text-stone-700 text-sm mb-1">
                  Your Rating
                </Text>

                <RatingStars
                  rating={userRating}
                  onRatingChange={setUserRating}
                  size="lg"
                  interactive
                />

                <TextInput
                  className="border border-stone-200 rounded-xl p-3 text-stone-800 mt-3"
                  placeholder="Write your review (optional)"
                  value={userComment}
                  onChangeText={setUserComment}
                  multiline
                  numberOfLines={3}
                />

                <Button
                  onPress={handleSubmitReview}
                  isLoading={isSubmittingReview}
                  className="mt-3"
                >
                  Submit Review
                </Button>
              </View>
            )}
          </View>

          {/* Reviews List with Comments */}
          {reviews && reviews.length > 0 && (
            <View className="mt-6">
              <Text className="text-lg font-semibold text-stone-800 mb-3">
                All Reviews
              </Text>

              {reviews.map((review: any) => (
                <View
                  key={review.id}
                  className="bg-white rounded-xl p-4 mb-4 border border-stone-100"
                >
                  <View className="flex-row items-start gap-3">
                    <View className="w-8 h-8 rounded-full bg-gallery-100 items-center justify-center">
                      <Text className="text-sm font-semibold text-gallery-700">
                        {review.userName?.charAt(0).toUpperCase() || "U"}
                      </Text>
                    </View>

                    <View className="flex-1">
                      <Text className="font-medium text-stone-800">
                        {review.userName}
                      </Text>

                      <RatingStars rating={review.rating} readonly size="sm" />

                      {review.comment && (
                        <Text className="text-stone-600 text-sm mt-1">
                          {review.comment}
                        </Text>
                      )}

                      <Text className="text-xs text-stone-400 mt-2">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </Text>

                      <CommentSection
                        reviewId={review.id}
                        comments={review.comments || []}
                        canComment={canInteract}
                      />
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* AR Modal */}
      {showAR && (
        <ARView
          artwork={{
            id: artwork.id,
            title: artwork.title,
            imageUrl: artwork.imageUrl,
          }}
          onClose={() => setShowAR(false)}
        />
      )}

      {/* 3D Modal */}
      {show3D && (
        <View className="absolute inset-0 z-50">
          <ModelViewer3D
            artwork={{
              id: artwork.id,
              title: artwork.title,
              imageUrl: artwork.imageUrl,
            }}
            onClose={() => setShow3D(false)}
          />
        </View>
      )}
    </>
  );
}

function InfoChip({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <View className="bg-stone-100 rounded-xl p-3 flex-1 min-w-[40%]">
      <Text className="text-xs text-stone-500">
        {icon} {label}
      </Text>
      <Text className="text-sm font-semibold text-stone-800">{value}</Text>
    </View>
  );
}